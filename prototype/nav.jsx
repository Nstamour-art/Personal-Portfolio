// nav.jsx — three navigation variants + corner brand
//   variant prop: "top" | "rail" | "pill"

function Brand({ size = "md", path = "/", go }) {
  const fontSize = size === "lg" ? 18 : 15;
  return (
    <a href={path} data-cursor="link"
       onClick={(e) => { e.preventDefault(); go("/"); }}
       style={{ display: "inline-flex", alignItems: "baseline", gap: 10,
                fontWeight: 500, fontSize, letterSpacing: "-0.01em" }}>
      <span style={{ width: 8, height: 8, background: "var(--accent)",
                     borderRadius: "50%", display: "inline-block",
                     alignSelf: "center", marginRight: 2 }} />
      <span>{window.SITE.name}</span>
      <span style={{ color: "var(--muted)", fontFamily: "var(--mono)",
                     fontSize: 11, letterSpacing: "0.06em",
                     textTransform: "uppercase", marginLeft: 2 }}>
        — Folio &apos;26
      </span>
    </a>
  );
}

function NavLinks({ current, go, variant }) {
  return window.NAV.map((n) => (
    <Magnetic key={n.id} strength={variant === "pill" ? 0.18 : 0.25} radius={60}>
      <a className="nav-link"
         data-active={current === n.id ? "1" : "0"}
         data-cursor="link"
         href={n.path}
         onClick={(e) => { e.preventDefault(); go(n.path); }}>
        {n.label}
      </a>
    </Magnetic>
  ));
}

function NavTop({ current, go }) {
  return (
    <nav className="nav-top">
      <Brand go={go} />
      <div className="links">
        <NavLinks current={current} go={go} variant="top" />
      </div>
    </nav>
  );
}

function NavRail({ current, go }) {
  // Add a body class so pages can pad-left for the rail
  React.useEffect(() => {
    document.body.classList.add("nav-rail-mode");
    return () => document.body.classList.remove("nav-rail-mode");
  }, []);
  return (
    <nav className="nav-rail">
      <a href="/" data-cursor="link"
         onClick={(e) => { e.preventDefault(); go("/"); }}
         className="brand-mark">{window.SITE.initials}</a>
      <div className="links">
        {window.NAV.map((n) => (
          <a key={n.id} className="nav-link" data-active={current === n.id ? "1" : "0"}
             data-cursor="link" href={n.path}
             onClick={(e) => { e.preventDefault(); go(n.path); }}>
            {n.label}
          </a>
        ))}
      </div>
      <div className="meta">{window.SITE.short} / FOLIO 26</div>
    </nav>
  );
}

function NavPill({ current, go }) {
  return (
    <>
      <a href="/" data-cursor="link"
         onClick={(e) => { e.preventDefault(); go("/"); }}
         className="corner-brand">
        <span className="dot" />
        <span>{window.SITE.name}</span>
      </a>
      <nav className="nav-pill">
        <div className="brand-mark">{window.SITE.initials}</div>
        <NavLinks current={current} go={go} variant="pill" />
      </nav>
    </>
  );
}

function Nav({ variant, current, go }) {
  if (variant === "rail") return <NavRail current={current} go={go} />;
  if (variant === "pill") return <NavPill current={current} go={go} />;
  return <NavTop current={current} go={go} />;
}

Object.assign(window, { Nav, Brand, NavLinks });
