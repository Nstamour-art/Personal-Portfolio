// pages-about.jsx — Studio / About page

function PageAbout({ go }) {
  // Tiny markdown-ish renderer for **bold** and *accent* spans in paragraphs.
  const renderInline = (text) => {
    const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const paragraphs = window.copy("about.aboutParagraphs", []);
  const practiceLines = window.copy("about.practiceLines", []);

  return (
    <div className="page page-enter about-page">
      <header style={{ marginBottom: 96 }}>
        <div className="sec-label">{window.copy("about.eyebrow", "Studio of one")}</div>
        <h1 className="t-h1" style={{ marginTop: 16, maxWidth: "18ch" }}>
          {window.copy("about.headline", "A motion artist who fell in love with systems.")}
        </h1>
      </header>

      <div className="about-grid">
        <div>
          <div className="col-head">{window.copy("about.practiceLabel", "Practice")}</div>
          <div className="t-mono" style={{ color: "var(--fg)" }}>
            {practiceLines.map((line, i) => (
              <div key={i} style={{ marginBottom: 10 }}>{line}</div>
            ))}
          </div>
        </div>
        <div>
          <div className="col-head">{window.copy("about.aboutLabel", "About")}</div>
          <div className="prose">
            {paragraphs.map((p, i) => <p key={i}>{renderInline(p)}</p>)}
          </div>
        </div>
      </div>

      <div className="skills-grid">
        {window.SKILLS.map((s, i) => (
          <div key={i} className="col">
            <h4>{s.h}</h4>
            <ul>
              {s.items.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="sec-label">{window.copy("about.experienceEyebrow", "Experience")}</div>
        <h2 className="t-h2" style={{ marginTop: 8, marginBottom: 32 }}>
          {window.copy("about.experienceHeadline", "Selected projects, in order of recency.")}
        </h2>
      </div>

      <div className="exp-list">
        {window.EXPERIENCE.map((r, i) => (
          <div key={i} className="exp-row">
            <div className="year">{r.year}</div>
            <div className="role">{r.role}</div>
            <div className="note">{r.note}</div>
            <div className="tag">{r.tag}</div>
          </div>
        ))}
      </div>

      <Footer go={go} />
    </div>
  );
}

function PageContact({ go }) {
  return (
    <div className="page page-enter contact-page">
      <header style={{ marginBottom: 64 }}>
        <div className="sec-label">{window.copy("contact.eyebrow", "Get in touch")}</div>
        <h1 className="t-h1" style={{ marginTop: 16, maxWidth: "16ch" }}>
          {window.copy("contact.headline", "New work, collaboration, or just to say hello.")}
        </h1>
      </header>

      <div className="contact-grid">
        <div>
          <Magnetic strength={0.12} radius={300}>
            <a className="contact-big clickable"
               href={`mailto:${window.SITE.email}`}
               data-cursor="link" data-cursor-label="Write">
              {window.SITE.email}
            </a>
          </Magnetic>
          <p className="contact-sub">
            {window.copy("contact.subtitle",
              "For project enquiries, please include a one-paragraph brief, your rough timeline, and any reference material. I read everything — usually reply within five working days.")}
          </p>
          <div className="contact-links">
            <a href={`mailto:${window.SITE.email}`} data-cursor="link"
               className="contact-link clickable">
              <div className="k">Email</div>
              <div className="v">{window.SITE.email}</div>
              <div className="arr">↗</div>
            </a>
            {window.SITE.socials.map((s) => (
              <a key={s.label} href={s.href}
                 onClick={(e) => { if (s.href === "#") e.preventDefault(); }}
                 target={s.href !== "#" ? "_blank" : undefined}
                 rel="noopener noreferrer"
                 data-cursor="link" className="contact-link clickable">
                <div className="k">{s.label}</div>
                <div className="v">{s.handle}</div>
                <div className="arr">↗</div>
              </a>
            ))}
          </div>
        </div>
        <aside>
          <div className="col-head" style={{ fontFamily: "var(--mono)", fontSize: 11,
            letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)",
            marginBottom: 16 }}>
            {window.copy("contact.workingWithLabel", "Working with")}
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0,
                       display: "flex", flexDirection: "column", gap: 10 }}>
            {window.copy("contact.workingWith", []).map((it) => (
                <li key={it} style={{ display: "flex", gap: 10,
                  fontSize: 15, color: "var(--fg)" }}>
                  <span style={{ color: "var(--accent)" }}>+</span>{it}
                </li>
              ))}
          </ul>
        </aside>
      </div>

      <Footer go={go} />
    </div>
  );
}

Object.assign(window, { PageAbout, PageContact });
