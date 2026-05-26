// app.jsx — router, page transitions, tweaks shell

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": ["#FF5B1F", "#0E1117", "#EDE5D8"],
  "heroVariant": "marquee",
  "navVariant": "rail",
  "uppercaseDisplay": true,
  "showCursor": true
}/*EDITMODE-END*/;

// Palette presets — each is [accent, bg, fg]
const PALETTES = [
  ["#B388FF", "#0E1117", "#EDE5D8"],  // lavender on cool charcoal (default)
  ["#C8FF3F", "#0E1117", "#EDE5D8"],  // acid green
  ["#FF5B1F", "#0E1117", "#EDE5D8"],  // hot orange
  ["#4F7CFF", "#0E1117", "#EDE5D8"],  // electric blue
  ["#F2F2F2", "#0E1117", "#EDE5D8"],  // monochrome
];

function pathToRoute(path) {
  if (!path || path === "/" || path === "") return { page: "home" };
  if (path === "/work") return { page: "work" };
  if (path === "/about") return { page: "about" };
  if (path === "/contact") return { page: "contact" };
  if (path === "/admin") return { page: "admin" };
  if (path === "/notes") return { page: "notes" };
  const w = path.match(/^\/work\/(.+)$/);
  if (w) return { page: "case", id: w[1] };
  const n = path.match(/^\/notes\/(.+)$/);
  if (n) return { page: "note", id: n[1] };
  return { page: "home" };
}

function navIdForRoute(route) {
  if (route.page === "home")    return "index";
  if (route.page === "work")    return "work";
  if (route.page === "case")    return "work";
  if (route.page === "about")   return "about";
  if (route.page === "contact") return "contact";
  if (route.page === "notes")   return "notes";
  if (route.page === "note")    return "notes";
  if (route.page === "admin")   return "admin";
  return "";
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [path, setPath] = React.useState(() => {
    // Use hash routing so the artifact works as a single file
    const h = window.location.hash.replace(/^#/, "");
    return h || "/";
  });
  const [wiping, setWiping] = React.useState(false);
  // Force re-render whenever content (PROJECTS, SITE) changes from /admin.
  const [, forceRender] = React.useReducer((v) => v + 1, 0);
  React.useEffect(() => {
    const handler = () => forceRender();
    window.addEventListener("contentchanged", handler);
    return () => window.removeEventListener("contentchanged", handler);
  }, []);

  const route = pathToRoute(path);
  const currentNavId = navIdForRoute(route);

  // Apply theme (from window.THEME) on every content change, then layer
  // any Tweaks-panel palette overrides on top. THEME is the persistent
  // admin-editable source; the Tweaks palette is the runtime exploration.
  React.useEffect(() => {
    window.applyTheme();
    if (t.palette) {
      const [accent, bg, fg] = t.palette;
      const r = document.documentElement;
      r.style.setProperty("--accent", accent);
      r.style.setProperty("--bg", bg);
      r.style.setProperty("--fg", fg);
      const isLight = (() => {
        const h = accent.replace("#", "");
        const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, "0");
        const n = parseInt(x.slice(0, 6), 16);
        const r2 = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        return r2 * 299 + g * 587 + b * 114 > 148000;
      })();
      r.style.setProperty("--accent-ink", isLight ? "#0E1117" : bg);
    }
  }, [t.palette]);

  // Re-apply theme when admin edits the THEME object (contentchanged event).
  React.useEffect(() => {
    const handler = () => window.applyTheme();
    window.addEventListener("contentchanged", handler);
    return () => window.removeEventListener("contentchanged", handler);
  }, []);

  // Navigation with wipe transition
  const go = React.useCallback((next) => {
    if (next === path) return;
    setWiping(true);
    // Halfway through the wipe (where the screen is fully covered),
    // swap the page content and scroll to top.
    setTimeout(() => {
      setPath(next);
      window.location.hash = next === "/" ? "" : next;
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 320);
    // End the wipe state at the full animation length
    setTimeout(() => setWiping(false), 720);
  }, [path]);

  // Expose go() globally so the Markdown renderer can intercept internal
  // links without prop-drilling through every component.
  React.useEffect(() => { window.__appGo = go; }, [go]);

  // Listen for browser back/forward via hash
  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      setPath(h || "/");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  let pageEl;
  switch (route.page) {
    case "home":
      pageEl = <PageHome go={go} heroVariant={t.heroVariant} />;
      break;
    case "work":
      pageEl = <PageWork go={go} />;
      break;
    case "case":
      pageEl = <PageCaseStudy projectId={route.id} go={go} />;
      break;
    case "about":
      pageEl = <PageAbout go={go} />;
      break;
    case "contact":
      pageEl = <PageContact go={go} />;
      break;
    case "notes":
      pageEl = <PageNotesIndex go={go} />;
      break;
    case "note":
      pageEl = <PageNote noteId={route.id} go={go} />;
      break;
    case "admin":
      pageEl = <PageAdmin go={go} />;
      break;
    default:
      pageEl = <PageHome go={go} heroVariant={t.heroVariant} />;
  }

  // Apply uppercase display tweak — only headings/titles, not body prose.
  // Layers on top of the THEME.capsHeadings persistent default.
  React.useEffect(() => {
    if (typeof t.uppercaseDisplay === "boolean") {
      document.body.classList.toggle("caps", !!t.uppercaseDisplay);
    }
  }, [t.uppercaseDisplay]);

  return (
    <div className="shell">
      {t.showCursor && <CustomCursor />}
      <Nav variant={t.navVariant} current={currentNavId} go={go} />
      <main className="page-content" key={path}>
        {pageEl}
      </main>
      <div className={wiping ? "wipe active" : "wipe"}>
        <div className="wipe-stripe" />
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Direction" />
        <TweakRadio
          label="Hero"
          value={t.heroVariant}
          options={[
            { value: "type",    label: "Type" },
            { value: "marquee", label: "Loop" },
            { value: "reel",    label: "Reel" },
          ]}
          onChange={(v) => setTweak("heroVariant", v)}
        />
        <TweakRadio
          label="Navigation"
          value={t.navVariant}
          options={[
            { value: "top",  label: "Top" },
            { value: "rail", label: "Rail" },
            { value: "pill", label: "Pill" },
          ]}
          onChange={(v) => setTweak("navVariant", v)}
        />
        <TweakColor
          label="Palette"
          value={t.palette}
          options={PALETTES}
          onChange={(v) => setTweak("palette", v)}
        />

        <TweakSection label="Detail" />
        <TweakToggle
          label="All-caps display"
          value={t.uppercaseDisplay}
          onChange={(v) => setTweak("uppercaseDisplay", v)}
        />
        <TweakToggle
          label="Custom cursor"
          value={t.showCursor}
          onChange={(v) => setTweak("showCursor", v)}
        />

        <TweakSection label="Jump to" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <TweakButton label="Home"    onClick={() => go("/")} secondary />
          <TweakButton label="Work"    onClick={() => go("/work")} secondary />
          <TweakButton label="Studio"  onClick={() => go("/about")} secondary />
          <TweakButton label="Contact" onClick={() => go("/contact")} secondary />
        </div>
        <TweakButton label="Open content editor" onClick={() => go("/admin")} />
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
