// pages-work.jsx — Asymmetric mosaic work index

function PageWork({ go }) {
  const [filter, setFilter] = React.useState("all");

  const filtered = React.useMemo(() => {
    if (filter === "all") return window.PROJECTS;
    return window.PROJECTS.filter((p) => p.disciplines.includes(filter));
  }, [filter]);

  // Span pattern — tessellating PAIRS where each pair sums to 12 columns
  // and shares the same row span. Cycles by index so the layout always
  // closes flush at the bottom regardless of filter.
  //   pair 0: s-1 + s-2   (7+5, height 5)
  //   pair 1: s-3 + s-4   (4+8, height 4)
  //   pair 2: s-5 + s-6   (6+6, height 4)
  //   pair 3: s-7 + s-8   (4+8, height 4)
  const cycle = ["s-1", "s-2", "s-3", "s-4", "s-5", "s-6", "s-7", "s-8"];
  const spanFor = (idx, total) => {
    // If we have an odd count, let the final tile stretch full-width
    // so the bottom row doesn't end with an empty half.
    if (idx === total - 1 && total % 2 === 1) return "s-fill";
    return cycle[idx % cycle.length];
  };

  const counts = React.useMemo(() => {
    const c = { all: window.PROJECTS.length };
    window.PROJECTS.forEach((p) => {
      p.disciplines.forEach((d) => {
        c[d] = (c[d] || 0) + 1;
      });
    });
    return c;
  }, []);

  // Compute the year range across all projects for the header eyebrow.
  const range = window.getYearRange();
  const yearRangeLabel = range
    ? (range.min === range.max ? `${range.min}` : `${range.min} — ${range.max}`)
    : "";
  const disciplineCount = window.getDisciplineCount();

  const headlineTemplate = window.copy(
    "work.headlineTemplate",
    "A working catalog of {projects} project{projectsS} across {disciplines} discipline{disciplinesS}."
  );
  const projectsS    = window.PROJECTS.length === 1 ? "" : "s";
  const disciplinesS = disciplineCount === 1 ? "" : "s";
  const headline = headlineTemplate
    .replaceAll("{projects}", window.PROJECTS.length)
    .replaceAll("{projectsS}", projectsS)
    .replaceAll("{disciplines}", disciplineCount)
    .replaceAll("{disciplinesS}", disciplinesS);

  return (
    <div className="page page-enter work-page">
      <header className="work-head">
        <div>
          <div className="sec-label">
            {window.copy("work.eyebrowPrefix", "Work")}{yearRangeLabel ? ` · ${yearRangeLabel}` : ""}
          </div>
          <h1 className="t-h1" style={{ marginTop: 12 }}>
            {headline}
          </h1>
        </div>
        <div className="lede t-body">
          {window.copy("work.lede",
            "Each piece sits in its own case study with a brief, the final result, process gallery, and a written note on how it was made. Use the filters to narrow by discipline.")}
        </div>
      </header>

      <div className="work-filters">
        {window.DISCIPLINES.map((d) => (
          <Magnetic key={d.id} strength={0.18} radius={50}>
            <button className="filter-chip"
                    data-on={filter === d.id ? "1" : "0"}
                    data-cursor="link"
                    onClick={() => setFilter(d.id)}>
              {d.label}
              <span className="count">/ {counts[d.id] || 0}</span>
            </button>
          </Magnetic>
        ))}
      </div>

      <div className="mosaic">
        {filtered.map((p, i) => (
          <a key={p.id} href={`/work/${p.id}`}
             className={`tile clickable ${spanFor(i, filtered.length)}`}
             data-cursor="view" data-cursor-label="Open case"
             onClick={(e) => { e.preventDefault(); go(`/work/${p.id}`); }}>
            <div className="tile-media">
              <Placeholder project={p} showLabel={false} />
            </div>
            <div className="tile-top">
              <div className="tile-index">/ {String(window.PROJECTS.indexOf(p) + 1).padStart(2, "0")}</div>
              <div className="tile-meta">
                {p.disciplines.map(d => d.toUpperCase()).join(" · ")}
              </div>
            </div>
            <div className="tile-foot">
              <div>
                <div className="tile-title">{p.title}</div>
                <div className="t-mono-sm" style={{ marginTop: 4 }}>
                  {p.sub} — {p.year}
                </div>
              </div>
              <div className="tile-arrow">→</div>
            </div>
          </a>
        ))}
      </div>

      <Footer go={go} />
    </div>
  );
}

Object.assign(window, { PageWork });
