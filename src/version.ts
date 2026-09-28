import { useEffect, useState } from "react";

// Fallback desktop version — shown until the live GitHub Releases lookup
// resolves, and whenever that lookup is unavailable (offline / rate-limited).
// `useLatestVersion()` below is the real source of truth, so this constant no
// longer has to be kept exactly in sync; bumping it just keeps the no-JS /
// first-paint value sensible. The DMG itself is always served from
// releases/latest/download/Prevail-mac-arm64.dmg regardless of this value.
export const APP_VERSION = "0.4.1";

// Live latest version, fetched from GitHub Releases so the site never drifts
// stale the way a hand-stamped constant does. Null until the fetch resolves
// (or forever, on error/rate-limit) — callers that need a guaranteed-correct
// value (like a versioned download URL) must treat null as "unknown".
export function useLiveVersion(): string | null {
  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("https://api.github.com/repos/fru-dev3/prevail-desktop/releases/latest")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j || typeof j.tag_name !== "string") return;
        setVersion(j.tag_name.replace(/^v/, ""));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return version;
}

// Display version: the live value when known, APP_VERSION as first-paint fallback.
export function useLatestVersion(): string {
  return useLiveVersion() ?? APP_VERSION;
}
