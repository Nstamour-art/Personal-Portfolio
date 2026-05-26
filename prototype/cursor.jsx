// cursor.jsx — custom cursor + magnetic link wrapper
// Renders two fixed elements that follow the pointer with a small lerp.
// Reads data attributes on hovered elements to switch state/label.

function CustomCursor() {
  const dotRef = React.useRef(null);
  const ringRef = React.useRef(null);
  const labelRef = React.useRef(null);
  const stateRef = React.useRef("default");

  React.useEffect(() => {
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx, ry = my;     // ring lerp
    let dx = mx, dy = my;     // dot lerp (faster)
    let raf = null;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      // detect element under cursor and pick state
      const el = e.target.closest?.("[data-cursor]");
      const next = el?.dataset.cursor || "default";
      const label = el?.dataset.cursorLabel || "";
      if (stateRef.current !== next) {
        stateRef.current = next;
        if (ringRef.current) ringRef.current.dataset.state = next;
      }
      if (labelRef.current) {
        labelRef.current.textContent = label;
        labelRef.current.dataset.show = label ? "1" : "0";
      }
    };

    const onLeave = () => {
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };
    const onEnter = () => {
      if (dotRef.current) dotRef.current.style.opacity = "1";
      if (ringRef.current) ringRef.current.style.opacity = "1";
    };

    const loop = () => {
      // ring lerps slower for that pleasant trailing feel
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dx += (mx - dx) * 0.55;
      dy += (my - dy) * 0.55;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }
      if (labelRef.current) {
        labelRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" data-state="default" />
      <div ref={dotRef} className="cursor-dot" />
      <div ref={labelRef} className="cursor-label" data-show="0" />
    </>
  );
}

// Magnetic — wraps any element. On hover, the child translates toward
// the cursor by `strength` (0–1, default 0.35) within `radius` px.
function Magnetic({ children, strength = 0.35, radius = 90 }) {
  const wrapRef = React.useRef(null);
  const innerRef = React.useRef(null);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    let rect = null;
    let raf = null;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const measure = () => { rect = wrap.getBoundingClientRect(); };

    const onEnter = () => { measure(); };
    const onMove = (e) => {
      if (!rect) measure();
      const ccx = rect.left + rect.width / 2;
      const ccy = rect.top + rect.height / 2;
      const dx = e.clientX - ccx;
      const dy = e.clientY - ccy;
      const dist = Math.hypot(dx, dy);
      const falloff = Math.max(0, 1 - dist / (radius * 2.4));
      tx = dx * strength * falloff;
      ty = dy * strength * falloff;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      inner.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    };

    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength, radius]);

  return (
    <span ref={wrapRef} className="magnetic">
      <span ref={innerRef} style={{ display: "inline-block", willChange: "transform" }}>
        {children}
      </span>
    </span>
  );
}

Object.assign(window, { CustomCursor, Magnetic });
