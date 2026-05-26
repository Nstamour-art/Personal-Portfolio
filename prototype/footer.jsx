// footer.jsx — site footer
// Reads CTA / colophon / column headers from EDITORIAL.footer so admin can
// edit. Site links + socials remain driven by NAV and SITE.socials.

function Footer({ go }) {
  const rights = window.copy("footer.rightsTemplate", "© {name} — Folio '26")
    .replaceAll("{name}", window.SITE.name);
  return (
    <footer className="foot">
      <div>
        <div className="big" style={{ marginBottom: 16 }}>
          {window.copy("footer.ctaHeadline", "Have a brief that lives in two disciplines?")}
        </div>
        <Magnetic>
          <a href={`mailto:${window.SITE.email}`} className="btn"
             data-cursor="link" data-cursor-label="Write">
            {window.SITE.email}
            <span className="arr">→</span>
          </a>
        </Magnetic>
      </div>
      <div className="col">
        <h5>{window.copy("footer.siteHead", "Site")}</h5>
        <ul>
          {window.NAV.map((n) => (
            <li key={n.id}>
              <a href={n.path} data-cursor="link"
                 onClick={(e) => { e.preventDefault(); go(n.path); }}>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="col">
        <h5>{window.copy("footer.elsewhereHead", "Elsewhere")}</h5>
        <ul>
          {window.SITE.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} data-cursor="link"
                 onClick={(e) => { if (s.href === "#") e.preventDefault(); }}>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="col">
        <h5>{window.copy("footer.colophonHead", "Colophon")}</h5>
        <ul>
          {window.copy("footer.colophon", []).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="bottom">
        <div>{rights}</div>
        <div>{window.SITE.location} — {new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", timeZone: "America/Montreal" })} EST</div>
      </div>
    </footer>
  );
}

Object.assign(window, { Footer });
