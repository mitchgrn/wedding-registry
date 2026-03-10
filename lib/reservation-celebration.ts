export const celebrationVisibleMs = 3200;
export const celebrationExitMs = 550;
export const recentReservationWindowMs = 15000;
export const confettiPieces = [
  { left: "4%", drift: "-42px", rotate: "-24deg", delay: "0ms", duration: "1180ms", color: "rgba(0, 126, 167, 1)" },
  { left: "10%", drift: "18px", rotate: "34deg", delay: "45ms", duration: "1240ms", color: "rgba(0, 168, 232, 0.98)" },
  { left: "18%", drift: "-12px", rotate: "-32deg", delay: "120ms", duration: "1120ms", color: "rgba(255, 184, 0, 0.96)" },
  { left: "26%", drift: "34px", rotate: "22deg", delay: "70ms", duration: "1200ms", color: "rgba(0, 52, 89, 0.92)" },
  { left: "34%", drift: "-26px", rotate: "-18deg", delay: "160ms", duration: "1280ms", color: "rgba(16, 185, 129, 0.92)" },
  { left: "42%", drift: "26px", rotate: "38deg", delay: "20ms", duration: "1140ms", color: "rgba(0, 126, 167, 0.94)" },
  { left: "50%", drift: "-18px", rotate: "-40deg", delay: "90ms", duration: "1220ms", color: "rgba(0, 168, 232, 1)" },
  { left: "58%", drift: "28px", rotate: "26deg", delay: "140ms", duration: "1160ms", color: "rgba(255, 184, 0, 0.94)" },
  { left: "66%", drift: "-34px", rotate: "-28deg", delay: "60ms", duration: "1260ms", color: "rgba(0, 52, 89, 0.9)" },
  { left: "74%", drift: "22px", rotate: "30deg", delay: "180ms", duration: "1180ms", color: "rgba(16, 185, 129, 0.9)" },
  { left: "84%", drift: "-20px", rotate: "-20deg", delay: "110ms", duration: "1100ms", color: "rgba(0, 126, 167, 0.95)" },
  { left: "92%", drift: "30px", rotate: "16deg", delay: "35ms", duration: "1210ms", color: "rgba(0, 168, 232, 0.95)" },
] as const;

const storagePrefix = "reservation-celebration:";

function getStorageKey(itemId: string) {
  return `${storagePrefix}${itemId}`;
}

export function markReservationCelebrated(itemId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(getStorageKey(itemId), String(Date.now()));
}

export function hasRecentReservationCelebration(itemId: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const value = window.sessionStorage.getItem(getStorageKey(itemId));
  if (!value) {
    return false;
  }

  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) {
    window.sessionStorage.removeItem(getStorageKey(itemId));
    return false;
  }

  const isRecent = Date.now() - timestamp <= recentReservationWindowMs;
  if (!isRecent) {
    window.sessionStorage.removeItem(getStorageKey(itemId));
  }

  return isRecent;
}

export function clearReservationCelebration(itemId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(getStorageKey(itemId));
}
