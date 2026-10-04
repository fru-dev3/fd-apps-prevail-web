import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion, MotionConfig } from "framer-motion";
import {
  ArrowRight,
  Activity,
  BarChart3,
  Boxes,
  EyeOff,
  Landmark,
  LayoutGrid,
  Monitor,
  Plug,
  RefreshCw,
  RotateCw,
  Send,
  Wallet,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Download,
  FileText,
  GraduationCap,
  Heart,
  Layers,
  Menu,
  Moon,
  Paperclip,
  Pause,
  Play,
  Receipt,
  Rocket,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  Compass,
  Terminal,
  TrendingUp,
  Users,
  X,
  MessagesSquare,
  CalendarDays,
  FolderKanban,
  Inbox,
  BookOpen,
} from "lucide-react";
import {
  siApple,
  siClaude,
  siGooglegemini,
  siOllama,
  siProducthunt,
} from "simple-icons";
import { APP_VERSION, useLatestVersion, useLiveVersion } from "./version";

const GITHUB_DESKTOP = "https://github.com/fru-dev3/prevail-desktop";
const PRODUCT_HUNT_URL = "https://www.producthunt.com/products/prevail-2?launch=prevail";
// Download is served from GitHub Releases, NOT this site. GitHub has no
// bandwidth limit for release assets; serving a ~32 MB DMG from Netlify blew
// the free-tier bandwidth quota and took the whole site down. `latest/download`
// + the stable asset name `Prevail-mac-arm64.dmg` (uploaded by the release
// workflow) keeps the URL fixed across versions.
const DMG_URL =
  "https://github.com/fru-dev3/prevail-desktop/releases/latest/download/Prevail-mac-arm64.dmg";
const DMG_NAME = `Prevail-${APP_VERSION}-arm64.dmg`;

// Download link. Once GitHub confirms the latest version, link to the
// version-named asset (CI publishes Prevail_<ver>_aarch64.dmg on every
// release) so the saved file says exactly what it is; until then, the
// stable alias above. (`download=` is ignored cross-origin, so the
// filename must come from the asset itself.)
function useDmgDownload(): { url: string; name: string } {
  const live = useLiveVersion();
  if (live)
    return {
      url: `${GITHUB_DESKTOP}/releases/download/v${live}/Prevail_${live}_aarch64.dmg`,
      name: `Prevail_${live}_aarch64.dmg`,
    };
  return { url: DMG_URL, name: DMG_NAME };
}

// Windows installer (NSIS). Same scheme as the DMG: a stable `latest/download`
// alias (Prevail-windows-x64-setup.exe, uploaded by the release workflow) until
// the live version resolves, then the version-named asset CI publishes.
const EXE_URL =
  "https://github.com/fru-dev3/prevail-desktop/releases/latest/download/Prevail-windows-x64-setup.exe";
const EXE_NAME = `Prevail-${APP_VERSION}-x64-setup.exe`;
function useExeDownload(): { url: string; name: string } {
  const live = useLiveVersion();
  if (live)
    return {
      url: `${GITHUB_DESKTOP}/releases/download/v${live}/Prevail_${live}_x64-setup.exe`,
      name: `Prevail_${live}_x64-setup.exe`,
    };
  return { url: EXE_URL, name: EXE_NAME };
}
// Best-guess visitor OS so the primary CTA offers the right installer first
// (Windows visitors were only ever shown "Download for Mac"). Falls back to Mac.
function useIsWindows(): boolean {
  return useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const s = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
    return s.includes("win");
  }, []);
}
const EASE = [0.22, 1, 0.36, 1] as const;

// GA4 event helper. gtag is loaded in index.html; every conversion-relevant
// action on the page reports through here so we can actually measure what
// converts (downloads, CLI copies, demo plays) instead of guessing.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
function track(name: string, params?: Record<string, unknown>) {
  try {
    window.gtag?.("event", name, params);
  } catch {
    /* analytics must never break the page */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Primitives

function FadeIn({
  children,
  delay = 0,
  y = 16,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      Prev<span className="text-ai">ai</span>l
    </span>
  );
}

// Persistent theme toggle. Dark is always the default — we intentionally do
// NOT honor the OS color-scheme preference, so the brand-tuned dark theme is
// what every first-time visitor sees. Light only applies if the user has
// explicitly toggled it (persisted via localStorage).
type Theme = "dark" | "light";
const LS_THEME = "prevail.site.theme";

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem(LS_THEME) as Theme | null;
    return saved === "light" ? "light" : "dark";
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
}

// Wraps a Simple Icons SVG path into a sized React SVG. Used for brand
// logos (Telegram). Lucide icons handle generic glyphs.
function SimpleIcon({
  icon,
  className = "",
}: {
  icon: { path: string };
  className?: string;
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
    >
      <path d={icon.path} />
    </svg>
  );
}

// Microsoft Windows mark — simple-icons no longer ships the Windows logo
// (trademark), so we render the classic four-pane logotype directly.
function WindowsMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  );
}
// as "connected nodes" — the spirit of MCP.
// Reusable model-logo row — actual brand logos in their official colors.
// Used to anchor "the best reasoning models" claims visually.
// OpenAI starburst — simple-icons doesn't ship one due to trademark
// constraints, so we render the public-domain hexagonal knot
// approximation used by community marks.
function OpenAIMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.205 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.074zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.142-.08 4.774-2.757a.795.795 0 0 0 .392-.681v-6.737l2.018 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.488 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.78 2.756a.78.78 0 0 0 .785 0l5.843-3.369v2.33a.082.082 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.594 3.855L13.075 8.37l2.02-1.169a.076.076 0 0 1 .071 0l4.83 2.792a4.504 4.504 0 0 1-.681 8.116v-5.678a.79.79 0 0 0-.392-.679zm2.01-3.02l-.141-.085-4.774-2.776a.795.795 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.676 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v3l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

// "Star on GitHub" pill — single rounded shape, no internal divider.
// Modeled after the Linear / Vercel / shadcn-ui pattern: cream pill on
// dark, dark pill on light. Star icon → "Star" → live count.
function GitHubStarButton({
  size = "sm",
  className = "",
}: {
  size?: "sm" | "lg";
  className?: string;
}) {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("https://api.github.com/repos/fru-dev3/prevail-desktop")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j) return;
        if (typeof j.stargazers_count === "number") setStars(j.stargazers_count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const isLg = size === "lg";
  return (
    <a
      href={GITHUB_DESKTOP}
      target="_blank"
      rel="noreferrer"
      title="Star on GitHub"
      onClick={() => track("github_star_click", { size })}
      className={`group inline-flex items-center gap-2 rounded-full bg-text text-bg transition-all hover:opacity-90 hover:-translate-y-0.5 ${
        isLg ? "px-5 py-2.5 text-sm" : "px-3.5 py-1.5 text-xs"
      } ${className}`}
    >
      <Star className={isLg ? "h-4 w-4" : "h-3.5 w-3.5"} />
      <span className="font-semibold">Star</span>
      <span className="font-semibold opacity-70">
        {stars !== null ? formatStars(stars) : "-"}
      </span>
    </a>
  );
}

function formatStars(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

// Hero download counter — the total is real (summed from GitHub release
// assets), so the presentation leans into it: a mechanical odometer that
// rolls every digit into place inside its own split-flap tile, plus a live
// pulse and a link straight to the source of the number. Rightmost digits
// spin through more revolutions, like a real odometer.
function OdometerDigit({ digit, index }: { digit: number; index: number }) {
  const reduce = useReducedMotion();
  const spins = index + 1;
  const strip: number[] = [];
  for (let k = 0; k <= spins * 10 + digit; k++) strip.push(k % 10);
  return (
    <span className="relative inline-block h-[1.3em] w-[0.78em] overflow-hidden rounded-lg border border-border-soft bg-bg">
      {reduce ? (
        <span className="flex h-[1.3em] items-center justify-center leading-none">{digit}</span>
      ) : (
        <motion.span
          className="block"
          initial={{ y: 0 }}
          animate={{ y: `-${((strip.length - 1) * 1.3).toFixed(2)}em` }}
          transition={{ duration: 1 + index * 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
        >
          {strip.map((d, k) => (
            <span key={k} className="flex h-[1.3em] items-center justify-center leading-none">
              {d}
            </span>
          ))}
        </motion.span>
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-bg/70 via-transparent to-bg/70"
      />
    </span>
  );
}

function DownloadCounter({ value }: { value: number }) {
  const formatted = value.toLocaleString("en-US");
  let digitIndex = -1;
  return (
    <div className="mt-2 flex flex-col items-center gap-2">
      <div
        role="img"
        aria-label={`${formatted} downloads, counted live from GitHub releases`}
        className="flex items-center gap-4 rounded-2xl border border-accent-border bg-surface-1 py-3 pl-5 pr-6"
        style={{ boxShadow: "0 10px 48px rgba(63, 163, 77, 0.22)" }}
      >
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <motion.span
              className="absolute inset-0 rounded-full bg-accent"
              animate={{ scale: [1, 2.4], opacity: [0.55, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
            <span className="relative h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Live</span>
        </span>
        <span aria-hidden className="flex items-center gap-[3px] font-mono text-3xl font-semibold tabular-nums text-accent md:text-4xl">
          {formatted.split("").map((c, i) => {
            if (/\d/.test(c)) {
              digitIndex += 1;
              return <OdometerDigit key={i} digit={Number(c)} index={digitIndex} />;
            }
            return (
              <span key={i} className="px-0.5 pb-[0.15em] text-accent/60">
                {c}
              </span>
            );
          })}
        </span>
        <span className="flex flex-col items-start text-left leading-tight">
          <span className="text-sm font-medium text-text">downloads</span>
          <span className="text-[11px] text-text-mute">and counting</span>
        </span>
      </div>
      <a
        href={`${GITHUB_DESKTOP}/releases`}
        target="_blank"
        rel="noreferrer"
        className="text-[10px] uppercase tracking-[0.18em] text-text-mute underline-offset-2 transition-colors hover:text-text-soft hover:underline"
      >
        Counted live from GitHub releases
      </a>
    </div>
  );
}

// Total installer downloads, summed from GitHub's own release data. We use
// api.github.com (which the site already calls for stars + the latest version)
// rather than a shields.io badge, because privacy-minded visitors often run
// ad-blockers that drop img.shields.io, which would silently hide the number.
// Desktop installers (.dmg/.exe) plus CLI binaries (.tar.gz; their .sha256
// sidecars don't match) across every release of both repos. The desktop
// updater tarball lives in the desktop repo, so the cli-only .tar.gz rule
// never counts auto-updates. Cached at module scope so the hero and the
// momentum strip share a single fetch (kind to the rate limit).
const DOWNLOAD_SOURCES: { repo: string; asset: RegExp }[] = [
  { repo: "fru-dev3/prevail-desktop", asset: /\.(dmg|exe)$/ },
  { repo: "fru-dev3/prevail-cli", asset: /\.tar\.gz$/ },
];
let _downloadTotal: Promise<number | null> | null = null;
function fetchDownloadTotal(): Promise<number | null> {
  if (_downloadTotal) return _downloadTotal;
  _downloadTotal = (async () => {
    try {
      let total = 0;
      for (const src of DOWNLOAD_SOURCES) {
        for (let page = 1; page <= 3; page++) {
          const r = await fetch(
            `https://api.github.com/repos/${src.repo}/releases?per_page=100&page=${page}`,
          );
          if (!r.ok) break;
          const rels = (await r.json()) as { assets?: { name?: string; download_count?: number }[] }[];
          if (!Array.isArray(rels) || rels.length === 0) break;
          for (const rel of rels)
            for (const a of rel.assets ?? [])
              if (typeof a.name === "string" && src.asset.test(a.name) && typeof a.download_count === "number")
                total += a.download_count;
          if (rels.length < 100) break;
        }
      }
      return total;
    } catch {
      return null;
    }
  })();
  return _downloadTotal;
}
function useDownloadTotal(): number | null {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchDownloadTotal().then((v) => {
      if (!cancelled) setN(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return n;
}

// Live, verifiable social proof: real installer downloads + the live star count.
// Both fail silently to "-" so the strip never breaks the page.
// ─────────────────────────────────────────────────────────────────────────────
// Nav — frosted, minimal

const NAV_LINKS = [
  { href: "/#demo", label: "Demo", Icon: Play, badge: true },
  { href: "/#how", label: "How it works", Icon: Layers },
  { href: "/thesis", label: "Thesis", Icon: Sparkles },
  { href: "/#install", label: "Install", Icon: Download },
  { href: "/changelog", label: "Releases", Icon: Rocket },
  { href: "https://docs.prevail.sh", label: "Docs", Icon: FileText, external: true },
] as const;

function Nav({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 frost border-b border-border-soft">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">
            <Brand />
            <span className="hidden font-normal text-text-mute sm:inline"> | Agent Harness</span>
          </span>
        </a>
        <div className="hidden items-center gap-6 text-sm text-text-soft md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              {...("external" in l && l.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="inline-flex items-center gap-1.5 hover:text-text"
            >
              <l.Icon className="h-4 w-4" /> {l.label}
              {"badge" in l && l.badge && (
                <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">{DEMO_SLIDES.length}</span>
              )}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border-soft text-text-soft hover:bg-surface-1 hover:text-text"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <span className="hidden sm:inline-flex">
            <GitHubStarButton />
          </span>
          <a
            href="#install"
            onClick={() => track("download_click", { location: "nav" })}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg transition-all hover:bg-accent-bright hover:-translate-y-0.5 sm:px-4"
            style={{ boxShadow: "0 4px 24px rgba(63, 163, 77, 0.25)" }}
          >
            Download
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border-soft text-text-soft hover:bg-surface-1 hover:text-text md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {/* Mobile menu sheet — links were previously unreachable below md */}
      {open && (
        <div className="frost border-t border-border-soft md:hidden">
          <div className="mx-auto grid max-w-6xl gap-1 px-6 py-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                {...("external" in l && l.external ? { target: "_blank", rel: "noreferrer" } : {})}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-text-soft hover:bg-surface-1 hover:text-text"
              >
                <l.Icon className="h-4 w-4" /> {l.label}
              </a>
            ))}
            <div className="mt-2 border-t border-border-soft pt-3">
              <GitHubStarButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// Official Prevail mark, the tile from the fru.dev family marks
// (public/brand/prevail-tile.svg): stacked chevrons and a dot on a dark tile.
// Inline so it stays crisp and the dot can animate on its own.
function Logo({ size = 24, animated = false }: { size?: number; animated?: boolean }) {
  const star = animated ? (
    <motion.circle
      cx="50"
      r="6"
      fill="#3FA34D"
      animate={{ cy: [13.5, 10, 13.5], opacity: [1, 0.75, 1] }}
      transition={{ duration: 1.9, ease: "easeInOut", repeat: Infinity }}
      style={{ filter: "drop-shadow(0 0 3px rgba(63, 163, 77, 0.55))" }}
    />
  ) : (
    <circle cx="50" cy="13.5" r="6" fill="#3FA34D" />
  );
  const svg = (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ width: size, height: size, display: "block" }}
      role="img"
      aria-label="Prevail"
    >
      <rect width="100" height="100" rx="22" fill="#0B1210" />
      <g transform="translate(14 14) scale(.72)">
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13.5 67 50 31.5 86.5 67" stroke="#3FA34D" strokeWidth="14.5" />
          <path d="M24 88 50 63 76 88" stroke="#008000" strokeWidth="9" />
        </g>
        {star}
      </g>
    </svg>
  );
  if (!animated) return svg;
  const T = 6;
  const float = Math.max(2, size * 0.045);
  return (
    <MotionConfig reducedMotion="never">
      <span
        className="group relative inline-block"
        style={{ perspective: size * 6, width: size, height: size }}
      >
        <motion.span
          className="relative inline-block"
          style={{ transformStyle: "preserve-3d", willChange: "transform, filter" }}
          animate={{
            y: [0, -float, 0],
            rotateX: [7, 2, 7],
            rotateY: [-5, 5, -5],
            filter: [
              "drop-shadow(0 2px 6px rgba(63, 163, 77,0.35))",
              "drop-shadow(0 8px 18px rgba(63, 163, 77,0.45))",
              "drop-shadow(0 2px 6px rgba(63, 163, 77,0.35))",
            ],
          }}
          transition={{ duration: T, ease: "easeInOut", repeat: Infinity }}
          whileHover={{ scale: 1.1 }}
        >
          {svg}
        </motion.span>
      </span>
    </MotionConfig>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADLINE — one line, always (clamp is sized so the nowrap never overflows
// the max-w-5xl container): a challenge, then the brand as the answer.
function Headline() {
  return (
    <h1 className="whitespace-nowrap text-center font-semibold tracking-[-0.02em] leading-[1.08] text-[clamp(1.55rem,5vw,3.4rem)]">
      <span className="text-text">Don&rsquo;t just keep up with AI.</span>{" "}
      <span className="font-serif italic text-accent [text-shadow:0_2px_28px_rgba(63, 163, 77,0.35)]">
        Prevail.
      </span>
    </h1>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO

// Ambient hero background: a single slow green aurora plus a faint second
// counterweight. Deliberately quiet: the download button should be the
// brightest thing in the viewport, and the layer respects the OS
// reduced-motion preference like everything else on the page.
function HeroGlow() {
  const reduce = useReducedMotion();
  const orbs = [
    {
      className: "left-[8%] top-[-12%] h-[52vw] w-[52vw] bg-[radial-gradient(circle,rgba(63, 163, 77,0.16),transparent_70%)]",
      anim: { x: [0, 40, -24, 0], y: [0, -24, 18, 0], scale: [1, 1.08, 0.95, 1] },
      dur: 26,
    },
    {
      className: "right-[-12%] top-[18%] h-[38vw] w-[38vw] bg-[radial-gradient(circle,rgba(63, 163, 77,0.09),transparent_70%)]",
      anim: { x: [0, -32, 16, 0], y: [0, 24, -16, 0], scale: [1, 0.94, 1.06, 1] },
      dur: 32,
    },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {orbs.map((o, i) =>
        reduce ? (
          <div key={i} className={`absolute rounded-full blur-3xl ${o.className}`} />
        ) : (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-3xl ${o.className}`}
            animate={o.anim}
            transition={{ duration: o.dur, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
          />
        ),
      )}
    </div>
  );
}

function Hero() {
  const dmg = useDmgDownload();
  const exe = useExeDownload();
  const isWindows = useIsWindows();
  const downloads = useDownloadTotal();
  return (
    <section id="demo" className="relative isolate overflow-hidden pt-8 pb-10 grain md:pt-10">
      <div className="glow-accent absolute inset-0 -z-10" />
      <HeroGlow />
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        <FadeIn delay={0}>
          <Headline />
        </FadeIn>
        <FadeIn delay={0.08}>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-text-soft md:text-lg">
            Your <span className="text-text">adaptive intelligence</span> for everything you
            manage, build, decide, and <span className="font-medium text-accent">become</span>.
          </p>
        </FadeIn>
        <FadeIn delay={0.14}>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href={isWindows ? exe.url : dmg.url}
              download={isWindows ? exe.name : dmg.name}
              onClick={() => track("download_click", { location: "hero", platform: isWindows ? "windows" : "mac" })}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3 font-medium text-bg transition-all hover:bg-accent-bright hover:-translate-y-0.5"
              style={{ boxShadow: "0 6px 32px rgba(63, 163, 77, 0.3)" }}
            >
              <Download className="h-4 w-4" />
              Download for {isWindows ? "Windows" : "macOS"}
            </a>
            {downloads !== null && <DownloadCounter value={downloads} />}
          </div>
        </FadeIn>
      </div>
      {/* The product itself fills the screen: one autoplaying carousel of
          the current app, in the page's theme. */}
      <FadeIn delay={0.2} y={24}>
        <ShotCarousel />
      </FadeIn>
      <DemoVideo />
    </section>
  );
}

// Life-domains radial — every domain orbits "You" and feeds the center; a
// highlighted domain cycles on a timer. Lives in the How-it-works section
// (it explains the model; the hero's job is to show the product).
function DomainRadial() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(
      () => setActive((a) => (a + 1) % LIFE_DOMAINS.length),
      2800,
    );
    return () => clearInterval(t);
  }, [reduce]);
  const N = LIFE_DOMAINS.length;
  const R = 40;
  const nodes = LIFE_DOMAINS.map((d, i) => {
    const ang = ((-90 + i * (360 / N)) * Math.PI) / 180;
    return { ...d, x: 50 + R * Math.cos(ang), y: 50 + R * Math.sin(ang) };
  });
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[680px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        {nodes.map((n, i) => (
          <line
            key={n.label}
            x1="50"
            y1="50"
            x2={n.x}
            y2={n.y}
            stroke="currentColor"
            strokeWidth={active === i ? 0.35 : 0.2}
            strokeDasharray="0.9 0.9"
            className={`transition-all duration-500 ${active === i ? "text-accent/60" : "text-border"}`}
          />
        ))}
        {!reduce &&
          nodes.map((n, i) => (
            <motion.circle
              key={`pulse-${n.label}`}
              r="0.75"
              className="fill-accent"
              initial={{ cx: n.x, cy: n.y, opacity: 0 }}
              animate={{ cx: 50, cy: 50, opacity: [0, 0.9, 0] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: "easeIn", delay: (i / N) * 2.1 }}
            />
          ))}
      </svg>

      {!reduce && (
        <motion.span
          className="absolute left-1/2 top-1/2 -z-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: "34%", height: "34%", background: "radial-gradient(circle, rgba(63, 163, 77,0.28), transparent 70%)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.25, 0.6] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      )}

      <div className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-accent-border bg-surface-1 shadow-lg md:h-24 md:w-24">
        <Logo size={26} />
        <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-accent">You</span>
      </div>

      {nodes.map((n, i) => {
        const Icon = n.Icon;
        const on = active === i;
        return (
          <div
            key={n.label}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 ${
              n.y < 50 ? "flex-col-reverse" : "flex-col"
            }`}
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border bg-surface-0 transition-all duration-500 md:h-11 md:w-11 ${
                on ? "border-accent-border text-accent shadow-[0_0_18px_rgba(63, 163, 77,0.35)]" : "border-border-soft text-text-soft"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className={`font-mono text-[9px] uppercase tracking-[0.14em] transition-colors duration-500 md:text-[10px] ${on ? "text-accent" : "text-text-mute"}`}>
              {n.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// COUNCIL PITCH — model logos + "around one table" + Convene CTA + GitHub
// star button. Lives right under the hero, above the install section.

// ─────────────────────────────────────────────────────────────────────────────
// LOGO BAR — gentle social proof / "what you use it with"

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE SECTION — reusable, alternating layout

// ─────────────────────────────────────────────────────────────────────────────
// COUNCIL MOCK — fan-out + verdict, 4 panelist replies streaming

// ─────────────────────────────────────────────────────────────────────────────
// BENCHMARK MOCK — leaderboard

// Per-domain leaderboards. The point: the best model for one part of your life
// isn't the best for another — the winner (row 0) deliberately changes by
// domain. Rows are [judge score, keyword %, model].
// Heat color for a 0-10 judge score: emerald green for strong, muted slate for
// weak. Green reads as "good" at a glance.
// The live Prevail Benchmark: model x domain matrix + leaderboard, loaded from
// the committed results JSON (refreshed by the weekly CI). Synthetic data.
// ─────────────────────────────────────────────────────────────────────────────
// VAULT MOCK — folder tree

// ─────────────────────────────────────────────────────────────────────────────
// PILLARS — three small cards

// "It learns and adapts": a memory graph that fills in over time. The mind
// sits at the center, four kinds of memory around it, and small memories
// accrete on the outer ring with links back to their kind (and sometimes to
// each other), then the cycle starts over. Same language as DomainRadial.
const MEMORY_KINDS = [
  { label: "Notes", Icon: FileText, ang: -135 },
  { label: "Decisions", Icon: Scale, ang: -45 },
  { label: "Habits", Icon: RefreshCw, ang: 45 },
  { label: "People", Icon: Users, ang: 135 },
];

function LearnGraph() {
  const reduce = useReducedMotion();
  const pt = (ang: number, r: number) => {
    const a = (ang * Math.PI) / 180;
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
  };
  const kinds = MEMORY_KINDS.map((k) => ({ ...k, ...pt(k.ang, 27) }));
  // Three memories per kind on the outer ring, in the order they get learned.
  const order = [0, 4, 8, 1, 6, 10, 3, 9, 2, 7, 11, 5];
  const memories = kinds.flatMap((k, ki) =>
    [-22, 0, 22].map((d, j) => ({ ki, ...pt(k.ang + d, j === 1 ? 45 : 41) })),
  );
  const step = (i: number) => order.indexOf(i) / memories.length;
  // Cross-links: a memory of one kind tied to a memory of another.
  const links: [number, number][] = [[2, 3], [5, 6], [8, 9], [11, 0], [1, 7]];
  const CYCLE = 10;
  const appear = (t: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0 },
          animate: { opacity: [0, 0, 1, 1, 0] },
          transition: { duration: CYCLE, times: [0, 0.05 + t * 0.7, 0.1 + t * 0.7, 0.92, 1], repeat: Infinity, ease: "easeOut" as const },
        };
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[680px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="0.9 0.9" className="text-border" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-border-soft" />
        {kinds.map((k) => (
          <line key={k.label} x1="50" y1="50" x2={k.x} y2={k.y} stroke="currentColor" strokeWidth="0.25" strokeDasharray="0.9 0.9" className="text-accent/50" />
        ))}
        {memories.map((m, i) => (
          <motion.line key={`l${i}`} x1={kinds[m.ki].x} y1={kinds[m.ki].y} x2={m.x} y2={m.y} stroke="currentColor" strokeWidth="0.2" className="text-accent/45" {...appear(step(i))} />
        ))}
        {links.map(([a, b]) => (
          <motion.line key={`x${a}-${b}`} x1={memories[a].x} y1={memories[a].y} x2={memories[b].x} y2={memories[b].y} stroke="currentColor" strokeWidth="0.18" strokeDasharray="0.6 0.8" className="text-accent/40" {...appear(Math.max(step(a), step(b)) + 0.03)} />
        ))}
        {memories.map((m, i) => (
          <motion.circle key={`m${i}`} cx={m.x} cy={m.y} r={i % 3 === 1 ? 1.7 : 1.3} className="fill-accent" {...appear(step(i))} />
        ))}
        {!reduce &&
          kinds.map((k, i) => (
            <motion.circle
              key={`p${k.label}`}
              r="0.7"
              className="fill-accent"
              initial={{ cx: k.x, cy: k.y, opacity: 0 }}
              animate={{ cx: 50, cy: 50, opacity: [0, 0.9, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeIn", delay: i * 0.55 }}
            />
          ))}
      </svg>
      {!reduce && (
        <motion.span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: "34%", height: "34%", background: "radial-gradient(circle, rgba(63, 163, 77,0.28), transparent 70%)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.25, 0.6] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      )}
      <div className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-accent-border bg-surface-1 text-accent shadow-lg">
        <Sparkles className="h-6 w-6" />
        <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em]">Memory</span>
      </div>
      {kinds.map((k) => {
        const Icon = k.Icon;
        return (
          <div
            key={k.label}
            className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 ${k.y < 50 ? "flex-col-reverse" : "flex-col"}`}
            style={{ left: `${k.x}%`, top: `${k.y}%` }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border-soft bg-surface-0 text-text-soft">
              <Icon className="h-5 w-5" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-mute">{k.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// One "Three ideas" card. Front: title + picture. Back: what the idea means.
// Mouse hover flips it; touch taps toggle; Enter/Space toggle from the keyboard.
function PillarCard({
  icon: Icon,
  title,
  color,
  visual,
  details,
}: {
  icon: typeof Layers;
  title: string;
  color: string;
  visual: ReactNode;
  details: string[];
}) {
  const [flipped, setFlipped] = useState(false);
  const lastPointer = useRef("mouse");
  const backId = `pillar-${title.replace(/\W+/g, "-").toLowerCase()}`;
  const header = (
    <div className="flex items-center gap-3">
      <div
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <h3 className="whitespace-nowrap text-lg font-semibold tracking-[-0.01em]">{title}</h3>
      {/* Flip hint, mostly for touch, where there is no hover to discover it */}
      <RotateCw className="ml-auto h-3.5 w-3.5 shrink-0 text-text-mute opacity-60" aria-hidden />
    </div>
  );
  const face = "flex h-full flex-col rounded-xl border p-5 transition-[border-color,box-shadow,background-color] duration-300";
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${title}. Show details`}
      aria-describedby={backId}
      data-flipped={flipped}
      className="flip group h-full cursor-pointer rounded-xl outline-none transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      onPointerDown={(e) => (lastPointer.current = e.pointerType)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setFlipped(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setFlipped(false)}
      onClick={() => lastPointer.current !== "mouse" && setFlipped((f) => !f)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
    >
      <div className="flip-inner">
        <div className={`flip-front ${face} border-border-soft bg-surface-0 group-hover:border-accent-border group-hover:shadow-[0_12px_40px_-16px_rgba(63,163,77,0.45)]`} aria-hidden>
          {header}
          {/* The picture, scaled down so the three cards stay short and even. */}
          <div className="mt-4 flex h-60 items-center justify-center overflow-hidden">
            <div className="w-full origin-center scale-[0.68] transition-transform duration-500 group-hover:scale-[0.72]">{visual}</div>
          </div>
        </div>
        <div
          id={backId}
          className={`flip-back ${face} border-accent-border bg-surface-1 shadow-[0_12px_40px_-16px_rgba(63,163,77,0.45)]`}
        >
          <div aria-hidden>{header}</div>
          <ul className="mt-4 flex flex-1 flex-col justify-center gap-5 px-1">
            {details.map((d) => (
              <li key={d} className="flex gap-3 text-base leading-snug text-text-soft">
                <Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Pillars() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-border-soft py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-accent">
            How <Brand /> works
          </p>
          <h2 className="mx-auto mt-4 text-center text-4xl font-semibold tracking-[-0.02em] md:text-5xl text-balance">
            Three ideas. <span className="font-serif italic text-text-soft">That's the whole app.</span>
          </h2>
        </FadeIn>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Layers,
              title: "For life's biggest decisions",
              color: "#3FA34D",
              visual: (
                // The life-domains radial, relocated from the hero — it
                // explains the "you at the center" model, which is exactly
                // this card's job.
                <div className="mx-auto w-full max-w-[300px]">
                  <DomainRadial />
                </div>
              ),
              details: [
                "Money, health, home, work and family each get a domain with its own memory.",
                "Ask once. Prevail pulls context from every domain the question touches.",
              ],
            },
            {
              icon: Scale,
              title: "A council of models",
              color: "#3FA34D",
              visual: (
                <div className="flex flex-col items-center">
                  {/* Round table: named models seated around Prevail; one is the chair */}
                  <div className="relative mx-auto h-52 w-52">
                    {/* table ring */}
                    <div className="absolute inset-7 rounded-full border border-dashed border-border-soft" aria-hidden />
                    {/* center — Prevail */}
                    <div
                      className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-border bg-surface-0"
                      title="Prevail"
                      style={{ boxShadow: "0 0 30px rgba(63, 163, 77, 0.25)" }}
                    >
                      <Logo size={26} />
                    </div>
                    {/* seats — model + name, one marked as chair */}
                    {[
                      { name: "Claude", chair: true, pos: "left-1/2 top-0 -translate-x-1/2", bg: "#cc785c", fg: "#ffffff", render: (c: string) => <SimpleIcon icon={siClaude} className={c} /> },
                      { name: "Gemini", pos: "right-0 top-1/2 -translate-y-1/2", bg: "#4285F4", fg: "#ffffff", render: (c: string) => <SimpleIcon icon={siGooglegemini} className={c} /> },
                      { name: "Codex", pos: "left-1/2 bottom-0 -translate-x-1/2", bg: "#0d0d0d", fg: "#ffffff", render: (c: string) => <OpenAIMark className={c} /> },
                      { name: "Ollama", pos: "left-0 top-1/2 -translate-y-1/2", bg: "#ededed", fg: "#181818", render: (c: string) => <SimpleIcon icon={siOllama} className={c} /> },
                    ].map((m) => (
                      <div key={m.name} className={`absolute ${m.pos} z-10 flex flex-col items-center gap-1`}>
                        <span
                          title={m.name}
                          aria-label={m.chair ? `${m.name} (chair)` : m.name}
                          className={`relative flex h-10 w-10 items-center justify-center rounded-full ${
                            m.chair ? "ring-2 ring-accent" : "ring-2 ring-surface-0"
                          }`}
                          style={{ background: m.bg, color: m.fg }}
                        >
                          {m.render("h-4 w-4")}
                          {m.chair && (
                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-bg">
                              <Crown className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </span>
                        <span className={`text-[10px] font-medium ${m.chair ? "text-accent" : "text-text-mute"}`}>
                          {m.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ),
              details: [
                "Several models answer the same question.",
                "One verdict shows where they agree and where they differ.",
                "You pick the models. Local ones stay on your Mac.",
              ],
            },
            {
              icon: Sparkles,
              title: "It learns and adapts",
              color: "#3FA34D",
              visual: (
                <div className="mx-auto w-full max-w-[300px]">
                  <LearnGraph />
                </div>
              ),
              details: [
                "Every chat files what matters into the right domain.",
                "Decisions, people and habits are remembered.",
                "So tomorrow's answer knows today's.",
              ],
            },
          ].map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.06} className="h-full">
              <PillarCard {...p} />
            </FadeIn>
          ))}
        </div>

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOMENTUM — real social proof only. The shipping cadence is genuinely
// impressive and every claim here is verifiable: latest shipped milestones
// from the changelog, the live GitHub star count, GPL-3.0, notarization.
// (This replaces the old illustrative rating + generated avatars, which cost
// more trust than they bought.)

function Momentum() {
  return (
    <section className="border-t border-border-soft py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 px-6 sm:flex-row sm:gap-6">
        <GitHubStarButton size="lg" />
        <a
          href="/changelog"
          className="inline-flex items-center gap-1.5 text-sm text-text-soft underline-offset-2 hover:text-text hover:underline"
        >
          Full changelog &amp; roadmap <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FRAMEWORKS — how Prevail SHAPES the answer (BLUF, WIN, SCQA, ...)

// Each framework gets a STRUCTURALLY distinct rendering — the visual
// shape should reveal the framework. Banner labels, dividers, grids,
// loops — not just colored prefix letters on similar paragraphs.

// ─────────────────────────────────────────────────────────────────────────────
// LENSES — different angles of attack. With lens=ALL, every panelist runs
// every lens, then the chair synthesizes across all of them.

// What each lens does to the same mortgage question — used by the
// interactive demo. Each rendering should LOOK like the lens worked on
// it (terminal-styled snippet inside the mock window).
// ─────────────────────────────────────────────────────────────────────────────
// SELF-LEARNING / ECOSYSTEM — combined section
//
// Self-learning: every council verdict logs to the vault. Over time, your
// vault BECOMES the benchmark — new models get graded against you.
// Ecosystem: MCP server, Telegram bridge, OpenClaw, Paperclip, Hermes,
// Multica all share the ~/.ai/ knowledge layer.

// OpenClaw brand mark — real lobster mark pulled verbatim from
// https://openclaw.ai/favicon.svg. Body + two claws + antennae + eyes
// with teal pupils. Recolored via currentColor on the wrapping span,
// but the gradient defs are inlined so the brand red shows through
// even on a tinted wrapper.
// Real Multica logo — pulled verbatim from https://multica.ai/favicon.svg.
// 8-spoke star/cross polygon; we recolor to currentColor so it picks up the
// brand tint we set on the wrapper.
// Real Paperclip AI logo mark — extracted from paperclip-logo.svg. The
// original is wordmark+mark; we keep only the mark on the left (a stylized
// paper corner with arrow). Colors use currentColor so it tints to brand.
// Ecosystem section — icons only, no titles, no descriptions.
// Just a clean strip of brand marks showing 'plays with these tools'.
// ─────────────────────────────────────────────────────────────────────────────
// INSTALL STUDIO — one terminal-style card with icon-forward tabs that covers
// every way to get Prevail: the native macOS and Windows apps, the curl one-line
// CLI installer, and a paste-into-Claude prompt that points an agent at
// llms.txt. App tabs show a download CTA; command tabs show a copyable line.

const INSTALL_TABS = [
  {
    key: "mac",
    label: "macOS",
    kind: "app",
    icon: (c: string) => <SimpleIcon icon={siApple} className={c} />,
  },
  {
    key: "win",
    label: "Windows",
    kind: "app",
    icon: (c: string) => <WindowsMark className={c} />,
  },
  {
    key: "curl",
    label: "curl",
    kind: "cmd",
    prompt: false,
    command: "curl -fsSL prevail.sh/install | bash",
    caption: "macOS, Linux & Windows (WSL). The desktop app already bundles this engine.",
    icon: (c: string) => <Terminal className={c} />,
  },
  {
    key: "claude",
    label: "Claude",
    kind: "cmd",
    prompt: true,
    command: "Please install prevail\nhttps://prevail.sh/llms.txt",
    caption: "Paste into Claude or any coding agent: it reads llms.txt and installs Prevail.",
    icon: (c: string) => <SimpleIcon icon={siClaude} className={c} />,
  },
] as const;

function AppPane({ platform }: { platform: "mac" | "win" }) {
  const version = useLatestVersion();
  const dmg = useDmgDownload();
  const exe = useExeDownload();
  const isMac = platform === "mac";
  const build = isMac ? dmg : exe;
  return (
    <div className="flex flex-col items-center text-center sm:flex-row sm:gap-7 sm:text-left">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-accent-border bg-surface-1 text-accent">
        {isMac ? (
          <SimpleIcon icon={siApple} className="h-9 w-9" />
        ) : (
          <WindowsMark className="h-9 w-9" />
        )}
      </div>
      <div className="mt-5 min-w-0 flex-1 sm:mt-0">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          {isMac ? "Desktop · macOS arm64" : "Desktop · Windows x64"}
        </div>
        <h3 className="mt-2 text-2xl font-bold tracking-tight">
          {isMac ? "Prevail.app" : "Prevail for Windows"}
        </h3>
        <p className="mt-1.5 text-sm text-text-mute">
          v{version} · {isMac ? "Apple Silicon · macOS 13+" : "Windows 10/11 · x64"} ·
          self-contained, no terminal
        </p>
        <a
          href={build.url}
          download={build.name}
          onClick={() => track("download_click", { location: "install", platform })}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent py-3 font-medium text-bg transition-all hover:bg-accent-bright hover:-translate-y-0.5 sm:w-auto sm:px-9"
          style={{ boxShadow: "0 6px 32px rgba(63, 163, 77, 0.3)" }}
        >
          <Download className="h-4 w-4" />
          {isMac ? "Download .dmg" : "Download installer"}
        </a>
      </div>
    </div>
  );
}

function CmdPane({
  command,
  prompt,
  caption,
}: {
  command: string;
  prompt: boolean;
  caption: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      track("cli_copy", { location: "install", prompt });
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };
  return (
    <div>
      <div className="flex items-start justify-between gap-4 rounded-lg border border-border-soft bg-surface-0 px-5 py-5">
        <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-text">
          {prompt ? (
            command
          ) : (
            <>
              <span className="text-accent">$ </span>
              {command}
            </>
          )}
        </pre>
        <button
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
          className="shrink-0 rounded-md p-1.5 text-text-mute transition-colors hover:bg-surface-1 hover:text-text"
        >
          {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-text-mute">{caption}</p>
    </div>
  );
}

function InstallStudio() {
  const isWindows = useIsWindows();
  const [tab, setTab] = useState<(typeof INSTALL_TABS)[number]["key"]>(
    isWindows ? "win" : "mac",
  );
  const active = INSTALL_TABS.find((t) => t.key === tab)!;
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-[#0b1210] shadow-2xl">
      {/* title bar: traffic lights + icon-forward tab strip */}
      <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
        <div className="hidden gap-1.5 sm:flex">
          <span className="h-3 w-3 rounded-full bg-[#3a3a3e]" />
          <span className="h-3 w-3 rounded-full bg-[#3a3a3e]" />
          <span className="h-3 w-3 rounded-full bg-[#3a3a3e]" />
        </div>
        <div className="flex w-full items-center justify-between gap-1 rounded-lg bg-surface-0 p-1 sm:w-auto sm:justify-end">
          {INSTALL_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              title={t.label}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                tab === t.key
                  ? "bg-surface-1 text-text ring-1 ring-border-strong"
                  : "text-text-mute hover:text-text-soft"
              }`}
            >
              {t.icon("h-4 w-4")}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      {/* body */}
      <div className="p-6 sm:p-8">
        {active.kind === "app" ? (
          <AppPane platform={active.key as "mac" | "win"} />
        ) : (
          <CmdPane command={active.command} prompt={active.prompt} caption={active.caption} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD / INSTALL section — one tabbed card for every platform & method

function DownloadSection() {
  return (
    <section id="install" className="border-t border-border-soft py-16 md:py-20 grain">
      <div className="glow-accent absolute inset-0 -z-10 opacity-50" />
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-accent">
            Ask a council. Prevail.
          </p>
          <h2 className="mx-auto mt-4 text-center text-4xl font-semibold tracking-[-0.02em] md:text-5xl text-balance">
            Get it <span className="font-serif italic text-text-soft">in a click.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-center text-lg text-text-soft">
            Mac, Windows, terminal, or your agent. Pick a tab and go.
          </p>
        </FadeIn>

        <FadeIn delay={0.08}>
          <div id="desktop" className="mt-10 scroll-mt-24">
            <InstallStudio />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ

const FAQ = [
  {
    q: "What's a council?",
    a: "Every available CLI is asked the same question at once. A chair model reads all the answers and writes a single verdict: plus a panel that surfaces where the panelists disagreed.",
  },
  {
    q: "Does my data leave my machine?",
    a: "Your vault always stays on your machine, in plain files you own. Whether anything leaves is your call: Bunker Mode keeps everything on-device with local models; Cloud Mode sends your prompts to the frontier models you pick. You choose, per question.",
  },
  {
    q: "Bunker Mode or Cloud Mode?",
    a: "Bunker Mode runs entirely on local models (via Ollama): nothing leaves your machine. Cloud Mode brings in the frontier, Claude, GPT, Gemini, when you want their horsepower. Same vault, same council, you decide how private versus how powerful.",
  },
  {
    q: "Do you collect any analytics or telemetry?",
    a: "Off by default. Prevail sends nothing unless you explicitly turn it on in Settings. If you opt in, it's anonymous (a random local ID, never your name, email, files, or chats), limited to a small fixed list of events, and you can see exactly what's sent and switch it off anytime.",
  },
  {
    q: "Which models can sit on the council?",
    a: "Claude, Codex, Gemini, and local Ollama models, auto-detected at startup. You pick who's on the council for any given question, and a chair model you choose writes the verdict.",
  },
  {
    q: "Do I have to use the desktop app?",
    a: "No. The CLI works on macOS, Linux, and WSL. Same features, same vault, same benchmark.",
  },
  {
    q: "Is it open source?",
    a: "Yes. GPL-3.0. Read every line on GitHub.",
  },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-t border-border-soft py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-6">
        <FadeIn>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-accent">FAQ</p>
          <h2 className="mt-4 text-center text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
<span className="font-serif italic text-text-soft">Quick</span> answers.
          </h2>
        </FadeIn>
        <div className="mt-8 space-y-2">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <FadeIn key={item.q} delay={i * 0.04}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full rounded-lg border border-border-soft bg-surface-0 px-6 py-5 text-left transition-colors hover:bg-surface-1"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">{item.q}</span>
                    <span
                      className={`text-accent transition-transform ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </div>
                  {isOpen && (
                    <p className="mt-4 border-t border-border-soft pt-4 text-text-soft">
                      {item.a}
                    </p>
                  )}
                </button>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer

const FAMILY = [
  { name: "Prevail", role: "Agent Harness", href: "https://prevail.sh", tile: "/brand/prevail-tile.svg", tagline: "A private AI harness for your life, not your job." },
  { name: "Glyph", role: "Agent Rig", href: "https://glyph.fru.dev", tile: "/brand/glyph-tile.svg", tagline: "Gives every coding agent session a name you can recognise." },
  { name: "Ibis", role: "Agent Context", href: "https://context.fru.dev", tile: "/brand/ibis-tile.svg", tagline: "Live data on AI, data and tech, each source kept current by its own agent." },
  { name: "Memosa", role: "Context Capture", href: "https://memosa.dev", tile: "/brand/memosa-tile.svg", tagline: "Context capture for agents." },
];

function Footer() {
  return (
    <footer className="border-t border-border-soft bg-surface-0">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* The fru.dev family: same four projects, same order, on every site. */}
        <div>
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            A{" "}
            <a href="https://fru.dev" className="text-accent hover:underline">
              fru.dev
            </a>{" "}
            project
          </h2>
          <div className="mx-auto mt-6 grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4">
            {FAMILY.map((f) => {
              const here = f.name === "Prevail";
              const inner = (
                <div
                  className={`flex h-full items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                    here ? "border-accent-border/60 bg-surface-1" : "border-border-soft hover:border-border hover:bg-surface-1"
                  }`}
                >
                  <img src={f.tile} alt="" className="h-9 w-9 shrink-0 rounded-lg" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{f.name} <span className="font-normal text-text-mute">{f.role}</span></div>
                    <div className="mt-0.5 line-clamp-2 text-xs leading-snug text-text-soft" title={f.tagline}>{f.tagline}</div>
                  </div>
                </div>
              );
              return here ? (
                <div key={f.name} aria-current="page">{inner}</div>
              ) : (
                <a key={f.name} href={f.href} target="_blank" rel="noreferrer">{inner}</a>
              );
            })}
          </div>
        </div>
        {/* One minimal closing section — brand, tagline, the two links that
            matter, copyright. Everything else lives in the downloads above. */}
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-border-soft pt-8 text-center">
          <div className="flex items-center gap-2">
            <Logo size={22} />
            <span className="text-lg font-semibold">
              <Brand />
              <span className="font-normal text-text-mute"> | Agent Harness</span>
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-soft">
            <a href="/changelog" className="hover:text-text">Changelog &amp; roadmap</a>
            <a
              href={PRODUCT_HUNT_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("product_hunt_click", { location: "footer" })}
              className="inline-flex items-center gap-1.5 hover:text-text"
            >
              <SimpleIcon icon={siProducthunt} className="h-3.5 w-3.5 shrink-0 text-[#DA552F]" />
              Product Hunt
            </a>
            <a href="/tos" className="hover:text-text">Terms of Service</a>
            <a href="/privacy" className="hover:text-text">Privacy Policy</a>
          </nav>
          <GitHubStarButton size="lg" />
          <p className="text-xs text-text-mute">© 2026 Prevail.sh · built local, shipped open</p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP SHOWCASE — real product shots of Prevail Desktop

// ─────────────────────────────────────────────────────────────────────────────
// USE CASES — the questions people point the council at

// Brand color per engine — shared by the header dots and the panel rows so a
// model is always the same hue wherever it appears.
// Each card shows the panel disagreeing (`panel`), the crux of the split
// (`split`), then the chair's synthesized call (`verdict`). `lean` is the
// one-word stance used to tint each row so agreement/dissent reads at a glance.
// ─────────────────────────────────────────────────────────────────────────────
// Root

// A one-minute screen recording of the app in use, captured against the same
// invented demo vault as the stills. Loads nothing until it scrolls into view,
// then plays muted on a loop (never on its own under reduced motion).
function DemoVideo() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const seen = useInView(ref, { margin: "200px" });
  useEffect(() => {
    const v = ref.current;
    if (!v || !seen) return;
    if (v.preload !== "auto") { v.preload = "auto"; v.load(); }
    if (!reduce) v.play().catch(() => {});
  }, [seen, reduce]);
  return (
    <div className="mx-auto mt-16 max-w-6xl px-4 text-center sm:px-6">
      <h2 className="flex items-center justify-center gap-2 text-2xl font-semibold text-text md:text-3xl">
        <Play className="h-6 w-6 text-accent" />
        See it in action
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base text-text-soft">
        One minute: a question to your chief of staff and two specialists, then the Compass, a project, the morning briefing and an entity.
      </p>
      <div className="mt-6 overflow-hidden rounded-xl border border-border-soft bg-surface-0 shadow-2xl">
        <video
          ref={ref}
          poster="/prevail-tour-poster.jpg"
          width={1440}
          height={900}
          muted
          loop
          playsInline
          controls
          preload="none"
          aria-label="Screen recording of Prevail: a group chat answer, the Compass, a project, the Inbox briefing and an entity page"
          className="block aspect-[16/10] w-full"
        >
          <source src="/prevail-tour.webm" type="video/webm" />
          <source src="/prevail-tour.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}

// Product stills, captured from the current app against an invented demo
// vault (no real person's data), light and dark at 2880x1620 WebP. The page
// theme picks the variant in CSS; both load lazily, so a hidden one never downloads.
type Shot = { shot: string; title: string; icon: typeof Users; line: string; alt: string };

function ThemedShot({ shot, alt, eager = false }: { shot: string; alt: string; eager?: boolean }) {
  return (
    <>
      {(["dark", "light"] as const).map((t) => (
        <img
          key={t}
          src={`/shots/shot-${shot}-${t}.webp`}
          alt={alt}
          width={2880}
          height={1620}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className={`shot-${t} block aspect-video w-full object-cover object-left-top`}
        />
      ))}
    </>
  );
}

// The tour: one still per part of the app, each with what you are looking at
// and why it matters, advancing on a timer and looping.
const DEMO_SLIDES: Shot[] = [
  {
    shot: "group",
    title: "A chief of staff with specialists",
    icon: MessagesSquare,
    line: "The chief of staff answers, then an Analyst and a Skeptic add the numbers and the catch.",
    alt: "Prevail chat where the chief of staff, an Analyst and a Skeptic answer one question about a heat pump rebate, with the colorful sidebar open",
  },
  {
    shot: "council",
    title: "Convene a council",
    icon: Scale,
    line: "Three models weigh one decision and a chair writes the verdict, so you see where they split.",
    alt: "A council verdict in the Wealth domain from Opus, GPT and Gemini on paying down a mortgage or investing",
  },
  {
    shot: "compass",
    title: "Your Compass",
    icon: Compass,
    line: "Your purpose, values and vision. Every suggestion is checked against them.",
    alt: "The Compass page with a purpose, four ranked values, a mission statement and a vision",
  },
  {
    shot: "specialists",
    title: "A team of specialists",
    icon: Users,
    line: "Pick who helps you and set how far each one may go before it asks.",
    alt: "The Specialists page with the chief of staff, spending and time limits, and specialists grouped by what they do",
  },
  {
    shot: "entities",
    title: "Entities",
    icon: Boxes,
    line: "People, places and things keep their own memory, so you never repeat yourself.",
    alt: "An entity page for a heat pump with purchase date, warranty, maker, location, service history and the chats that mention it",
  },
  {
    shot: "activities",
    title: "Activities",
    icon: CalendarDays,
    line: "Events and milestones, each linked to the place, person and project it belongs to.",
    alt: "The Activities page with upcoming events and milestones, and an install day linked to a place, a person and a project",
  },
  {
    shot: "projects",
    title: "Projects",
    icon: FolderKanban,
    line: "A goal becomes dated milestones, with a specialist on the case.",
    alt: "A project page for replacing a heating system with its owner domain, a specialist, and milestones with dates",
  },
  {
    shot: "inbox",
    title: "Your morning briefing",
    icon: Inbox,
    line: "Today's three priorities and the goals behind them, ready when you start.",
    alt: "The Inbox briefing for today listing three priorities with their due dates and the goals behind them",
  },
  {
    shot: "knowledge",
    title: "Knowledge sources",
    icon: BookOpen,
    line: "The websites and folders Prevail reads when it answers, chosen by you.",
    alt: "Knowledge sources settings listing two websites and a local folder that Prevail reads",
  },
];

const SHOT_SECONDS = 7;

function ShotCarousel() {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  // Reduced motion starts paused; the play button still lets people opt in.
  const [paused, setPaused] = useState(!!reduce);
  const [hover, setHover] = useState(false);
  const n = DEMO_SLIDES.length;
  const go = (d: number) => setIdx((i) => (i + d + n) % n);
  const slide = DEMO_SLIDES[idx];
  const running = !paused && !hover;
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-full border border-border-soft text-text-soft transition hover:bg-surface-1 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";
  return (
    <div className="mx-auto mt-10 grid max-w-[1600px] items-start gap-6 px-4 text-left sm:px-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:px-8">
      {/* The still, in a quiet window frame. Hovering it holds the timer. */}
      <div
        className="group relative min-w-0"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="overflow-hidden rounded-xl border border-border-soft bg-surface-0 shadow-2xl">
          <div className="flex items-center gap-1.5 border-b border-border-soft px-3 py-2" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="ml-2 truncate text-xs text-text-mute">Prevail · {slide.title}</span>
          </div>
          <ThemedShot key={slide.shot} shot={slide.shot} alt={slide.alt} eager={idx === 0} />
        </div>
        <button
          onClick={() => go(-1)}
          aria-label="Previous screenshot"
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border-soft bg-bg/80 p-2 text-text-soft opacity-0 backdrop-blur transition hover:bg-bg hover:text-text focus:opacity-100 group-hover:opacity-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next screenshot"
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border-soft bg-bg/80 p-2 text-text-soft opacity-0 backdrop-blur transition hover:bg-bg hover:text-text focus:opacity-100 group-hover:opacity-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Only the current slide: what you see and why it matters. */}
      <div className="min-w-0">
        {/* Every slide sits in the same grid cell, so the block is as tall as
            the longest one and the controls never jump; only the current one shows. */}
        <div className="grid" aria-hidden>
          {DEMO_SLIDES.map((s, i) => {
            const I = s.icon;
            const on = i === idx;
            return (
              <div
                key={s.shot}
                className={`col-start-1 row-start-1 transition duration-300 ease-out motion-reduce:transition-none ${on ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"}`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <I className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-text">{s.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-text-soft">{s.line}</p>
              </div>
            );
          })}
        </div>
        <p aria-live="polite" className="sr-only">
          Slide {idx + 1} of {n}: {slide.title}. {slide.line}
        </p>

        {/* Compact controls; arrow keys work while any of them has focus. */}
        <div
          role="group"
          aria-label="Screenshot tour controls"
          className="mt-5 flex items-center gap-2"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
            if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
          }}
        >
          <button onClick={() => go(-1)} aria-label="Previous slide" className={btn}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}
            aria-pressed={paused}
            className={btn}
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button onClick={() => go(1)} aria-label="Next slide" className={btn}>
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 text-sm tabular-nums text-text-mute">
            {idx + 1} / {n}
          </span>
        </div>
        {/* The bar is the timer: when its fill finishes, the next slide shows.
            Pausing freezes it in place, so resuming picks up where it stopped. */}
        <div className="mt-3 h-0.5 w-full max-w-[12rem] overflow-hidden rounded-full bg-border-soft" aria-hidden>
          <div
            key={idx}
            className="shot-progress h-full bg-accent"
            style={{ animationDuration: `${SHOT_SECONDS}s`, animationPlayState: running ? "running" : "paused" }}
            onAnimationEnd={() => go(1)}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARISON section — sits directly under the demo video. Shows the full
// ~/.ai crew (Prevail + its companion agents/channels) next to the external
// all-in-one alternative (Odysseus), so a visitor sees at a glance WHAT each
// does and WHERE Prevail fits. Prevail is the highlighted "you're here" column.
//
// NOTE: Hermes + Multica copy below is intentionally generic ("AI agent in the
// ~/.ai layer") — drop in their real one-liners when ready.

// Minimal Odysseus mark — no official logo, so a clean monochrome sail-on-wave
// glyph (currentColor) for the "external alternative" card. Geometric only.
// Each product is a COLUMN. `blurb` is the short 1–2 sentence description that
// sits under the logo in the header. `hero` lights Prevail's column in the accent.
// Cell value: true = full, "part" = partial/indirect, false = absent.
// #RRGGBB → rgba(), for the per-brand color bands and glows applied inline.
// ─────────────────────────────────────────────────────────────────────────────
// THESIS PAGE — why Prevail exists. A quiet manifesto, one belief per block.

const THESES = [
  {
    title: "AI for your life will matter more than AI for your work.",
    body: "Everyone is racing to build AI for code, email, and the office. The bigger prize is the AI that helps with the decisions that actually shape a life: money, health, family, career. The hard calls you only get to make once.",
  },
  {
    title: "Context compounds.",
    body: "An AI that knows your whole life gets more useful the longer you use it. Most assistants start from zero every session. Prevail keeps a durable record of who you are and what you've decided, and feeds it forward, so every answer is sharper than the last.",
  },
  {
    title: "Everyone deserves a council of advisors.",
    body: "The wealthy keep lawyers, accountants, doctors, and wealth managers on call. AI can give everyone that same caliber of counsel, in private, for the cost of the electricity. A panel of the best models, not a single guess.",
  },
  {
    title: "Your context is the most valuable thing you own.",
    body: "The industry default is \"send us everything.\" We think ownership should come first: your vault lives in plain files on your machine, and you decide what any model sees, question by question. Frontier cloud models when you want horsepower, local models when you want privacy. Your data, your call.",
  },
  {
    title: "Your life deserves the same rigor as your code.",
    body: "We version, test, and peer-review our software. Our biggest personal decisions get a gut feeling at 11pm. That asymmetry is absurd. Prevail brings structure, a second opinion, and a durable record to the choices that matter most.",
  },
];

function ThesisPage() {
  const dmg = useDmgDownload();
  return (
    <main className="pt-14">
      <section className="relative overflow-hidden py-24 md:py-32 grain">
        <div className="glow-accent absolute inset-0 -z-10 opacity-30" />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Why <Brand /> exists</p>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-[-0.02em] md:text-6xl">
              A private intelligence for every person,{" "}
              <span className="font-serif italic text-text-soft">that compounds for a lifetime.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-lg text-text-soft">
              Prevail is a bet on a simple idea: the most important AI you ever use
              won't be the one at work. It'll be the one that knows your life, and
              keeps it yours.
            </p>
          </FadeIn>
          <div className="mt-10 flex justify-center">
            <GitHubStarButton size="lg" />
          </div>
        </div>
      </section>

      <section className="border-t border-border-soft py-8 md:py-12">
        <div className="mx-auto max-w-3xl px-6">
          {THESES.map((t, i) => (
            <FadeIn key={t.title} delay={i * 0.04}>
              <div className="flex gap-6 border-b border-border-soft py-12 last:border-b-0 md:gap-10">
                <div className="font-serif text-4xl italic text-accent md:text-5xl">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <h2 className="text-2xl font-semibold leading-snug tracking-[-0.01em] md:text-3xl">{t.title}</h2>
                  <p className="mt-4 text-lg leading-relaxed text-text-soft">{t.body}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="border-t border-border-soft py-20 md:py-28 grain">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              Start your vault. <span className="font-serif italic text-text-soft">It only compounds from here.</span>
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={dmg.url}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-bg transition-all hover:bg-accent-bright hover:-translate-y-0.5"
                style={{ boxShadow: "0 4px 24px rgba(63, 163, 77, 0.25)" }}
              >
                <Download className="h-4 w-4" /> Download for macOS
              </a>
              <a href="/" className="inline-flex items-center gap-1.5 rounded-md border border-border-soft px-6 py-3 text-sm text-text-soft hover:text-text">
                Back to home <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIFE DOMAINS — radial constellation of the life areas Prevail covers.

const LIFE_DOMAINS: { label: string; Icon: typeof Heart }[] = [
  { label: "Health", Icon: Heart },
  { label: "Wealth", Icon: TrendingUp },
  { label: "Tax", Icon: Receipt },
  { label: "Career", Icon: Briefcase },
  { label: "Family", Icon: Users },
  { label: "Learning", Icon: GraduationCap },
];

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL — combined Terms of Service & Privacy Policy, served at /tos (aliases
// /terms, /privacy, /legal). Structure mirrors our sibling site paperclip.ing,
// rewritten for Prevail's reality: GPL-3.0, local-first, no accounts, no hosted
// backend, telemetry off by default. A `body` entry that is a string renders as
// a paragraph; an array renders as a bullet list; `caps` marks all-caps
// disclaimer blocks; `part`/`anchor` mark the two top-level dividers.

const LEGAL_EFFECTIVE = "June 17, 2026";

type LegalBlock = string | string[];
type LegalSection = {
  title: string;
  part?: boolean;
  anchor?: string;
  caps?: boolean;
  body?: LegalBlock[];
};

const LEGAL_SECTIONS: LegalSection[] = [
  {
    title: "Part I: Terms of Service",
    part: true,
  },
  {
    title: "1. Definitions",
    body: [
      [
        '"Prevail" refers to the open-source software available under the GNU General Public License v3.0 at github.com/fru-dev3/prevail-desktop and github.com/fru-dev3/prevail-cli.',
        '"fru.dev" (also "we," "us," or "our") refers to fru.dev (@fru), the maker that develops Prevail and operates the prevail.sh website.',
        '"Services" refers to the prevail.sh website, the install script served from it, the documentation, and any optional telemetry endpoint operated by fru.dev. Prevail itself runs entirely on your own machine and is not a hosted service.',
        '"User," "you," or "your" refers to any individual or entity using Prevail or the Services.',
        '"Content" refers to your vault and any data, files, prompts, or output you create with Prevail. Your Content lives on your machine; we do not receive it.',
      ],
    ],
  },
  {
    title: "2. Acceptance of Terms",
    body: [
      "By downloading, installing, or using Prevail, or by accessing the Services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you are using Prevail on behalf of an organization, you represent that you have the authority to bind that organization to these terms.",
      "If you do not agree to these terms, you must discontinue use of Prevail and the Services. Your continued use constitutes ongoing acceptance of these terms as they may be amended from time to time.",
    ],
  },
  {
    title: "3. Open-Source Software",
    body: [
      "Prevail is licensed under the GNU General Public License v3.0 (GPL-3.0). Nothing in these Terms of Service restricts, modifies, or supersedes the rights granted to you under that license with respect to the source code itself, including the rights to use, study, modify, and redistribute the software under the terms of the GPL-3.0.",
      "These Terms of Service govern the Services (the website, install script, and any optional telemetry endpoint) and your use of the Prevail name and branding, which are separate from the rights granted under the GPL-3.0.",
    ],
  },
  {
    title: "4. Acceptable Use",
    body: [
      "You agree to use Prevail and the Services only for lawful purposes and in compliance with all applicable laws and regulations. You shall not:",
      [
        "Use Prevail or the Services to engage in any activity that is illegal, harmful, or fraudulent;",
        "Attempt to gain unauthorized access to the prevail.sh website, its infrastructure, or any system operated by fru.dev;",
        "Interfere with or disrupt the integrity, security, or performance of the Services;",
        "Use the Services to transmit viruses, malware, or other harmful code;",
        "Misrepresent the Prevail name or branding, or distribute modified builds in a way that implies official endorsement by fru.dev;",
        "Resell or sublicense access to the Services without prior written authorization (this does not affect your rights to the source code under the GPL-3.0).",
      ],
    ],
  },
  {
    title: "5. No Accounts",
    body: [
      "Prevail requires no account, sign-up, or login. There are no credentials for us to store and no profile for us to maintain. You are responsible for the security of your own machine and the vault stored on it.",
    ],
  },
  {
    title: "6. Your Content and Intellectual Property",
    body: [
      "You own your vault and everything in it. Prevail is local-first: your Content stays in plain files on your machine and never leaves it except where you explicitly direct it, for example when you use Cloud Mode, which sends your prompts and the context you select to the AI providers you choose.",
      "We claim no license to, and no ownership of, your Content. Because we do not receive it, we cannot use, reproduce, or distribute it.",
      "fru.dev retains all rights, title, and interest in the Prevail name, logo, and branding, and in the prevail.sh website. The source code remains available to you under the GPL-3.0.",
    ],
  },
  {
    title: "7. Third-Party AI Providers and Tools",
    body: [
      "Prevail orchestrates third-party AI command-line tools and models that you have installed or are logged into, for example Claude, Codex, Gemini, and local models via Ollama. Prevail does not provide these models; it convenes the ones already available on your machine.",
      "When you use Cloud Mode, your prompts and the context you select are sent to the third-party providers you choose, under their own terms of service and privacy policies. In Bunker Mode, processing stays on-device with local models. You are responsible for reviewing and complying with the terms of each provider you enable.",
    ],
  },
  {
    title: "8. Telemetry and Analytics",
    body: [
      "Prevail collects no telemetry by default. It sends nothing unless you explicitly opt in within Settings. If you opt in, telemetry is anonymous (a random local identifier, never your name, email, files, or chats), limited to a small fixed list of events, and you can see exactly what is sent and turn it off at any time.",
      "The prevail.sh marketing website uses Google Analytics to understand aggregate traffic. Ratings, user counts, and similar figures shown on the website are illustrative.",
    ],
  },
  {
    title: "9. Disclaimers",
    caps: true,
    body: [
      'PREVAIL AND THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. FRU.DEV SPECIFICALLY DISCLAIMS ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.',
      "PREVAIL IS EARLY, EXPERIMENTAL SOFTWARE. IT ORCHESTRATES THIRD-PARTY AI TOOLS THAT CAN PRODUCE INACCURATE OR INCOMPLETE OUTPUT. NOTHING PRODUCED BY PREVAIL IS LEGAL, FINANCIAL, TAX, MEDICAL, OR OTHER PROFESSIONAL ADVICE. ALWAYS REVIEW ANYTHING IMPORTANT YOURSELF AND CONSULT A QUALIFIED PROFESSIONAL.",
      "FRU.DEV DOES NOT WARRANT THAT PREVAIL OR THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. YOU USE THEM AT YOUR OWN RISK.",
    ],
  },
  {
    title: "10. Limitation of Liability",
    caps: true,
    body: [
      "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL FRU.DEV BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO YOUR USE OF OR INABILITY TO USE PREVAIL OR THE SERVICES.",
      "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FRU.DEV'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS, PREVAIL, OR THE SERVICES SHALL NOT EXCEED ONE HUNDRED U.S. DOLLARS ($100). PREVAIL IS FREE AND OPEN-SOURCE SOFTWARE.",
    ],
  },
  {
    title: "11. Indemnification",
    body: [
      "You agree to indemnify, defend, and hold harmless fru.dev from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to: (a) your use of Prevail or the Services; (b) your violation of these terms; (c) your violation of any third-party right, including any intellectual property or privacy right, or the terms of any third-party AI provider; or (d) any Content you process using Prevail.",
    ],
  },
  {
    title: "12. Modifications to These Terms",
    body: [
      "fru.dev may modify these terms at any time. Changes are effective upon posting to this page with an updated effective date. Your continued use of Prevail or the Services after a change constitutes acceptance of the revised terms. It is your responsibility to review these terms periodically.",
    ],
  },
  {
    title: "13. Termination",
    body: [
      "You may stop using Prevail and the Services at any time. Because Prevail runs locally and requires no account, fru.dev does not control your local use and cannot revoke a copy you already have, subject to the GPL-3.0. fru.dev may suspend or discontinue the Services (such as the website or install script) at any time, with or without notice.",
      "Sections that by their nature should survive termination, including Sections 6, 8, 9, 10, and 11, shall survive.",
    ],
  },
  {
    title: "14. Governing Law",
    body: [
      "These terms are governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict-of-laws principles. Any dispute arising out of or relating to these terms, Prevail, or the Services shall be subject to the exclusive jurisdiction of the state and federal courts located in California.",
    ],
  },
  {
    title: "15. General Provisions",
    body: [
      [
        "Entire Agreement: These terms constitute the entire agreement between you and fru.dev regarding the Services and supersede all prior agreements and understandings.",
        "Severability: If any provision is found unenforceable, the remaining provisions continue in full force and effect.",
        "Waiver: A failure to enforce any right or provision is not a waiver of that right or provision.",
        "Assignment: You may not assign these terms without our prior written consent; fru.dev may assign them without restriction.",
        "Force Majeure: fru.dev is not liable for any failure or delay in performance resulting from causes beyond its reasonable control.",
      ],
    ],
  },
  {
    title: "Part II: Privacy Policy",
    part: true,
    anchor: "privacy",
  },
  {
    title: "1. Our Approach to Privacy",
    body: [
      "Prevail is built local-first. The software runs on your machine, stores your vault in plain files you own, and sends us nothing by default. This Privacy Policy describes the limited data collected through the Services (the prevail.sh website and any optional, opt-in telemetry), not data from Prevail itself, which we do not receive.",
      "This policy does not apply to third-party services or AI providers you use alongside Prevail. We encourage you to review their privacy policies.",
    ],
  },
  {
    title: "2. Data We Collect",
    body: [
      "We collect very little, and nothing about your vault:",
      [
        "From Prevail: nothing, by default. We do not operate accounts and do not receive your vault, files, prompts, or AI output.",
        "Website analytics: when you visit prevail.sh, Google Analytics records standard web data such as pages viewed, browser and device type, approximate location derived from IP address, and referral source.",
        "Optional telemetry (opt-in only): if you enable it in Settings, Prevail sends a random local identifier and a small fixed set of anonymous usage events. It never includes your name, email, files, or chats.",
        "Communications: if you email us or open a GitHub issue, we receive the content of that message.",
      ],
    ],
  },
  {
    title: "3. How We Use Data",
    body: [
      "We use the limited data we collect to:",
      [
        "Operate, maintain, and improve Prevail and the website;",
        "Understand aggregate usage and performance;",
        "Respond to support requests, feedback, and bug reports;",
        "Detect, prevent, and address security or technical issues;",
        "Comply with legal obligations.",
      ],
      "We do not sell your data. We do not use your vault or Content to train machine-learning models; we do not have it.",
    ],
  },
  {
    title: "4. Data Sharing and Disclosure",
    body: [
      "We do not sell personal data. We may share the limited data we hold in these circumstances:",
      [
        "Service providers: with the vendors that run our infrastructure (for example Vercel for website hosting, Google Analytics, and GitHub for source, releases, and issues), subject to their own terms.",
        "Legal requirements: when required by law, regulation, legal process, or governmental request.",
        "Protection of rights: to protect the rights, property, or safety of fru.dev, our users, or the public.",
      ],
      "Separately, when you choose Cloud Mode, Prevail sends your prompts directly to the third-party AI providers you select. That exchange is governed by each provider's own privacy policy; the data does not pass through fru.dev.",
    ],
  },
  {
    title: "5. Data Retention",
    body: [
      "We retain the limited data we collect only as long as reasonably necessary for the purposes described in this policy or as required by law. Aggregated or anonymized analytics that cannot identify you may be retained indefinitely. Your vault is retained by you, on your machine, for as long as you keep it.",
    ],
  },
  {
    title: "6. Data Security",
    body: [
      "We apply commercially reasonable measures to protect the data we hold. Because Prevail is local-first, the security of your vault is largely in your hands: it lives on your machine, and you choose how to back it up or sync it (for example git, iCloud, or Tailscale). No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    title: "7. Your Rights",
    body: [
      "Depending on your jurisdiction, you may have rights to access, correct, delete, port, or restrict the processing of personal data we hold, and to withdraw consent where processing is based on consent. Because we hold little or no personal data about you, there is often little for us to return or delete. To exercise any of these rights, contact us using the details below.",
    ],
  },
  {
    title: "8. International Data Transfers",
    body: [
      "The Services are operated from, and the limited data they collect may be processed in, the United States and other countries. By using the Services, you consent to the transfer of that data to jurisdictions that may have different data-protection laws than your own.",
    ],
  },
  {
    title: "9. Children's Privacy",
    body: [
      "The Services are not directed to children under the age of 13 (or the applicable age of digital consent in your jurisdiction), and we do not knowingly collect personal data from children. If you believe a child has provided us data, please contact us and we will delete it promptly.",
    ],
  },
  {
    title: "10. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. Changes are posted to this page with a revised effective date. Your continued use of the Services after changes are posted constitutes acceptance of the revised policy.",
    ],
  },
  {
    title: "Contact",
    body: [
      "If you have questions about these Terms of Service or this Privacy Policy, please reach out:",
      [
        "Maker: fru.dev (@fru)",
        "GitHub: github.com/fru-dev3/prevail-desktop/issues",
      ],
    ],
  },
];

function LegalPage() {
  useEffect(() => {
    const path =
      typeof window !== "undefined"
        ? window.location.pathname.replace(/\/+$/, "")
        : "";
    if (path === "/privacy") {
      const el = document.getElementById("privacy");
      if (el) el.scrollIntoView();
    }
  }, []);

  return (
    <main className="pt-14">
      <section className="relative overflow-hidden py-20 md:py-28 grain">
        <div className="glow-accent absolute inset-0 -z-10 opacity-25" />
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Legal</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
              Terms of Service{" "}
              <span className="font-serif italic text-text-soft">&amp;</span>{" "}
              Privacy Policy
            </h1>
            <p className="mt-5 text-sm text-text-mute">
              Effective date: {LEGAL_EFFECTIVE}
            </p>
            <p className="mt-6 text-lg leading-relaxed text-text-soft">
              This document sets out the Terms of Service and Privacy Policy
              governing your use of Prevail (the open-source software) and the
              prevail.sh website and related services operated by fru.dev
              (&ldquo;Prevail,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;). By using Prevail or these services, you agree to
              be bound by these terms.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="border-t border-border-soft py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-6">
          {LEGAL_SECTIONS.map((s) =>
            s.part ? (
              <h2
                key={s.title}
                id={s.anchor}
                className="mt-14 scroll-mt-24 border-b border-border-soft pb-4 text-xs font-medium uppercase tracking-[0.2em] text-accent first:mt-0"
              >
                {s.title}
              </h2>
            ) : (
              <div key={s.title} className="mt-10">
                <h3 className="text-lg font-semibold tracking-[-0.01em] md:text-xl">
                  {s.title}
                </h3>
                {s.body?.map((block, bi) =>
                  Array.isArray(block) ? (
                    <ul
                      key={bi}
                      className="mt-3 space-y-2 pl-5 text-text-soft [list-style:disc]"
                    >
                      {block.map((li, li2) => (
                        <li key={li2} className="leading-relaxed">
                          {li}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      key={bi}
                      className={`mt-3 leading-relaxed text-text-soft ${
                        s.caps ? "text-xs uppercase tracking-wide text-text-mute" : ""
                      }`}
                    >
                      {block}
                    </p>
                  )
                )}
              </div>
            )
          )}

          <div className="mt-16 border-t border-border-soft pt-8">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-text-soft hover:text-text"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Back to home
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGELOG + ROADMAP — minimalist. Shipped = real major milestones distilled
// from the desktop/CLI CHANGELOG.md; Roadmap = directional, not commitments.

const RELEASES_URL = `${GITHUB_DESKTOP}/releases`;
const RELEASES_LATEST = `${GITHUB_DESKTOP}/releases/latest`;

const SHIPPED = [
  {
    date: "Oct 2026",
    tag: "0.4.7 · Breaking",
    Icon: Compass,
    title: "Your Compass, a team of specialists, and two clear groups",
    body: "One page for what you live by, in your own words, from Purpose down to the tasks it serves. A chief of staff you name staffs specialists who answer in your chats as themselves, inside limits enforced in code. Everything sits in Entities (people, places, products, things) and Activities (events, projects), each with a chat of its own. Start a project by describing it, and add Knowledge sources (sites, feeds, folders) Prevail reads when it briefs you. Breaking: loops are now playbooks, missions are called projects, and household and packs were removed.",
    href: `${GITHUB_DESKTOP}/releases/tag/v0.4.7`,
  },
  {
    date: "Sep 2026",
    tag: "0.4.4",
    Icon: Target,
    title: "Projects, and a structure that grows with you",
    body: "Projects are their own thing: status, what done looks like, a target date, their domains and goals, and a chat of their own. When a topic with no home keeps coming up, Prevail offers a new domain and fills it in; you accept, snooze or say never. Apps read reliably inside Claude Code, say plainly when they need you to sign in again, and work across several Google accounts.",
    href: `${GITHUB_DESKTOP}/releases/tag/v0.4.4`,
  },
  {
    date: "Sep 2026",
    tag: "0.4.3",
    Icon: Layers,
    title: "What you say reaches everywhere it belongs",
    body: "Mention an insurance claim while chatting in another domain and Prevail notes it in Insurance too, and on the thing it concerns, with a line under the reply showing where it landed. Every domain and every one of your things gets an Across your life section, folded into its state once a day. Your own people, places and things are kept apart from names that only come up in a reply.",
    href: `${GITHUB_DESKTOP}/releases/tag/v0.4.3`,
  },
  {
    date: "Sep 2026",
    tag: "0.4.1",
    Icon: Plug,
    title: "Chat with your apps, and your own data as a source",
    body: "Pick an app like Gmail and chat with it, or type @ in any conversation to bring in an app, a person or a domain. Every call an app gets is logged, with anything sensitive left out. Add your own data sites as trusted sources: an MCP address, a site or links. Named councils, a simpler Arena, entity pictures and duplicate merging, and a much faster app: clicks no longer freeze the window.",
    href: `${GITHUB_DESKTOP}/releases/tag/v0.4.1`,
  },
  {
    date: "Sep 2026",
    tag: "0.4.0 · Breaking",
    Icon: Target,
    title: "A focus release",
    body: "Prevail does fewer things, and every page works the same way: tabs, a column of items, and the one you pick in full. Spark, Automations, Calendar, Notes and the Work board are removed from the app (your loops keep running and your notes stay in your vault). Settings is down to 11 entries.",
    href: `${GITHUB_DESKTOP}/releases/tag/v0.4.0`,
  },
  {
    date: "Sep 2026",
    tag: "Entities",
    Icon: Users,
    title: "Chat with anything",
    body: "Every person, place, company and thing gets its own conversation that builds over time, with what you know about it in front of the model on every turn. Save any reply to its notes in one click.",
    href: `${GITHUB_DESKTOP}/releases/tag/v0.4.0`,
  },
  {
    date: "Sep 2026",
    tag: "Goals",
    Icon: Crown,
    title: "Mission, vision and goals, with history",
    body: "Your mission and vision sit alongside the goals you add over time. Click any part of your mission to rewrite it; every save keeps the earlier text, and any version can be restored.",
    href: `${GITHUB_DESKTOP}/releases/tag/v0.4.0`,
  },
  {
    date: "Sep 2026",
    tag: "Approvals",
    Icon: ShieldCheck,
    title: "Approve right in the conversation",
    body: "When an agent needs your OK, a card appears under its reply: Allow once, Always for low-risk edits, or Deny. Anything that sends, spends, deletes or touches a password always asks. Schedule a conversation to run on its own.",
    href: `${GITHUB_DESKTOP}/releases/tag/v0.3.131`,
  },
  {
    date: "Jul 2026",
    tag: "Palette",
    Icon: Terminal,
    title: "Command palette",
    body: "Press Cmd+K to jump anywhere or do anything: new chat, tasks, notes, every setting, and every domain, all from one search.",
    href: RELEASES_LATEST,
  },
  {
    date: "Jul 2026",
    tag: "Autonomy",
    Icon: ShieldCheck,
    title: "A graduated autonomy brake",
    body: "Every action is now graded: safe reads run, reversible ones run sandboxed, and only consequential actions stop for your approval. See exactly what each will do before it happens.",
    href: RELEASES_LATEST,
  },
  {
    date: "Jul 2026",
    tag: "Budgets",
    Icon: Wallet,
    title: "Spend budgets with real numbers",
    body: "Set a monthly spend cap and watch actual month-to-date spend against it, so autonomous actions never surprise your wallet.",
    href: RELEASES_LATEST,
  },
  {
    date: "Jul 2026",
    tag: "Proactive",
    Icon: Activity,
    title: "Prevail reaches out",
    body: "During your active hours, it nudges you with a desktop notification when an approval or overdue task needs you, instead of waiting to be opened.",
    href: RELEASES_LATEST,
  },
  {
    date: "Jul 2026",
    tag: "Capture",
    Icon: Paperclip,
    title: "Turn any reply into action",
    body: "Make a reply a task, note, skill, or automation, pin it to memory, or paste a screenshot, all without leaving the conversation. Voice capture works from anywhere with a global hotkey.",
    href: RELEASES_LATEST,
  },
  {
    date: "Jul 2026",
    tag: "Security",
    Icon: Star,
    title: "Never locked out",
    body: "Forgot the passcode on an encrypted vault? Your one-time recovery code now unlocks it and sets a new passcode, so your data is never stranded.",
    href: RELEASES_LATEST,
  },
  {
    date: "Jun 2026",
    tag: "Windows",
    Icon: Monitor,
    title: "Prevail for Windows",
    body: "A native Windows app (NSIS installer) now ships alongside macOS. Same app, same vault.",
    href: RELEASES_LATEST,
  },
  {
    date: "Jun 2026",
    tag: "Loops",
    Icon: RefreshCw,
    title: "Self-driving Domain Loops",
    body: "Each domain runs on persistent loops that learn from their history, create tracked tasks, ask permission for anything irreversible, and act through your connectors.",
    href: RELEASES_LATEST,
  },
  {
    date: "Jun 2026",
    tag: "Board",
    Icon: LayoutGrid,
    title: "A board for your work",
    body: "A Kanban board to plan and track the tasks Prevail surfaces across every domain, in one view.",
    href: RELEASES_LATEST,
  },
  {
    date: "Jun 2026",
    tag: "Incognito",
    Icon: EyeOff,
    title: "Incognito mode",
    body: "Convene a council that leaves no trace. An ephemeral session with nothing written to your vault.",
    href: RELEASES_LATEST,
  },
  {
    date: "Jun 2026",
    tag: "Benchmark",
    Icon: BarChart3,
    title: "Benchmark against your life",
    body: "Per-domain leaderboards graded two ways, scheduled runs, richer scenarios (recency, bias, brevity, tax traps), and drill-down into every question.",
    href: RELEASES_URL,
  },
  {
    date: "Jun 2026",
    tag: "Recommendations",
    Icon: Sparkles,
    title: "Proactive recommendations and self-connecting apps",
    body: "A feed that watches how you work and proposes the next moves. Connect a tool just by describing the goal and an agent sets it up.",
    href: RELEASES_URL,
  },
  {
    date: "Jun 2026",
    tag: "Desktop",
    Icon: ShieldCheck,
    title: "Native app, signed and hardened",
    body: "A native macOS app, signed and notarized by Apple, with demo-first onboarding, an embedded vault, and on-device encryption.",
    href: RELEASES_URL,
  },
  {
    date: "Jun 2026",
    tag: "Council",
    Icon: Scale,
    title: "The council",
    body: "One question fans out to every model you have. A chair you choose writes a single verdict with a panel showing where they disagreed.",
    href: RELEASES_URL,
  },
  {
    date: "May 2026",
    tag: "Engine",
    Icon: Terminal,
    title: "The first release",
    body: "The Prevail engine: your life as plain markdown folders an AI can reason over. Local-first from line one.",
    href: RELEASES_URL,
  },
];

const ROADMAP = [
  {
    Icon: Landmark,
    title: "Life connectors and ecosystem",
    body: "First-class connectors for the parts of life that matter most: banking, finance, wealth, insurance, and health, all flowing into your vault.",
  },
  {
    Icon: Send,
    title: "More surfaces",
    body: "Reach the council where you already are: Telegram, WhatsApp, and more.",
  },
  {
    Icon: Boxes,
    title: "Open-source models",
    body: "Broader, first-class support for local and open models, not just the frontier.",
  },
  {
    Icon: Plug,
    title: "MCP and the agent ecosystem",
    body: "Robust MCP interop with tools like OpenClaw, Paperclip, and the Hermes agent.",
  },
  {
    Icon: Wallet,
    title: "Budgets and cost control",
    body: "Better management of AI spend and telemetry, by model and by domain.",
  },
  {
    Icon: Activity,
    title: "Telemetry and insights",
    body: "Opt-in, in-app collection that surfaces how your council performs over time.",
  },
];

function ChangelogPage() {
  return (
    <main className="pt-14">
      <section className="relative overflow-hidden py-20 md:py-24 grain">
        <div className="glow-accent absolute inset-0 -z-10 opacity-25" />
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Changelog &amp; roadmap</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
              What's shipped,{" "}
              <span className="font-serif italic text-text-soft">what's next.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-text-soft">
              Prevail moves fast. The major milestones so far, and a look at where
              it's heading.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* On the horizon: roadmap as a timeline, above the shipped line */}
      <section className="border-t border-border-soft py-14 md:py-16 grain">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-ai">On the horizon</h2>
            <p className="mt-2 text-sm text-text-mute">Directional, not a commitment. It shifts as we learn.</p>
          </FadeIn>
          <div className="mt-8 border-l border-dashed border-ai/40 pl-6">
            {ROADMAP.map((r, i) => {
              const Icon = r.Icon;
              return (
                <FadeIn key={r.title} delay={i * 0.04}>
                  <div className="relative pb-9 last:pb-0">
                    <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-ai/40 bg-bg text-ai ring-4 ring-bg">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="rounded-full border border-ai/40 bg-ai/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ai">Planned</span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold tracking-[-0.01em]">{r.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-text-soft">{r.body}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Shipped: deployed timeline (accent), below the line */}
      <section className="border-t border-border-soft py-14 md:py-16">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Shipped</h2>
          </FadeIn>
          <div className="mt-8 border-l border-border-soft pl-6">
            {SHIPPED.map((r, i) => {
              const Icon = r.Icon;
              return (
                <FadeIn key={r.title} delay={i * 0.04}>
                  <div className="relative pb-9 last:pb-0">
                    <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-accent-border bg-surface-0 text-accent ring-4 ring-bg">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-xs uppercase tracking-wider text-text-mute">{r.date}</span>
                      <a
                        href={r.href}
                        target="_blank"
                        rel="noreferrer"
                        title="View on GitHub Releases"
                        className="rounded-full border border-accent-border/60 bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent transition-colors hover:bg-accent/20"
                      >
                        {r.tag} ↗
                      </a>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold tracking-[-0.01em]">{r.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-text-soft">{r.body}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
          <FadeIn>
            <p className="mt-2 text-sm text-text-mute">
              Full per-version notes live on{" "}
              <a href={`${GITHUB_DESKTOP}/releases`} target="_blank" rel="noreferrer" className="text-text-soft underline-offset-2 hover:text-text hover:underline">GitHub Releases</a>.
            </p>
          </FadeIn>
          <FadeIn>
            <div className="mt-10">
              <a href="/" className="inline-flex items-center gap-1.5 text-sm text-text-soft hover:text-text">
                <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Back to home
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}

function LandingMain() {
  return (
    <main className="pt-14">
      <Hero />
      <Pillars />
      <Momentum />
      <DownloadSection />
      <FAQSection />
    </main>
  );
}

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const path = typeof window !== "undefined" ? window.location.pathname.replace(/\/+$/, "") : "";
  const isThesis = path === "/thesis";
  const isChangelog = path === "/changelog" || path === "/roadmap";
  const isLegal =
    path === "/tos" ||
    path === "/terms" ||
    path === "/privacy" ||
    path === "/legal";

  useEffect(() => {
    const handler = (e: Event) => {
      const t = e.target as HTMLAnchorElement;
      if (t.tagName === "A" && t.hash && t.hash.length > 1) {
        const el = document.querySelector(t.hash);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <Nav theme={theme} onToggleTheme={toggleTheme} />
      {isThesis ? <ThesisPage /> : isChangelog ? <ChangelogPage /> : isLegal ? <LegalPage /> : <LandingMain />}
      <Footer />
    </div>
  );
}
