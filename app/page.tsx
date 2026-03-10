import { HomePageShell } from "@/components/home-page-shell";
import { getPublicRegistryItems } from "@/lib/data";
import { hasClientEnv, serverEnv } from "@/lib/env";

export default async function HomePage() {
  const items = hasClientEnv() && serverEnv.success ? await getPublicRegistryItems() : [];
  return <HomePageShell items={items} />;
}
