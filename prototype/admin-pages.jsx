// admin-pages.jsx — Page-scoped editors for the admin panel.
//
// Two editors live here:
//   - IdentityEditor — site brand, contact, social links
//   - PagesEditor    — each site page's copy + structured content
//
// These replace the older split of Site / Copy / Lists tabs where related
// fields lived in different places. Now every page's editorial copy AND
// its lists/rows live in one section.

function IdentityEditor({ site, onChange }) {
  const set = (field) => (val) => onChange({ ...site, [field]: val });
  const setSocial = (i, sub) => (val) => {
    const next = (site.socials || []).slice();
    next[i] = { ...(next[i] || {}), [sub]: val };
    onChange({ ...site, socials: next });
  };
  const addSocial = () => {
    onChange({
      ...site,
      socials: [...(site.socials || []), { label: "Network", handle: "@handle", href: "#" }],
    });
  };
  const removeSocial = (i) => {
    const next = (site.socials || []).slice();
    next.splice(i, 1);
    onChange({ ...site, socials: next });
  };

  return (
    <div className="adm-form">
      <div style={{ marginBottom: 20 }}>
        <div className="t-eyebrow">Editing</div>
        <div className="adm-title-input" style={{ pointerEvents: "none", userSelect: "none" }}>
          Site identity
        </div>
        <p className="t-body-sm" style={{ color: "var(--muted)", marginTop: 4 }}>
          Brand-level fields that show up across every page — name, contact,
          social links.
        </p>
      </div>

      <fieldset className="adm-fs">
        <legend>Brand</legend>
        <div className="adm-form-grid">
          <Field label="Name">
            <TextInput value={site.name} placeholder="N. St-Amour"
                       onChange={set("name")} />
          </Field>
          <Field label="Short / initials" hint="rail nav mark, footer">
            <TextInput value={site.short} mono placeholder="NSA"
                       onChange={set("short")} />
          </Field>
          <Field label="Tagline" full hint="meta description">
            <TextInput value={site.tagline}
                       placeholder="Motion artist & AI workflow engineer"
                       onChange={set("tagline")} />
          </Field>
          <Field label="Email" hint="used in contact + footer + mailto links">
            <TextInput value={site.email} mono
                       placeholder="hello@example.com"
                       onChange={set("email")} />
          </Field>
          <Field label="Location" hint="footer bottom-right">
            <TextInput value={site.location}
                       placeholder="Montréal — remote"
                       onChange={set("location")} />
          </Field>
          <Field label="Manifesto" full hint="one-line statement — currently unused, reserved">
            <TextArea value={site.manifesto} rows={2}
                      onChange={set("manifesto")} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="adm-fs">
        <legend>Social links</legend>
        <p className="t-body-sm" style={{ color: "var(--muted)", marginBottom: 12 }}>
          Used in the footer "Elsewhere" column and the Contact page link
          list. Set the URL to{" "}
          <code style={{ background: "var(--surface)", padding: "1px 6px", borderRadius: 3 }}>#</code>
          {" "}to render as a non-linking placeholder.
        </p>
        <div className="adm-socials">
          {(site.socials || []).map((s, i) => (
            <div key={i} className="adm-social-row">
              <Field label="Label">
                <TextInput value={s.label} onChange={setSocial(i, "label")} />
              </Field>
              <Field label="Handle">
                <TextInput value={s.handle} mono onChange={setSocial(i, "handle")} />
              </Field>
              <Field label="URL">
                <TextInput value={s.href} mono placeholder="#"
                           onChange={setSocial(i, "href")} />
              </Field>
              <button type="button" className="adm-icon-btn danger"
                      onClick={() => removeSocial(i)} title="Remove">✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="adm-btn-mini" onClick={addSocial}>
          + Add social
        </button>
      </fieldset>
    </div>
  );
}

// ── Pages editor — one section per site page, with copy + lists merged ────
//
// Every site page (Home, Work, Studio, Contact, Footer) gets its own section
// here. Each section co-locates the page's editorial copy AND its structured
// lists/rows — so e.g. Studio shows headers + practice column + about
// paragraphs + experience rows + skills groups all in one scrollable region.
//
// A sub-nav at the top lets you jump between pages.

function PagesEditor() {
  const [, force] = React.useReducer((v) => v + 1, 0);
  const [section, setSection] = React.useState("home");
  const editorial = window.EDITORIAL;
  const site = window.SITE;

  // ── EDITORIAL setters (path-based) ──────────────────────────────────────
  const setPath = (path) => (val) => {
    const parts = path.split(".");
    const next = JSON.parse(JSON.stringify(editorial));
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
    window.EDITORIAL = next;
    force();
  };

  // ── SITE.marquee helpers (Home hero) ────────────────────────────────────
  const marquee = site.marquee || [];
  const setMarquee = (next) => {
    window.SITE = { ...site, marquee: next };
    force();
  };
  const setMarqueeAt = (i, val) => {
    const next = marquee.slice(); next[i] = val; setMarquee(next);
  };
  const addMarquee = () => setMarquee([...marquee, "New word"]);
  const removeMarquee = (i) => {
    const next = marquee.slice(); next.splice(i, 1); setMarquee(next);
  };
  const moveMarquee = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= marquee.length) return;
    const next = marquee.slice();
    const [m] = next.splice(i, 1); next.splice(j, 0, m); setMarquee(next);
  };

  // ── Studio: skill groups + experience rows ──────────────────────────────
  const setSkillGroup = (i, key, val) => {
    window.SKILLS = window.SKILLS.map((g, idx) =>
      idx === i ? { ...g, [key]: val } : g);
    force();
  };
  const addSkillGroup = () => {
    window.SKILLS = [...window.SKILLS, { h: "New group", items: [] }];
    force();
  };
  const removeSkillGroup = (i) => {
    window.SKILLS = window.SKILLS.filter((_, idx) => idx !== i);
    force();
  };
  const setExp = (i, key) => (val) => {
    window.EXPERIENCE = window.EXPERIENCE.map((r, idx) =>
      idx === i ? { ...r, [key]: val } : r);
    force();
  };
  const addExp = () => {
    window.EXPERIENCE = [...window.EXPERIENCE, { year: "", role: "", note: "", tag: "" }];
    force();
  };
  const removeExp = (i) => {
    window.EXPERIENCE = window.EXPERIENCE.filter((_, idx) => idx !== i);
    force();
  };
  const moveExp = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= window.EXPERIENCE.length) return;
    const next = window.EXPERIENCE.slice();
    const [r] = next.splice(i, 1); next.splice(j, 0, r);
    window.EXPERIENCE = next; force();
  };

  // Sections in the sub-nav
  const sections = [
    { id: "home",    label: "Home" },
    { id: "work",    label: "Work index" },
    { id: "case",    label: "Case study" },
    { id: "studio",  label: "Studio" },
    { id: "contact", label: "Contact" },
    { id: "footer",  label: "Footer" },
  ];

  return (
    <div className="adm-form">
      <div style={{ marginBottom: 14 }}>
        <div className="t-eyebrow">Editing</div>
        <div className="adm-title-input" style={{ pointerEvents: "none", userSelect: "none" }}>
          Pages
        </div>
        <p className="t-body-sm" style={{ color: "var(--muted)", marginTop: 4 }}>
          One section per site page. Each combines its copy with its
          structured content (lists, rows, etc) in one place.
        </p>
      </div>

      <nav className="adm-subnav">
        {sections.map((s) => (
          <button key={s.id}
                  className={`adm-subnav-btn ${section === s.id ? "on" : ""}`}
                  onClick={() => setSection(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>

      {/* ════════════════════════════════════════════════════ HOME */}
      {section === "home" && (
        <>
          <fieldset className="adm-fs">
            <legend>Loop hero</legend>
            <Field label="Featured eyebrow" hint="small label above the featured H2">
              <TextInput value={editorial.home?.loopFeaturedEyebrow}
                         placeholder="Featured project"
                         onChange={setPath("home.loopFeaturedEyebrow")} />
            </Field>
            <p className="t-body-sm" style={{ color: "var(--muted)", margin: "8px 0 0" }}>
              The big H2 follows the featured project. Edit it via the
              <strong> Pitch</strong> field on the Projects tab. Only one
              project can be featured at a time.
            </p>
          </fieldset>

          <fieldset className="adm-fs">
            <legend>Marquee words</legend>
            <p className="t-body-sm" style={{ color: "var(--muted)", marginBottom: 10 }}>
              The scrolling word strip at the top of the home page. Every
              other word renders as outlined.
            </p>
            <div className="adm-marquee-list">
              {marquee.map((word, i) => (
                <div key={i} className="adm-marquee-row">
                  <span className={`adm-marquee-preview ${i % 2 === 1 ? "outlined" : ""}`}>
                    {word || "—"}
                  </span>
                  <input className="adm-input"
                         value={word}
                         placeholder="Word or short phrase"
                         onChange={(e) => setMarqueeAt(i, e.target.value)} />
                  <button type="button" className="adm-icon-btn"
                          disabled={i === 0}
                          onClick={() => moveMarquee(i, -1)} title="Move up">↑</button>
                  <button type="button" className="adm-icon-btn"
                          disabled={i === marquee.length - 1}
                          onClick={() => moveMarquee(i, 1)} title="Move down">↓</button>
                  <button type="button" className="adm-icon-btn danger"
                          onClick={() => removeMarquee(i)} title="Remove">✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="adm-btn-mini" onClick={addMarquee}>
              + Add word
            </button>
          </fieldset>

          <fieldset className="adm-fs">
            <legend>Selected work strip</legend>
            <div className="adm-form-grid">
              <Field label="Eyebrow">
                <TextInput value={editorial.home?.featuredEyebrow}
                           onChange={setPath("home.featuredEyebrow")} />
              </Field>
              <Field label="Section title">
                <TextInput value={editorial.home?.featuredTitle}
                           onChange={setPath("home.featuredTitle")} />
              </Field>
              <Field label="All-work CTA">
                <TextInput value={editorial.home?.featuredCtaAll}
                           onChange={setPath("home.featuredCtaAll")} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="adm-fs">
            <legend>Notes strip</legend>
            <div className="adm-form-grid">
              <Field label="Eyebrow">
                <TextInput value={editorial.home?.notesEyebrow}
                           onChange={setPath("home.notesEyebrow")} />
              </Field>
              <Field label="Section title" full>
                <TextInput value={editorial.home?.notesTitle}
                           onChange={setPath("home.notesTitle")} />
              </Field>
            </div>
            <p className="t-body-sm" style={{ color: "var(--muted)", margin: "8px 0 0" }}>
              Note entries live on the <strong>Notes</strong> tab.
            </p>
          </fieldset>
        </>
      )}

      {/* ════════════════════════════════════════════════════ WORK */}
      {section === "work" && (
        <fieldset className="adm-fs">
          <legend>Work index page</legend>
          <Field label="Eyebrow prefix" hint='becomes "Work · 2021 — 2025"'>
            <TextInput value={editorial.work?.eyebrowPrefix}
                       onChange={setPath("work.eyebrowPrefix")} />
          </Field>
          <Field label="Headline template" full
                 hint="placeholders: {projects} {projectsS} {disciplines} {disciplinesS}">
            <TextInput value={editorial.work?.headlineTemplate}
                       onChange={setPath("work.headlineTemplate")} />
          </Field>
          <Field label="Lede paragraph" full>
            <TextArea value={editorial.work?.lede} rows={4}
                      onChange={setPath("work.lede")} />
          </Field>
          <p className="t-body-sm" style={{ color: "var(--muted)", margin: "12px 0 0" }}>
            Filter chips and project counts are derived from the{" "}
            <strong>Projects</strong> tab automatically.
          </p>
        </fieldset>
      )}

      {/* ════════════════════════════════════════════════════ CASE STUDY */}
      {section === "case" && (
        <fieldset className="adm-fs">
          <legend>Case study labels</legend>
          <p className="t-body-sm" style={{ color: "var(--muted)", marginBottom: 12 }}>
            Section labels on every case study page. The project content itself
            (brief, summary, writeup, gallery) is edited on the{" "}
            <strong>Projects</strong> tab.
          </p>
          <div className="adm-form-grid">
            <Field label="Brief label">
              <TextInput value={editorial.caseStudy?.briefLabel}
                         onChange={setPath("caseStudy.briefLabel")} />
            </Field>
            <Field label="Snapshot label">
              <TextInput value={editorial.caseStudy?.snapshotLabel}
                         onChange={setPath("caseStudy.snapshotLabel")} />
            </Field>
            <Field label="Process eyebrow">
              <TextInput value={editorial.caseStudy?.processEyebrow}
                         onChange={setPath("caseStudy.processEyebrow")} />
            </Field>
            <Field label="Process headline">
              <TextInput value={editorial.caseStudy?.processHeadline}
                         onChange={setPath("caseStudy.processHeadline")} />
            </Field>
            <Field label="Process blurb" full>
              <TextArea value={editorial.caseStudy?.processBlurb} rows={3}
                        onChange={setPath("caseStudy.processBlurb")} />
            </Field>
            <Field label="Writeup label">
              <TextInput value={editorial.caseStudy?.writeupLabel}
                         onChange={setPath("caseStudy.writeupLabel")} />
            </Field>
            <Field label="Back link">
              <TextInput value={editorial.caseStudy?.backLink}
                         onChange={setPath("caseStudy.backLink")} />
            </Field>
            <Field label="Previous label">
              <TextInput value={editorial.caseStudy?.prevLabel} mono
                         onChange={setPath("caseStudy.prevLabel")} />
            </Field>
            <Field label="Next label">
              <TextInput value={editorial.caseStudy?.nextLabel} mono
                         onChange={setPath("caseStudy.nextLabel")} />
            </Field>
          </div>
        </fieldset>
      )}

      {/* ════════════════════════════════════════════════════ STUDIO */}
      {section === "studio" && (
        <>
          <fieldset className="adm-fs">
            <legend>Header</legend>
            <div className="adm-form-grid">
              <Field label="Eyebrow">
                <TextInput value={editorial.about?.eyebrow}
                           onChange={setPath("about.eyebrow")} />
              </Field>
              <Field label="Headline">
                <TextInput value={editorial.about?.headline}
                           onChange={setPath("about.headline")} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="adm-fs">
            <legend>Practice column</legend>
            <Field label="Column label">
              <TextInput value={editorial.about?.practiceLabel}
                         onChange={setPath("about.practiceLabel")} />
            </Field>
            <Field label="Lines" full hint="one per line">
              <TextArea value={(editorial.about?.practiceLines || []).join("\n")}
                        rows={5}
                        onChange={(v) => setPath("about.practiceLines")(
                          v.split("\n").map((s) => s.trim()).filter(Boolean))} />
            </Field>
          </fieldset>

          <fieldset className="adm-fs">
            <legend>About column · long-form bio</legend>
            <Field label="Column label">
              <TextInput value={editorial.about?.aboutLabel}
                         onChange={setPath("about.aboutLabel")} />
            </Field>
            <Field label="Paragraphs" full
                   hint="blank line separates paragraphs · **bold** and *accent* work">
              <MarkdownEditor
                value={(editorial.about?.aboutParagraphs || []).join("\n\n")}
                rows={14}
                onChange={(v) => setPath("about.aboutParagraphs")(
                  v.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean))} />
            </Field>
          </fieldset>

          <fieldset className="adm-fs">
            <legend>Skills grid</legend>
            <p className="t-body-sm" style={{ color: "var(--muted)", marginBottom: 12 }}>
              Four columns by default. Each group has a heading and a list of
              items, one per line.
            </p>
            <div className="adm-skills-grid">
              {window.SKILLS.map((group, i) => (
                <div key={i} className="adm-skill-group">
                  <div className="adm-skill-head">
                    <input className="adm-input" value={group.h}
                           placeholder="Group title"
                           onChange={(e) => setSkillGroup(i, "h", e.target.value)} />
                    <button type="button" className="adm-icon-btn danger"
                            onClick={() => removeSkillGroup(i)} title="Remove group">✕</button>
                  </div>
                  <TextArea value={(group.items || []).join("\n")} rows={6}
                            placeholder="One skill per line"
                            onChange={(v) => setSkillGroup(i, "items",
                              v.split("\n").map((s) => s.trim()).filter(Boolean))} />
                </div>
              ))}
            </div>
            <button type="button" className="adm-btn-mini" style={{ marginTop: 10 }}
                    onClick={addSkillGroup}>+ Add skill group</button>
          </fieldset>

          <fieldset className="adm-fs">
            <legend>Experience section</legend>
            <div className="adm-form-grid">
              <Field label="Section eyebrow">
                <TextInput value={editorial.about?.experienceEyebrow}
                           onChange={setPath("about.experienceEyebrow")} />
              </Field>
              <Field label="Section headline">
                <TextInput value={editorial.about?.experienceHeadline}
                           onChange={setPath("about.experienceHeadline")} />
              </Field>
            </div>
            <div className="adm-list" style={{ marginTop: 12 }}>
              {window.EXPERIENCE.map((r, i) => (
                <div key={i} className="adm-list-row"
                     style={{ gridTemplateColumns: "120px 2fr 2fr 1fr auto auto auto" }}>
                  <TextInput value={r.year} mono placeholder="2024"
                             onChange={setExp(i, "year")} />
                  <TextInput value={r.role} placeholder="Role / project"
                             onChange={setExp(i, "role")} />
                  <TextInput value={r.note} placeholder="Short note"
                             onChange={setExp(i, "note")} />
                  <TextInput value={r.tag} mono placeholder="Tag"
                             onChange={setExp(i, "tag")} />
                  <button type="button" className="adm-icon-btn"
                          disabled={i === 0}
                          onClick={() => moveExp(i, -1)} title="Move up">↑</button>
                  <button type="button" className="adm-icon-btn"
                          disabled={i === window.EXPERIENCE.length - 1}
                          onClick={() => moveExp(i, 1)} title="Move down">↓</button>
                  <button type="button" className="adm-icon-btn danger"
                          onClick={() => removeExp(i)} title="Remove">✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="adm-btn-mini" style={{ marginTop: 10 }}
                    onClick={addExp}>+ Add experience row</button>
          </fieldset>
        </>
      )}

      {/* ════════════════════════════════════════════════════ CONTACT */}
      {section === "contact" && (
        <>
          <fieldset className="adm-fs">
            <legend>Header</legend>
            <Field label="Eyebrow" full>
              <TextInput value={editorial.contact?.eyebrow}
                         onChange={setPath("contact.eyebrow")} />
            </Field>
            <Field label="Headline" full>
              <TextInput value={editorial.contact?.headline}
                         onChange={setPath("contact.headline")} />
            </Field>
            <Field label="Subtitle" full>
              <TextArea value={editorial.contact?.subtitle} rows={4}
                        onChange={setPath("contact.subtitle")} />
            </Field>
            <p className="t-body-sm" style={{ color: "var(--muted)", margin: "8px 0 0" }}>
              The big mailto and social link list come from the{" "}
              <strong>Identity</strong> tab.
            </p>
          </fieldset>

          <fieldset className="adm-fs">
            <legend>Working with</legend>
            <Field label="Section label">
              <TextInput value={editorial.contact?.workingWithLabel}
                         onChange={setPath("contact.workingWithLabel")} />
            </Field>
            <Field label="List items" full hint="one per line">
              <TextArea value={(editorial.contact?.workingWith || []).join("\n")}
                        rows={6}
                        onChange={(v) => setPath("contact.workingWith")(
                          v.split("\n").map((s) => s.trim()).filter(Boolean))} />
            </Field>
          </fieldset>
        </>
      )}

      {/* ════════════════════════════════════════════════════ FOOTER */}
      {section === "footer" && (
        <fieldset className="adm-fs">
          <legend>Footer</legend>
          <Field label="CTA headline" full hint="big text top-left of footer">
            <TextInput value={editorial.footer?.ctaHeadline}
                       onChange={setPath("footer.ctaHeadline")} />
          </Field>
          <div className="adm-form-grid">
            <Field label="Site column heading">
              <TextInput value={editorial.footer?.siteHead}
                         onChange={setPath("footer.siteHead")} />
            </Field>
            <Field label="Elsewhere heading">
              <TextInput value={editorial.footer?.elsewhereHead}
                         onChange={setPath("footer.elsewhereHead")} />
            </Field>
            <Field label="Colophon heading">
              <TextInput value={editorial.footer?.colophonHead}
                         onChange={setPath("footer.colophonHead")} />
            </Field>
            <Field label="Rights template" hint="{name} replaced with site name">
              <TextInput value={editorial.footer?.rightsTemplate} mono
                         onChange={setPath("footer.rightsTemplate")} />
            </Field>
          </div>
          <Field label="Colophon items" full hint="one per line">
            <TextArea value={(editorial.footer?.colophon || []).join("\n")}
                      rows={5}
                      onChange={(v) => setPath("footer.colophon")(
                        v.split("\n").map((s) => s.trim()).filter(Boolean))} />
          </Field>
        </fieldset>
      )}
    </div>
  );
}

Object.assign(window, { IdentityEditor, PagesEditor });
