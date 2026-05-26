// placeholder.jsx — renders a project visual.
//   If `media` (with a non-empty .src) is provided, renders an <img>.
//   Otherwise falls back to a procedural CSS placeholder keyed off the
//   project's discipline. Used everywhere a project visual appears so
//   swapping in a real image is a one-field change in data.js.
//
//   Props:
//     project      REQUIRED  full project object
//     media        OPTIONAL  { src, alt } — defaults to project.hero
//     showLabel    OPTIONAL  bool — show the dashed mono "what goes here" hint
//     labelText    OPTIONAL  override the label text
//     phOverride   OPTIONAL  override the placeholder class (ph-motion, etc.)

function Placeholder({ project, media, showLabel = false, labelText, phOverride }) {
  const m = media === undefined ? project.hero : media;
  const hasImage = m && m.src && String(m.src).trim() !== "";

  if (hasImage) {
    return (
      <img className="placeholder media-img"
           src={m.src}
           alt={m.alt || project.title}
           loading="lazy"
           draggable={false} />
    );
  }

  // Procedural placeholder
  const phClass = phOverride
    || project.ph
    || window.PH_BY_DISCIPLINE[project.primary]
    || "ph-motion";
  const shapes = window.SHAPES[project.id] || [];
  const label = labelText || (m && m.alt) || project.placeholderLabel
    || `${project.title} — drop hero image here`;

  return (
    <div className={`placeholder ph ${phClass}`}>
      <div className="ph-grid" />
      {shapes.map((s, i) => (
        <div key={i} className="ph-shape"
             style={{
               width: s.w,
               height: s.h,
               left: s.x,
               top: s.y,
               background: s.bg,
               opacity: s.opacity,
               borderRadius: s.type === "circle" ? "50%" : 0,
               transform: `translate(-50%, -50%) rotate(${s.rotate || 0}deg)`,
               filter: s.blur ? `blur(${s.blur}px)` : "none",
             }} />
      ))}
      {showLabel && <div className="ph-label">{label}</div>}
    </div>
  );
}

Object.assign(window, { Placeholder });
