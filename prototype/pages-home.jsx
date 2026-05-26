// pages-home.jsx — Home with three hero variants
//   heroVariant: "type" | "marquee" | "reel"

function HeroType({ go }) {
  const roles = window.copy("home.typeRoleStrip", ["Motion", "3D / CG", "Illustration", "Video", "AI / Workflows", "Code"]);
  const meta  = window.copy("home.typeMetaGrid", []);
  // Headline supports <em> for accent emphasis on a single word — we
  // render it as a raw HTML span so editors can change which word is hot.
  const headline = window.copy("home.typeHeadline",
    "Motion artist building AI workflows for the things that move.");
  return (
    <section className="hero hero-type">
      <div>
        <div className="sec-label">2026 — Folio · ix.01</div>
        <h1 className="t-display"
            dangerouslySetInnerHTML={{ __html: headline }} />
        <div className="role-strip">
          {roles.map((r, i) => <span key={i}>{r}</span>)}
        </div>
      </div>
      <div className="meta-grid">
        {meta.map((cell, i) => (
          <div key={i} className="cell">
            <div className="k">{cell.k}</div>
            <div className="v">{cell.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HeroMarquee({ go }) {
  // Build a repeated marquee strip — has to repeat twice for seamless loop.
  // Words come from SITE.marquee so the admin panel can edit them.
  const words = (window.SITE.marquee && window.SITE.marquee.length > 0)
    ? window.SITE.marquee
    : ["Motion", "3D", "Illustration", "AI Workflows", "Code", "Process"];
  const strip = (key) => (
    <span className="marquee-inner" key={key}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className={i % 2 === 0 ? "" : "ghost"}>{w}</span>
          <span className="sep" />
        </React.Fragment>
      ))}
      {words.map((w, i) => (
        <React.Fragment key={"d" + i}>
          <span className={i % 2 === 0 ? "" : "ghost"}>{w}</span>
          <span className="sep" />
        </React.Fragment>
      ))}
    </span>
  );

  const featured = window.getFeatured() || window.PROJECTS[0];
  // Featured H2 follows the featured project — uses its `pitch` if set,
  // else falls back to its `brief`. Edit the project itself to change.
  const featuredHeadline = featured.pitch || featured.brief;

  return (
    <section className="hero hero-marquee">
      <div className="marquee-track" data-cursor="link" data-cursor-label="Browse">
        {strip("a")}
      </div>
      <div className="below">
        <div>
          <div className="sec-label">{window.copy("home.loopFeaturedEyebrow", "Featured project")}</div>
          <h2 className="t-h2" style={{ maxWidth: "20ch", marginBottom: 20 }}>
            {featuredHeadline}
          </h2>
          <p className="t-body" style={{ maxWidth: "44ch", marginBottom: 28 }}>
            {featured.brief}
          </p>
          <Magnetic>
            <a href={`/work/${featured.id}`} className="btn"
               data-cursor="view" data-cursor-label="Open case"
               onClick={(e) => { e.preventDefault(); go(`/work/${featured.id}`); }}>
              Open the case study
              <span className="arr">→</span>
            </a>
          </Magnetic>
        </div>
        <a href={`/work/${featured.id}`} data-cursor="view" data-cursor-label="View"
           onClick={(e) => { e.preventDefault(); go(`/work/${featured.id}`); }}
           className="featured-peek clickable">
          <VideoHero project={featured} showLabel={false} />
          <div className="peek-label">
            <div>
              <div className="t-mono-sm" style={{ color: "var(--fg-2)" }}>{featured.sub}</div>
              <div className="tile-title" style={{ marginTop: 4 }}>{featured.title}</div>
            </div>
            <div className="t-mono">{featured.year}</div>
          </div>
        </a>
      </div>
    </section>
  );
}

function HeroReel({ go }) {
  // Reel hero shows the single featured project. Falls back to PROJECTS[0]
  // if nothing is marked featured.
  const featured = window.getFeatured() || window.PROJECTS[0];
  return (
    <section className="hero hero-reel">
      <div className="reel-surface">
        <Placeholder project={featured} showLabel={false} />
      </div>
      <button className="play-btn" data-cursor="view" data-cursor-label="Play reel"
              onClick={() => go(`/work/${featured.id}`)}>
        <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
          <path d="M2 1.5L18 11L2 20.5V1.5Z" fill="currentColor" />
        </svg>
      </button>
      <div className="reel-overlay">
        <div className="reel-top">
          <div className="sec-label" style={{ color: "var(--fg-2)" }}>
            {window.copy("home.reelEyebrow", "Showreel — 2026 selection")}
          </div>
          <div className="t-mono" style={{ color: "var(--fg-2)" }}>
            {window.copy("home.reelMeta", "02:14 · 4K · 24fps")}
          </div>
        </div>
        <div className="reel-bottom">
          <div>
            <h1 className="t-display" style={{ fontSize: "clamp(48px, 9vw, 140px)", marginBottom: 24 }}
                dangerouslySetInnerHTML={{ __html:
                  window.copy("home.reelHeadline", "Frames, systems, shipped.") }} />
            <p className="t-body" style={{ maxWidth: "44ch" }}>
              {window.copy("home.reelBlurb",
                "A motion artist and AI workflow engineer.")}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="t-mono-sm" style={{ marginBottom: 12 }}>
              {window.copy("home.reelNowPlaying", "Now playing")}
            </div>
            <div className="t-h3" style={{ marginBottom: 8 }}>{featured.title}</div>
            <div className="t-mono" style={{ color: "var(--muted)" }}>
              {featured.sub} — {featured.year}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedStrip({ go }) {
  // Show the featured project first, then the next 3 by array order.
  // If nothing's featured we just take the first 4.
  const feat = window.getFeatured();
  const rest = window.PROJECTS.filter((p) => !feat || p.id !== feat.id);
  const list = (feat ? [feat, ...rest] : rest).slice(0, 4);
  return (
    <section className="featured-strip">
      <div className="head">
        <div>
          <div className="sec-label">
            {window.copy("home.featuredEyebrow", "Selected work")} · {list.length}
          </div>
          <h2 className="t-h2" style={{ marginTop: 8, maxWidth: "18ch" }}>
            {window.copy("home.featuredTitle", "Recent projects")}
          </h2>
        </div>
        <Magnetic>
          <a href="/work" className="btn ghost"
             data-cursor="link"
             onClick={(e) => { e.preventDefault(); go("/work"); }}>
            {window.copy("home.featuredCtaAll", "All work")}
            <span className="arr">→</span>
          </a>
        </Magnetic>
      </div>
      <div className="featured-grid">
        {list.map((p) => (
          <a key={p.id} href={`/work/${p.id}`}
             data-cursor="view" data-cursor-label="View"
             onClick={(e) => { e.preventDefault(); go(`/work/${p.id}`); }}
             className="tile clickable"
             style={{ aspectRatio: "16/10" }}>
            <div className="tile-media">
              <Placeholder project={p} showLabel={false} />
            </div>
            <div className="tile-top">
              <div className="tile-index">/ 0{window.PROJECTS.indexOf(p) + 1}</div>
              <div className="tile-meta">{p.disciplines.map(d => d.toUpperCase()).join(" · ")}</div>
            </div>
            <div className="tile-foot">
              <div>
                <div className="tile-title">{p.title}</div>
                <div className="t-mono-sm" style={{ marginTop: 4 }}>{p.sub}</div>
              </div>
              <div className="tile-arrow">→</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function NotesStrip({ go }) {
  // Show pinned first, then by recency; cap to 3.
  const list = window.getSortedNotes().slice(0, 3);
  return (
    <section className="featured-strip" style={{ paddingTop: 24, paddingBottom: 80 }}>
      <div className="head">
        <div>
          <div className="sec-label">{window.copy("home.notesEyebrow", "Notes & process")}</div>
          <h2 className="t-h2" style={{ marginTop: 8, maxWidth: "20ch" }}>
            {window.copy("home.notesTitle", "Short writing on tools, rigs and how things get made.")}
          </h2>
        </div>
        <Magnetic>
          <a href="/notes" className="btn ghost"
             data-cursor="link"
             onClick={(e) => { e.preventDefault(); go("/notes"); }}>
            All notes
            <span className="arr">→</span>
          </a>
        </Magnetic>
      </div>
      <div style={{ borderTop: "1px solid var(--line)" }}>
        {list.map((n, i) => (
          <a key={n.id} href={`/notes/${n.id}`}
             onClick={(e) => { e.preventDefault(); go(`/notes/${n.id}`); }}
             data-cursor="view" data-cursor-label="Read"
             className="clickable"
             style={{ display: "grid", gridTemplateColumns: "110px 1fr 110px 24px",
                      gap: 24, padding: "22px 0",
                      borderBottom: "1px solid var(--line)",
                      alignItems: "baseline",
                      transition: "padding-left var(--t-fast), color var(--t-fast)" }}
             onMouseEnter={(e) => {
               e.currentTarget.style.paddingLeft = "8px";
               e.currentTarget.style.color = "var(--accent)";
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.paddingLeft = "0";
               e.currentTarget.style.color = "";
             }}>
            <div className="t-mono-sm">{n.date}</div>
            <div className="t-h3" style={{ fontWeight: 400 }}>{n.title}</div>
            <div className="t-mono-sm">{n.kind}</div>
            <div className="t-mono" style={{ textAlign: "right" }}>↗</div>
          </a>
        ))}
      </div>
    </section>
  );
}

function PageHome({ go, heroVariant }) {
  let hero;
  if (heroVariant === "marquee") hero = <HeroMarquee go={go} />;
  else if (heroVariant === "reel") hero = <HeroReel go={go} />;
  else hero = <HeroType go={go} />;

  return (
    <div className="page page-enter">
      {hero}
      {heroVariant !== "reel" && <FeaturedStrip go={go} />}
      {heroVariant === "reel" && <FeaturedStrip go={go} />}
      <NotesStrip go={go} />
      <Footer go={go} />
    </div>
  );
}

Object.assign(window, { PageHome });
