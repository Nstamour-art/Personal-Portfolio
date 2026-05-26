// pages-case.jsx — Cinematic case study
//   Layout: hero result → brief (side-by-side) → process gallery + writeup → next

function PageCaseStudy({ projectId, go }) {
  const project = window.PROJECTS.find((p) => p.id === projectId);
  if (!project) {
    return (
      <div className="page page-enter" style={{ padding: "200px var(--pad)" }}>
        <div className="sec-label">404 — Not found</div>
        <h1 className="t-h1">No such project.</h1>
        <a href="/work" data-cursor="link" className="btn ghost"
           onClick={(e) => { e.preventDefault(); go("/work"); }}
           style={{ marginTop: 32 }}>
          Back to work <span className="arr">→</span>
        </a>
      </div>
    );
  }

  // Pick the "next" project — wrap around to start
  const idx = window.PROJECTS.findIndex((p) => p.id === projectId);
  const next = window.PROJECTS[(idx + 1) % window.PROJECTS.length];
  const prev = window.PROJECTS[(idx - 1 + window.PROJECTS.length) % window.PROJECTS.length];

  return (
    <div className="page page-enter cs-page">
      {/* Cinematic hero */}
      <section className="cs-hero">
        <div className="cs-hero-surface">
          <VideoHero
            project={project}
            showLabel={!project.hero?.src && !project.heroVideo}
            labelText={project.hero?.alt || `${project.title} — hero image`}
          />
        </div>
        <div className="cs-hero-overlay">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 40 }}>
            <a href="/work" data-cursor="link" className="cs-back"
               onClick={(e) => { e.preventDefault(); go("/work"); }}>
              <span>←</span>
              {window.copy("caseStudy.backLink", "Back to index")}
            </a>
            <div className="t-mono-sm">
              {String(idx + 1).padStart(2, "0")} / {String(window.PROJECTS.length).padStart(2, "0")}
            </div>
          </div>
          <div>
            <div className="sec-label" style={{ color: "var(--fg-2)" }}>
              {project.disciplines.map(d => d.toUpperCase()).join(" · ")} · {project.year}
            </div>
            <h1 className="cs-hero-title">{project.title}</h1>
            <div className="cs-hero-meta">
              <div className="cell">
                <div className="k">Client</div>
                <div className="v">{project.client}</div>
              </div>
              <div className="cell">
                <div className="k">Year</div>
                <div className="v">{project.year}</div>
              </div>
              <div className="cell">
                <div className="k">Role</div>
                <div className="v">{project.role}</div>
              </div>
              <div className="cell">
                <div className="k">Discipline</div>
                <div className="v">{project.sub}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brief — sits next to the cinematic hero result */}
      <section className="cs-brief">
        <div>
          <div className="label">{window.copy("caseStudy.briefLabel", "The brief")}</div>
          <p className="brief-text">{project.brief}</p>
        </div>
        <div>
          <div className="label">{window.copy("caseStudy.snapshotLabel", "Snapshot")}</div>
          <p className="t-body" style={{ marginBottom: 32 }}>{project.summary}</p>
          <div className="brief-meta">
            <div className="cell">
              <div className="k">Output</div>
              <div className="v">{project.output || "Films, frames, broadcast variants"}</div>
            </div>
            <div className="cell">
              <div className="k">Tools</div>
              <div className="v">{project.tools || "—"}</div>
            </div>
            <div className="cell">
              <div className="k">Duration</div>
              <div className="v">{project.duration || "—"}</div>
            </div>
            <div className="cell">
              <div className="k">Status</div>
              <div className="v">{project.status || "Shipped"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Process gallery + writeup below */}
      <section className="cs-process">
        <div className="process-head">
          <div>
            <div className="sec-label">{window.copy("caseStudy.processEyebrow", "Process")}</div>
            <h2 className="t-h2" style={{ marginTop: 8, maxWidth: "16ch" }}>
              {window.copy("caseStudy.processHeadline", "How it got made.")}
            </h2>
          </div>
          <p className="t-body" style={{ alignSelf: "end" }}>
            {window.copy("caseStudy.processBlurb",
              "Selected stills from the working files — block-outs, style frames and tests that informed the final piece.")}
          </p>
        </div>
        <div className="gallery">
          {project.process.map((step, i) => (
            <div key={i} className="gimg">
              <Placeholder
                project={project}
                media={step.src ? { src: step.src, alt: step.label } : { src: "", alt: step.label }}
                phOverride={i === 0 ? undefined : (i === 1 ? "ph-illo" : "ph-code")}
                showLabel={!step.src}
                labelText={step.label}
              />
              <div className="gimg-caption">
                <span>fig. {String(i + 1).padStart(2, "0")} — {step.label}</span>
                <span style={{ color: "var(--muted)" }}>{step.note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Writeup explicitly beneath the gallery, in the same section */}
        <div className="cs-writeup" style={{ borderBottom: "none", padding: 0, marginTop: 16 }}>
          <div className="label">{window.copy("caseStudy.writeupLabel", "Notes on the build")}</div>
          <div className="prose">
            {project.writeup.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Next case */}
      <section className="cs-next">
        <a href={`/work/${prev.id}`} className="panel clickable"
           data-cursor="view" data-cursor-label="Previous"
           onClick={(e) => { e.preventDefault(); go(`/work/${prev.id}`); }}>
          <Placeholder project={prev} showLabel={false} />
          <div className="panel-overlay">
            <div className="t-mono-sm">
              {window.copy("caseStudy.prevLabel", "← Previous case")}
            </div>
            <div>
              <div className="t-h3" style={{ marginBottom: 4 }}>{prev.title}</div>
              <div className="t-mono-sm">{prev.sub}</div>
            </div>
          </div>
        </a>
        <a href={`/work/${next.id}`} className="panel clickable"
           data-cursor="view" data-cursor-label="Next case"
           onClick={(e) => { e.preventDefault(); go(`/work/${next.id}`); }}>
          <Placeholder project={next} showLabel={false} />
          <div className="panel-overlay">
            <div className="t-mono-sm" style={{ textAlign: "right" }}>
              {window.copy("caseStudy.nextLabel", "Next case →")}
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="t-h3" style={{ marginBottom: 4 }}>{next.title}</div>
              <div className="t-mono-sm">{next.sub}</div>
            </div>
          </div>
        </a>
      </section>

      <Footer go={go} />
    </div>
  );
}

Object.assign(window, { PageCaseStudy });
