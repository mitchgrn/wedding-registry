import * as cheerio from "cheerio";
import { formatCurrency } from "@/lib/utils";

type PriceLookupResult = {
  status: "success" | "failed";
  amount: number | null;
  currency: string | null;
  displayPrice: string | null;
  source: string | null;
};

export type ProductScrapeResult = {
  resolvedUrl: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  price: PriceLookupResult;
};

type ProductDocument = {
  finalUrl: string;
  html: string;
  $: cheerio.CheerioAPI;
};

type JsonLdNode = {
  "@type"?: string | string[];
  "@graph"?: JsonLdNode[];
  name?: string;
  title?: string;
  description?: string;
  image?: string | string[] | { url?: string } | Array<{ url?: string }>;
  offers?: JsonLdNode | JsonLdNode[];
  price?: string | number;
  priceCurrency?: string;
};

type EmbeddedProductCandidate = {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  price: {
    amount: number | null;
    currency: string | null;
  };
  score: number;
};

type JsonRecord = Record<string, unknown>;

const PRICE_REGEX = /([$€£])\s?(\d{1,3}(?:[,\d]{0,8})?(?:\.\d{2})?)/;
const NUMBER_PRICE_REGEX = /\b(\d{1,5}(?:[,\d]{0,8})?(?:\.\d{2})?)\b/;

function normalizeWhitespace(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function normalizePrice(value: string) {
  const match = normalizeWhitespace(value).match(PRICE_REGEX);

  if (!match) {
    return null;
  }

  const currencyMap: Record<string, string> = {
    $: "USD",
    "€": "EUR",
    "£": "GBP",
  };

  const amount = Number(match[2].replace(/,/g, ""));
  if (Number.isNaN(amount)) {
    return null;
  }

  return {
    amount,
    currency: currencyMap[match[1]] ?? "USD",
    displayPrice: match[0].replace(/\s+/g, ""),
  };
}

function inferCurrencyFromHost(host: string | null) {
  if (!host) {
    return "USD";
  }

  if (host.endsWith(".ca")) {
    return "CAD";
  }

  if (host.endsWith(".co.uk")) {
    return "GBP";
  }

  if (host.endsWith(".de") || host.endsWith(".fr") || host.endsWith(".it") || host.endsWith(".es")) {
    return "EUR";
  }

  return "USD";
}

function firstNonEmpty(...values: Array<string | undefined | null>) {
  for (const value of values) {
    const trimmed = normalizeWhitespace(value);
    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseJsonSafely<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function decodeScriptString(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  try {
    return JSON.parse(`"${normalized.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  } catch {
    return normalized;
  }
}

function cleanupTitle(title: string | null) {
  if (!title) {
    return null;
  }

  const trimmed = normalizeWhitespace(title);
  const split = trimmed.split(/\s[|\-–:]\s/);

  if (split.length > 1) {
    const firstSegment = split[0]?.trim();
    if (firstSegment && firstSegment.length >= 8) {
      return firstSegment;
    }
  }

  return trimmed;
}

function toAbsoluteUrl(rawUrl: string | null, pageUrl: string) {
  if (!rawUrl) {
    return null;
  }

  try {
    return new URL(rawUrl, pageUrl).toString();
  } catch {
    return rawUrl;
  }
}

function getHost(url: string | null) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isAmazonHost(host: string | null) {
  return Boolean(host && (host.includes("amazon.") || host === "a.co"));
}

function isCostcoHost(host: string | null) {
  return Boolean(host && host.includes("costco."));
}

function extractAmazonAsin(url: string) {
  const match = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function humanizeAmazonSlug(url: string) {
  const match = url.match(/amazon\.[^/]+\/([^/]+)\/(?:dp|gp\/product)\//i);
  if (!match?.[1]) {
    return null;
  }

  const title = match[1]
    .split("-")
    .filter(Boolean)
    .join(" ")
    .trim();

  return title ? cleanupTitle(title) : null;
}

function getAmazonUrlFallback(url: string) {
  const host = getHost(url);
  const asin = extractAmazonAsin(url);

  if (!host || !asin) {
    return {
      resolvedUrl: url,
      title: humanizeAmazonSlug(url),
    };
  }

  return {
    resolvedUrl: `https://${host}/dp/${asin}`,
    title: humanizeAmazonSlug(url),
  };
}

function cleanupResolvedUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";

    if (isAmazonHost(parsed.hostname)) {
      const asin = extractAmazonAsin(parsed.toString());
      if (asin) {
        parsed.pathname = `/dp/${asin}`;
        parsed.search = "";
      }
    } else if (isCostcoHost(parsed.hostname)) {
      for (const key of [...parsed.searchParams.keys()]) {
        if (key.toLowerCase().startsWith("utm_") || key === "NATAPP") {
          parsed.searchParams.delete(key);
        }
      }
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

function getJsonLdNodes($: cheerio.CheerioAPI) {
  const scripts = $('script[type="application/ld+json"]')
    .map((_, element) => $(element).html() ?? "")
    .get();
  const nodes: JsonLdNode[] = [];

  for (const script of scripts) {
    const parsed = parseJsonSafely<unknown>(script);
    if (!parsed) {
      continue;
    }

    const rootNodes = Array.isArray(parsed) ? parsed : [parsed];

    for (const rootNode of rootNodes) {
      if (!isRecord(rootNode)) {
        continue;
      }

      nodes.push(rootNode as JsonLdNode);
      const graph = (rootNode as JsonLdNode)["@graph"];
      if (Array.isArray(graph)) {
        nodes.push(...graph);
      }
    }
  }

  return nodes;
}

function hasType(node: JsonLdNode, expected: string) {
  const type = node["@type"];
  if (!type) {
    return false;
  }

  return Array.isArray(type) ? type.includes(expected) : type === expected;
}

function extractImageValue(image: JsonLdNode["image"]) {
  if (!image) {
    return null;
  }

  if (typeof image === "string") {
    return image;
  }

  if (Array.isArray(image)) {
    const first = image[0];
    return typeof first === "string" ? first : first?.url ?? null;
  }

  return image.url ?? null;
}

function extractJsonLdProduct($: cheerio.CheerioAPI) {
  const nodes = getJsonLdNodes($);

  for (const node of nodes) {
    if (!hasType(node, "Product")) {
      continue;
    }

    return {
      title: cleanupTitle(firstNonEmpty(node.name, node.title)),
      description: normalizeWhitespace(node.description) || null,
      imageUrl: extractImageValue(node.image),
    };
  }

  return null;
}

function extractJsonLdPrice($: cheerio.CheerioAPI) {
  const nodes = getJsonLdNodes($);

  for (const node of nodes) {
    const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
    const price = offers?.price ?? node.price;
    const currency = offers?.priceCurrency ?? node.priceCurrency;

    if (price !== undefined && price !== null) {
      const amount = Number(price);
      if (!Number.isNaN(amount)) {
        const normalizedCurrency = currency ?? "USD";
        return {
          amount,
          currency: normalizedCurrency,
          displayPrice: formatCurrency(amount, normalizedCurrency),
          source: "json-ld",
        };
      }
    }
  }

  return null;
}

function getScriptContents($: cheerio.CheerioAPI) {
  return $("script")
    .map((_, element) => $(element).html() ?? "")
    .get()
    .map((value) => value.trim())
    .filter(Boolean);
}

function extractBalancedJsonSlice(input: string) {
  const start = input.search(/[{[]/);
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let index = start; index < input.length; index += 1) {
    const char = input[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "{" || char === "[") {
      depth += 1;
      continue;
    }

    if (char === "}" || char === "]") {
      depth -= 1;
      if (depth === 0) {
        return input.slice(start, index + 1);
      }
    }
  }

  return null;
}

function getEmbeddedJsonNodes($: cheerio.CheerioAPI) {
  const nodes: unknown[] = [];

  for (const script of getScriptContents($)) {
    const direct = parseJsonSafely<unknown>(script);
    if (direct) {
      nodes.push(direct);
      continue;
    }

    const balanced = extractBalancedJsonSlice(script);
    if (!balanced) {
      continue;
    }

    const parsed = parseJsonSafely<unknown>(balanced);
    if (parsed) {
      nodes.push(parsed);
    }
  }

  return nodes;
}

function coercePriceResult(amount: number, currency: string | null, source: string): PriceLookupResult {
  const normalizedCurrency = currency ?? "USD";
  return {
    status: "success",
    amount,
    currency: normalizedCurrency,
    displayPrice: formatCurrency(amount, normalizedCurrency),
    source,
  };
}

function extractPriceFromStringCandidate(value: string | null | undefined, host: string | null, source: string) {
  const normalized = value ? normalizePrice(value) : null;
  if (!normalized) {
    return null;
  }

  const currency = normalized.currency === "USD" ? inferCurrencyFromHost(host) : normalized.currency;
  return {
    status: "success" as const,
    amount: normalized.amount,
    currency,
    displayPrice: formatCurrency(normalized.amount, currency) ?? normalized.displayPrice,
    source,
  };
}

function pickFromKeys(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && normalizeWhitespace(value)) {
      return normalizeWhitespace(value);
    }
  }

  return null;
}

function extractImageFromUnknown(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const normalized = normalizeWhitespace(value);
    return normalized || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const image = extractImageFromUnknown(item);
      if (image) {
        return image;
      }
    }
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const direct = pickFromKeys(value, ["url", "imageUrl", "src", "large", "hiRes", "link"]);
  if (direct) {
    return direct;
  }

  for (const nestedValue of Object.values(value)) {
    const image = extractImageFromUnknown(nestedValue);
    if (image) {
      return image;
    }
  }

  return null;
}

function extractNumericPriceFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = normalizeWhitespace(value);
    const price = normalizePrice(normalized);
    if (price) {
      return price.amount;
    }

    const numeric = normalized.match(NUMBER_PRICE_REGEX);
    if (numeric) {
      const amount = Number(numeric[1].replace(/,/g, ""));
      return Number.isNaN(amount) ? null : amount;
    }
  }

  return null;
}

function extractPriceDataFromRecord(
  record: JsonRecord,
  host: string | null,
): {
  amount: number | null;
  currency: string | null;
} {
  const directPriceKeys = ["price", "priceAmount", "currentPrice", "salePrice", "value", "amount"];
  const currencyKeys = ["priceCurrency", "currency", "currencyCode"];

  for (const key of directPriceKeys) {
    const amount = extractNumericPriceFromUnknown(record[key]);
    if (amount !== null) {
      const currency = pickFromKeys(record, currencyKeys);
      return {
        amount,
        currency: currency ?? inferCurrencyFromHost(host),
      };
    }
  }

  for (const nestedKey of ["offers", "price", "pricing", "priceToPay", "purchaseOptions"]) {
    const nested = record[nestedKey];
    if (!nested) {
      continue;
    }

    if (Array.isArray(nested)) {
      for (const item of nested) {
        if (!isRecord(item)) {
          continue;
        }

        const result = extractPriceDataFromRecord(item, host);
        if (result.amount !== null) {
          return result;
        }
      }
      continue;
    }

    if (isRecord(nested)) {
      const result = extractPriceDataFromRecord(nested, host);
      if (result.amount !== null) {
        return result;
      }
    }
  }

  return {
    amount: null,
    currency: inferCurrencyFromHost(host),
  };
}

function scoreProductCandidate(candidate: EmbeddedProductCandidate) {
  let score = 0;
  if (candidate.title) {
    score += 4;
  }
  if (candidate.imageUrl) {
    score += 2;
  }
  if (candidate.description) {
    score += 1;
  }
  if (candidate.price.amount !== null) {
    score += 3;
  }
  return score;
}

function buildEmbeddedProductCandidate(record: JsonRecord, host: string | null): EmbeddedProductCandidate | null {
  const title = cleanupTitle(pickFromKeys(record, ["name", "title", "productName", "seoTitle"]));
  const description = pickFromKeys(record, ["description", "seoDescription", "shortDescription"]);
  const imageUrl = extractImageFromUnknown(
    record.image ?? record.images ?? record.primaryImage ?? record.primaryImageUrl ?? record.media,
  );
  const price = extractPriceDataFromRecord(record, host);

  const candidate: EmbeddedProductCandidate = {
    title,
    description,
    imageUrl,
    price,
    score: 0,
  };

  candidate.score = scoreProductCandidate(candidate);
  return candidate.score > 0 ? candidate : null;
}

function findBestEmbeddedProduct(value: unknown, host: string | null): EmbeddedProductCandidate | null {
  let best: EmbeddedProductCandidate | null = null;

  function visit(node: unknown) {
    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item);
      }
      return;
    }

    if (typeof node === "string") {
      const maybeJson = parseJsonSafely<unknown>(node);
      if (maybeJson) {
        visit(maybeJson);
      }
      return;
    }

    if (!isRecord(node)) {
      return;
    }

    const candidate = buildEmbeddedProductCandidate(node, host);
    if (candidate && (!best || candidate.score > best.score)) {
      best = candidate;
    }

    for (const nestedValue of Object.values(node)) {
      visit(nestedValue);
    }
  }

  visit(value);
  return best;
}

function extractEmbeddedProduct($: cheerio.CheerioAPI, host: string | null) {
  let best: EmbeddedProductCandidate | null = null;

  for (const node of getEmbeddedJsonNodes($)) {
    const candidate = findBestEmbeddedProduct(node, host);
    if (candidate && (!best || candidate.score > best.score)) {
      best = candidate;
    }
  }

  return best;
}

function extractRegexMatch(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = match?.[1];
    if (value) {
      return decodeScriptString(value);
    }
  }

  return null;
}

function extractNumericRegexPrice(html: string, patterns: RegExp[], host: string | null, source: string) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const rawAmount = match?.[1];
    if (!rawAmount) {
      continue;
    }

    const amount = Number(rawAmount.replace(/,/g, ""));
    if (Number.isNaN(amount)) {
      continue;
    }

    const currency = decodeScriptString(match?.[2]) ?? inferCurrencyFromHost(host);
    return coercePriceResult(amount, currency, source);
  }

  return null;
}

async function fetchProductDocument(url: string): Promise<ProductDocument | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "upgrade-insecure-requests": "1",
      },
      cache: "no-store",
      redirect: "follow",
    });

    const html = await response.text();
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

    if (!html.trim() || (!response.ok && !contentType.includes("text/html"))) {
      return null;
    }

    return {
      finalUrl: response.url,
      html,
      $: cheerio.load(html),
    };
  } catch {
    return null;
  }
}

function extractGenericPrice(document: ProductDocument, host: string | null): PriceLookupResult {
  const fromJsonLd = extractJsonLdPrice(document.$);
  if (fromJsonLd) {
    return { status: "success", ...fromJsonLd };
  }

  const embedded = extractEmbeddedProduct(document.$, host);
  if (embedded && embedded.price.amount !== null) {
    return coercePriceResult(embedded.price.amount, embedded.price.currency, "embedded-json");
  }

  const candidates = [
    document.$('meta[property="product:price:amount"]').attr("content"),
    document.$('meta[name="twitter:data1"]').attr("content"),
    document.$('meta[itemprop="price"]').attr("content"),
    document.$('[data-test="product-price"]').first().text(),
    document.$('[data-testid*="price"]').first().text(),
    document.$('[class*="price"]').first().text(),
    document.$("body").text().slice(0, 12000),
  ];

  for (const candidate of candidates) {
    const result = extractPriceFromStringCandidate(candidate, host, "html");
    if (result) {
      return result;
    }
  }

  return { status: "failed", amount: null, currency: null, displayPrice: null, source: null };
}

function extractAmazonTitle(document: ProductDocument) {
  return cleanupTitle(
    firstNonEmpty(
      document.$("#productTitle").text(),
      document.$("#title span").text(),
      document.$('meta[name="title"]').attr("content"),
      extractRegexMatch(document.html, [/"title"\s*:\s*"([^"]+)"/i]),
    ),
  );
}

function extractAmazonDescription(document: ProductDocument) {
  const bulletItems = document.$("#feature-bullets li .a-list-item")
    .map((_, element) => normalizeWhitespace(document.$(element).text()))
    .get()
    .filter(Boolean);

  return firstNonEmpty(
    bulletItems.slice(0, 3).join(" "),
    document.$("#bookDescription_feature_div").text(),
    document.$('meta[name="description"]').attr("content"),
  );
}

function extractAmazonImage(document: ProductDocument, url: string) {
  return toAbsoluteUrl(
    firstNonEmpty(
      document.$("#landingImage").attr("data-old-hires"),
      document.$("#landingImage").attr("src"),
      document.$("#imgTagWrapperId img").attr("data-old-hires"),
      document.$('meta[property="og:image"]').attr("content"),
      extractRegexMatch(document.html, [
        /"hiRes"\s*:\s*"([^"]+)"/i,
        /"large"\s*:\s*"([^"]+)"/i,
        /"mainUrl"\s*:\s*"([^"]+)"/i,
      ]),
    ),
    url,
  );
}

function extractAmazonPrice(document: ProductDocument, host: string | null): PriceLookupResult {
  const selectorCandidates = [
    document.$("#corePrice_feature_div .a-offscreen").first().text(),
    document.$("#corePriceDisplay_desktop_feature_div .a-offscreen").first().text(),
    document.$("#tp_price_block_total_price_ww .a-offscreen").first().text(),
    document.$(".apexPriceToPay .a-offscreen").first().text(),
    document.$(".a-price .a-offscreen").first().text(),
  ];

  for (const candidate of selectorCandidates) {
    const result = extractPriceFromStringCandidate(candidate, host, "amazon-html");
    if (result) {
      return result;
    }
  }

  const embedded = extractEmbeddedProduct(document.$, host);
  if (embedded && embedded.price.amount !== null) {
    return coercePriceResult(embedded.price.amount, embedded.price.currency, "amazon-embedded-json");
  }

  const regexPrice = extractNumericRegexPrice(
    document.html,
    [
      /"priceAmount"\s*:\s*"?(\d+(?:\.\d+)?)"?(?:,\s*"priceCurrency"\s*:\s*"([^"]+)")?/i,
      /"priceToPay"\s*:\s*\{[^}]*"price"\s*:\s*"?(\d+(?:\.\d+)?)"?(?:[^}]*"currency"\s*:\s*"([^"]+)")?/i,
      /"displayPrice"\s*:\s*"\$?(\d+(?:\.\d+)?)"/i,
    ],
    host,
    "amazon-regex",
  );

  if (regexPrice) {
    return regexPrice;
  }

  return extractGenericPrice(document, host);
}

function scrapeAmazonDocument(document: ProductDocument, inputUrl: string): ProductScrapeResult {
  const fallback = getAmazonUrlFallback(document.finalUrl || inputUrl);
  const host = getHost(document.finalUrl);

  return {
    resolvedUrl: cleanupResolvedUrl(fallback.resolvedUrl ?? document.finalUrl),
    title: extractAmazonTitle(document) ?? fallback.title,
    description: extractAmazonDescription(document),
    imageUrl: extractAmazonImage(document, document.finalUrl),
    price: extractAmazonPrice(document, host),
  };
}

function extractCostcoTitle(document: ProductDocument) {
  return cleanupTitle(
    firstNonEmpty(
      document.$("h1").first().text(),
      document.$('[automation-id="productName"]').first().text(),
      document.$('meta[property="og:title"]').attr("content"),
      extractRegexMatch(document.html, [/"productName"\s*:\s*"([^"]+)"/i, /"name"\s*:\s*"([^"]+)"/i]),
    ),
  );
}

function extractCostcoDescription(document: ProductDocument) {
  const embedded = extractEmbeddedProduct(document.$, getHost(document.finalUrl));

  return firstNonEmpty(
    embedded?.description,
    document.$('meta[property="og:description"]').attr("content"),
    document.$('meta[name="description"]').attr("content"),
    document.$('[data-testid="product-description"]').first().text(),
  );
}

function extractCostcoImage(document: ProductDocument) {
  const embedded = extractEmbeddedProduct(document.$, getHost(document.finalUrl));

  return toAbsoluteUrl(
    firstNonEmpty(
      embedded?.imageUrl,
      document.$('meta[property="og:image"]').attr("content"),
      document.$('meta[name="twitter:image"]').attr("content"),
      document.$("img").first().attr("src"),
      extractRegexMatch(document.html, [
        /"primaryImageUrl"\s*:\s*"([^"]+)"/i,
        /"imageUrl"\s*:\s*"([^"]+)"/i,
      ]),
    ),
    document.finalUrl,
  );
}

function extractCostcoPrice(document: ProductDocument, host: string | null): PriceLookupResult {
  const selectorCandidates = [
    document.$('[automation-id="productPriceOutput"]').first().text(),
    document.$('[data-testid*="price"]').first().text(),
    document.$('[class*="price"]').first().text(),
  ];

  for (const candidate of selectorCandidates) {
    const result = extractPriceFromStringCandidate(candidate, host, "costco-html");
    if (result) {
      return result;
    }
  }

  const embedded = extractEmbeddedProduct(document.$, host);
  if (embedded && embedded.price.amount !== null) {
    return coercePriceResult(embedded.price.amount, embedded.price.currency, "costco-embedded-json");
  }

  const regexPrice = extractNumericRegexPrice(
    document.html,
    [
      /"currentPrice"\s*:\s*"?(\d+(?:\.\d+)?)"?(?:,\s*"currency(?:Code)?"\s*:\s*"([^"]+)")?/i,
      /"price"\s*:\s*\{[^}]*"value"\s*:\s*"?(\d+(?:\.\d+)?)"?(?:[^}]*"currency(?:Code)?"\s*:\s*"([^"]+)")?/i,
      /"price"\s*:\s*"?(\d+(?:\.\d+)?)"?(?:,\s*"priceCurrency"\s*:\s*"([^"]+)")?/i,
    ],
    host,
    "costco-regex",
  );

  if (regexPrice) {
    return regexPrice;
  }

  return extractGenericPrice(document, host);
}

function scrapeCostcoDocument(document: ProductDocument): ProductScrapeResult {
  const host = getHost(document.finalUrl);

  return {
    resolvedUrl: cleanupResolvedUrl(document.finalUrl),
    title: extractCostcoTitle(document),
    description: extractCostcoDescription(document),
    imageUrl: extractCostcoImage(document),
    price: extractCostcoPrice(document, host),
  };
}

function scrapeGenericDocument(document: ProductDocument): ProductScrapeResult {
  const host = getHost(document.finalUrl);
  const jsonLdProduct = extractJsonLdProduct(document.$);
  const embedded = extractEmbeddedProduct(document.$, host);

  const title = firstNonEmpty(
    jsonLdProduct?.title,
    embedded?.title,
    document.$('meta[property="product:title"]').attr("content"),
    document.$('meta[property="og:title"]').attr("content"),
    document.$('meta[name="twitter:title"]').attr("content"),
    document.$("h1").first().text(),
    cleanupTitle(document.$("title").text()),
  );

  const description = firstNonEmpty(
    jsonLdProduct?.description,
    embedded?.description,
    document.$('meta[property="og:description"]').attr("content"),
    document.$('meta[name="description"]').attr("content"),
    document.$('meta[name="twitter:description"]').attr("content"),
  );

  const imageUrl = toAbsoluteUrl(
    firstNonEmpty(
      jsonLdProduct?.imageUrl,
      embedded?.imageUrl,
      document.$('meta[property="product:image"]').attr("content"),
      document.$('meta[property="og:image"]').attr("content"),
      document.$('meta[name="twitter:image"]').attr("content"),
      document.$("img").first().attr("src"),
    ),
    document.finalUrl,
  );

  return {
    resolvedUrl: cleanupResolvedUrl(document.finalUrl),
    title,
    description,
    imageUrl,
    price: extractGenericPrice(document, host),
  };
}

export async function lookupPrice(url: string): Promise<PriceLookupResult> {
  const document = await fetchProductDocument(url);

  if (!document) {
    return { status: "failed", amount: null, currency: null, displayPrice: null, source: null };
  }

  const host = getHost(document.finalUrl);

  if (isAmazonHost(host)) {
    return extractAmazonPrice(document, host);
  }

  if (isCostcoHost(host)) {
    return extractCostcoPrice(document, host);
  }

  return extractGenericPrice(document, host);
}

export async function scrapeProductPage(url: string): Promise<ProductScrapeResult> {
  const document = await fetchProductDocument(url);
  const hostFromInput = getHost(url);

  if (!document) {
    if (isAmazonHost(hostFromInput)) {
      const fallback = getAmazonUrlFallback(url);

      return {
        resolvedUrl: fallback.resolvedUrl,
        title: fallback.title,
        description: null,
        imageUrl: null,
        price: { status: "failed", amount: null, currency: null, displayPrice: null, source: null },
      };
    }

    return {
      resolvedUrl: null,
      title: null,
      description: null,
      imageUrl: null,
      price: { status: "failed", amount: null, currency: null, displayPrice: null, source: null },
    };
  }

  const host = getHost(document.finalUrl);

  if (isAmazonHost(host)) {
    return scrapeAmazonDocument(document, url);
  }

  if (isCostcoHost(host)) {
    return scrapeCostcoDocument(document);
  }

  return scrapeGenericDocument(document);
}
