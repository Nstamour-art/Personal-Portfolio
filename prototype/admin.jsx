// admin.jsx — in-prototype content editor
//
// A working /admin panel that edits window.PROJECTS and window.SITE in
// place, persists to localStorage via saveContent(), and lets you export
// the result as JSON (round-trip) or a fresh data.js (production deploy).
//
// This is a prototyping affordance — production replaces this with a real
// CMS (Keystatic / Decap / Sanity — see SPEC.md §16). The data shape is
// identical, so admin edits exported here drop straight into production.

// ── Helpers ────────────────────────────────────────────────────────────────

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadText(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slugify(s) {
  return String(s).toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ── Small form-control primitives, themed to the admin shell ──────────────

function Field({ label, hint, children, full = false }) {
  return (
    <label className={`adm-field ${full ? "adm-field-full" : ""}`}>
      <div className="adm-field-lbl">
        <span>{label}</span>
        {hint && <span className="adm-field-hint">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, mono = false }) {
  return (
    <input className={`adm-input ${mono ? "mono" : ""}`}
           type="text" value={value || ""} placeholder={placeholder}
           onChange={(e) => onChange(e.target.value)} />
  );
}

function TextArea({ value, onChange, rows = 4, placeholder }) {
  return (
    <textarea className="adm-input adm-textarea" rows={rows}
              value={value || ""} placeholder={placeholder}
              onChange={(e) => onChange(e.target.value)} />
  );
}

function CheckboxGroup({ value, onChange, options }) {
  const v = Array.isArray(value) ? value : [];
  return (
    <div className="adm-chk-group">
      {options.map((o) => {
        const on = v.includes(o.id);
        return (
          <button key={o.id} type="button"
                  className="adm-chk" data-on={on ? "1" : "0"}
                  onClick={() => {
                    if (on) onChange(v.filter((x) => x !== o.id));
                    else onChange([...v, o.id]);
                  }}>
            <span className="adm-chk-box">{on ? "✓" : ""}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Image drop zone — accepts drag-drop OR click to pick a file.
// Stores the result as a data: URL on the project (works without a server).
function ImageDrop({ value, onChange, label = "Drop image" }) {
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef(null);
  const src = (value && value.src) || "";

  const handle = async (file) => {
    if (!file) return;
    const dataURL = await fileToDataURL(file);
    onChange({ src: dataURL, alt: value?.alt || file.name });
  };

  return (
    <div className={`adm-drop ${drag ? "dragging" : ""} ${src ? "has-image" : ""}`}
         onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
         onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
         onDragLeave={() => setDrag(false)}
         onDrop={(e) => {
           e.preventDefault();
           setDrag(false);
           const f = e.dataTransfer.files?.[0];
           if (f && f.type.startsWith("image/")) handle(f);
         }}
         onClick={() => inputRef.current?.click()}>
      {src ? (
        <>
          <img src={src} alt={value?.alt || ""} />
          <button type="button" className="adm-drop-x"
                  onClick={(e) => { e.stopPropagation(); onChange({ src: "", alt: "" }); }}>
            ✕ Clear
          </button>
        </>
      ) : (
        <div className="adm-drop-empty">
          <div className="adm-drop-icon">⬆</div>
          <div>{label}</div>
          <div className="adm-drop-hint">Drop or click — JPG, PNG, WebP</div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
             onChange={(e) => handle(e.target.files?.[0])} />
    </div>
  );
}

// ── Sidebar — project list with add / move / delete ────────────────────────

function ProjectSidebar({ selectedId, onSelect, onAdd, onMove, onDelete, version }) {
  return (
    <aside className="adm-side">
      <div className="adm-side-hd">
        <span className="t-mono-sm">
          Projects · {window.PROJECTS.length}
          {window.PROJECTS.some((p) => p.featured) && (
            <> · <span style={{ color: "var(--accent)" }}>★ featured</span></>
          )}
        </span>
        <button className="adm-btn-mini" onClick={onAdd}>+ Add</button>
      </div>
      <ul className="adm-side-list">
        {window.PROJECTS.map((p, i) => (
          <li key={p.id + "_" + version}
              className={`adm-side-item ${selectedId === p.id ? "selected" : ""}`}>
            <button className="adm-side-pick" onClick={() => onSelect(p.id)}>
              <span className="adm-side-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="adm-side-meta">
                <span className="adm-side-title">
                  {p.featured && <span className="adm-side-star" title="Featured">★</span>}
                  {p.title || "Untitled"}
                </span>
                <span className="adm-side-sub">{p.disciplines.join(" · ")}</span>
              </span>
            </button>
            <div className="adm-side-actions">
              <button className="adm-icon-btn"
                      disabled={i === 0}
                      onClick={() => onMove(p.id, -1)} title="Move up">↑</button>
              <button className="adm-icon-btn"
                      disabled={i === window.PROJECTS.length - 1}
                      onClick={() => onMove(p.id, 1)} title="Move down">↓</button>
              <button className="adm-icon-btn danger"
                      onClick={() => onDelete(p.id)} title="Delete">✕</button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// ── Project editor ─────────────────────────────────────────────────────────

function ProjectEditor({ project, onChange, onChangeId }) {
  if (!project) {
    return (
      <div className="adm-empty">
        <div className="t-h3">No project selected.</div>
        <p className="t-body-sm" style={{ color: "var(--muted)" }}>
          Pick one from the list, or click <strong>+ Add</strong>.
        </p>
      </div>
    );
  }

  const set = (field) => (val) => onChange({ ...project, [field]: val });
  // Featured is single-select — toggling ON clears it on every other project.
  // Toggling OFF just clears it on this one.
  const setFeatured = (val) => {
    if (val) {
      window.PROJECTS = window.PROJECTS.map((p) =>
        p.id === project.id ? { ...p, featured: true } : { ...p, featured: false }
      );
    } else {
      window.PROJECTS = window.PROJECTS.map((p) =>
        p.id === project.id ? { ...p, featured: false } : p
      );
    }
    // Bubble up — onChange forces a re-render with our mutated PROJECTS
    onChange(window.PROJECTS.find((p) => p.id === project.id));
  };
  const setNested = (field, sub) => (val) => onChange({
    ...project,
    [field]: { ...(project[field] || {}), [sub]: val },
  });
  const setProcess = (i, sub) => (val) => {
    const next = (project.process || []).slice();
    next[i] = { ...(next[i] || {}), [sub]: val };
    onChange({ ...project, process: next });
  };
  const addProcessStep = () => {
    onChange({
      ...project,
      process: [
        ...(project.process || []),
        { src: "", label: "New step", note: "" },
      ],
    });
  };
  const removeProcessStep = (i) => {
    const next = (project.process || []).slice();
    next.splice(i, 1);
    onChange({ ...project, process: next });
  };

  return (
    <div className="adm-form">
      <div className="adm-form-row" style={{ alignItems: "end", marginBottom: 20, gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="t-eyebrow">Editing</div>
          <input className="adm-title-input"
                 value={project.title || ""}
                 placeholder="Project title"
                 onChange={(e) => onChange({ ...project, title: e.target.value })} />
        </div>
        <button type="button"
                className={`adm-feat-btn ${project.featured ? "on" : ""}`}
                onClick={() => setFeatured(!project.featured)}
                title={project.featured ? "Unfeature project" : "Feature on home page (replaces current featured)"}>
          <span className="adm-feat-star">{project.featured ? "★" : "☆"}</span>
          {project.featured ? "Featured" : "Feature"}
        </button>
      </div>

      {/* ── Identity ─────────────────────────────────────────── */}
      <fieldset className="adm-fs">
        <legend>Identity</legend>
        <div className="adm-form-grid">
          <Field label="Slug (URL id)" hint="lowercase, no spaces">
            <TextInput value={project.id} mono
                       placeholder="my-project"
                       onChange={(v) => onChangeId(project.id, slugify(v) || project.id)} />
          </Field>
          <Field label="Subtitle" hint="one-line discipline label">
            <TextInput value={project.sub}
                       placeholder="Logo treatment & animation"
                       onChange={set("sub")} />
          </Field>
          <Field label="Year">
            <TextInput value={project.year} mono
                       placeholder="2024 or 2022—2023"
                       onChange={set("year")} />
          </Field>
          <Field label="Client">
            <TextInput value={project.client}
                       placeholder="Studio or 'Self-initiated'"
                       onChange={set("client")} />
          </Field>
          <Field label="Role" full>
            <TextInput value={project.role}
                       placeholder="Motion direction, 2D animation"
                       onChange={set("role")} />
          </Field>
          <Field label="Disciplines" full hint="tag at least one">
            <CheckboxGroup
              value={project.disciplines}
              options={window.DISCIPLINES.filter((d) => d.id !== "all")}
              onChange={(arr) => {
                const next = { ...project, disciplines: arr };
                // keep primary in sync
                if (!arr.includes(project.primary)) next.primary = arr[0] || "motion";
                onChange(next);
              }}
            />
          </Field>
          <Field label="Primary discipline" hint="drives placeholder palette">
            <select className="adm-input" value={project.primary}
                    onChange={(e) => set("primary")(e.target.value)}>
              {window.DISCIPLINES.filter((d) => d.id !== "all").map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      {/* ── Copy ─────────────────────────────────────────────── */}
      <fieldset className="adm-fs">
        <legend>Copy</legend>
        <Field label="Pitch" hint="punchy one-liner shown on the home Loop hero — falls back to brief if blank" full>
          <TextInput value={project.pitch}
                     placeholder="A logo treatment built to survive every screen it lands on."
                     onChange={set("pitch")} />
        </Field>
        <Field label="Brief" hint="1–2 sentences shown next to the case study hero" full>
          <MarkdownEditor value={project.brief}
                          onChange={set("brief")}
                          rows={4}
                          compact={true}
                          placeholder="A logo treatment that resolves under one second…" />
        </Field>
        <Field label="Summary" hint="one short snapshot paragraph" full>
          <MarkdownEditor value={project.summary}
                          onChange={set("summary")}
                          rows={5}
                          compact={true}
                          placeholder="Identity animation that lives across broadcast, social, product…" />
        </Field>
        <Field label="Writeup" hint="long-form — paragraph break = blank line · **bold** *italic* [link](url) supported" full>
          <MarkdownEditor
            value={(project.writeup || []).join("\n\n")}
            rows={16}
            placeholder={"## A section heading\n\nFirst paragraph.\n\nSecond paragraph with **bold** and a [link](https://example.com)."}
            onChange={(v) => set("writeup")(
              v.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
            )} />
        </Field>
      </fieldset>

      {/* ── Media ────────────────────────────────────────────── */}
      <fieldset className="adm-fs">
        <legend>Media</legend>
        <Field label="Hero image" full hint="shown on the case study + featured peek · acts as the video poster if a URL is set below">
          <ImageDrop value={project.hero}
                     onChange={set("hero")}
                     label="Drop hero image" />
        </Field>
        <Field label="Hero alt text" full hint="describe for accessibility">
          <TextInput value={project.hero?.alt}
                     placeholder="Final hero render"
                     onChange={setNested("hero", "alt")} />
        </Field>
        <Field label="Hero video" full hint="optional — YouTube / Vimeo / direct .mp4. Image above becomes the play-to-start poster.">
          <TextInput value={project.heroVideo} mono
                     placeholder="https://vimeo.com/123456789"
                     onChange={set("heroVideo")} />
        </Field>
        {project.heroVideo && (() => {
          const v = window.parseVideoUrl(project.heroVideo);
          return (
            <div className="adm-video-status">
              {v ? (
                <>
                  <span className="adm-video-ok">✓ Detected</span>
                  <span className="t-mono-sm">{v.kind.toUpperCase()}</span>
                  {v.kind !== "file" && <span className="t-mono-sm" style={{ color: "var(--muted)" }}>id: {v.id}</span>}
                </>
              ) : (
                <span className="adm-video-bad">⚠ Unrecognised URL — won&apos;t embed</span>
              )}
            </div>
          );
        })()}
      </fieldset>

      {/* ── Process gallery ─────────────────────────────────── */}
      <fieldset className="adm-fs">
        <legend>Process gallery</legend>
        <div className="adm-process-list">
          {(project.process || []).map((step, i) => (
            <div key={i} className="adm-process-item">
              <div className="adm-process-num">fig. {String(i + 1).padStart(2, "0")}</div>
              <ImageDrop value={{ src: step.src || "", alt: step.label || "" }}
                         onChange={(m) => setProcess(i, "src")(m.src)}
                         label={`Drop image ${i + 1}`} />
              <Field label="Label">
                <TextInput value={step.label}
                           placeholder="Block-out pass"
                           onChange={setProcess(i, "label")} />
              </Field>
              <Field label="Note">
                <TextInput value={step.note} mono
                           placeholder="Greybox lighting test"
                           onChange={setProcess(i, "note")} />
              </Field>
              <button type="button" className="adm-icon-btn danger adm-process-rm"
                      onClick={() => removeProcessStep(i)} title="Remove step">✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="adm-btn-mini" onClick={addProcessStep}>
          + Add process step
        </button>
      </fieldset>

      {/* ── Metadata ────────────────────────────────────────── */}
      <fieldset className="adm-fs">
        <legend>Metadata · shown in brief panel</legend>
        <div className="adm-form-grid">
          <Field label="Tools">
            <TextInput value={project.tools} mono
                       placeholder="AE · C4D · Octane"
                       onChange={set("tools")} />
          </Field>
          <Field label="Duration">
            <TextInput value={project.duration}
                       placeholder="6 weeks active"
                       onChange={set("duration")} />
          </Field>
          <Field label="Status">
            <TextInput value={project.status}
                       placeholder="Shipped / Ongoing / Prototype"
                       onChange={set("status")} />
          </Field>
          <Field label="Output">
            <TextInput value={project.output}
                       placeholder="Broadcast, social, product"
                       onChange={set("output")} />
          </Field>
        </div>
      </fieldset>
    </div>
  );
}

// ── Notes sidebar + editor (full article tool) ─────────────────────────────

function NoteSidebar({ selectedId, onSelect, onAdd, onMove, onDelete, version }) {
  return (
    <aside className="adm-side">
      <div className="adm-side-hd">
        <span className="t-mono-sm">
          Notes · {window.NOTES.length}
          {window.NOTES.some((n) => n.pinned) && (
            <> · <span style={{ color: "var(--accent)" }}>
              ★ {window.NOTES.filter((n) => n.pinned).length} pinned
            </span></>
          )}
        </span>
        <button className="adm-btn-mini" onClick={onAdd}>+ Add</button>
      </div>
      <ul className="adm-side-list">
        {window.NOTES.map((n, i) => (
          <li key={n.id + "_" + version}
              className={`adm-side-item ${selectedId === n.id ? "selected" : ""}`}>
            <button className="adm-side-pick" onClick={() => onSelect(n.id)}>
              <span className="adm-side-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="adm-side-meta">
                <span className="adm-side-title">
                  {n.pinned && <span className="adm-side-star" title="Pinned">★</span>}
                  {n.title || "Untitled"}
                </span>
                <span className="adm-side-sub">{n.kind || "—"} · {n.date || "no date"}</span>
              </span>
            </button>
            <div className="adm-side-actions">
              <button className="adm-icon-btn"
                      disabled={i === 0}
                      onClick={() => onMove(n.id, -1)} title="Move up">↑</button>
              <button className="adm-icon-btn"
                      disabled={i === window.NOTES.length - 1}
                      onClick={() => onMove(n.id, 1)} title="Move down">↓</button>
              <button className="adm-icon-btn danger"
                      onClick={() => onDelete(n.id)} title="Delete">✕</button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function NoteEditor({ note, onChange, onChangeId }) {
  if (!note) {
    return (
      <div className="adm-empty">
        <div className="t-h3">No note selected.</div>
        <p className="t-body-sm" style={{ color: "var(--muted)" }}>
          Pick one from the list, or click <strong>+ Add</strong>.
        </p>
      </div>
    );
  }

  const set = (field) => (val) => onChange({ ...note, [field]: val });
  const setCover = (sub) => (val) =>
    onChange({ ...note, cover: { ...(note.cover || {}), [sub]: val } });

  // Approximate reading time (200 wpm)
  const wordCount = String(note.body || "").trim().split(/\s+/).filter(Boolean).length;
  const readMin = wordCount ? Math.max(1, Math.round(wordCount / 200)) : 0;

  return (
    <div className="adm-form">
      <div className="adm-form-row" style={{ alignItems: "end", marginBottom: 20, gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="t-eyebrow">Editing note</div>
          <input className="adm-title-input"
                 value={note.title || ""}
                 placeholder="Note title"
                 onChange={(e) => onChange({ ...note, title: e.target.value })} />
        </div>
        <button type="button"
                className={`adm-feat-btn ${note.pinned ? "on" : ""}`}
                onClick={() => set("pinned")(!note.pinned)}
                title={note.pinned ? "Unpin note" : "Pin to top of /notes index"}>
          <span className="adm-feat-star">{note.pinned ? "★" : "☆"}</span>
          {note.pinned ? "Pinned" : "Pin"}
        </button>
      </div>

      <fieldset className="adm-fs">
        <legend>Metadata</legend>
        <div className="adm-form-grid">
          <Field label="Slug (URL id)" hint="lowercase, no spaces">
            <TextInput value={note.id} mono
                       placeholder="my-note-title"
                       onChange={(v) => onChangeId(note.id, slugify(v) || note.id)} />
          </Field>
          <Field label="Date">
            <TextInput value={note.date} mono
                       placeholder="May 2026"
                       onChange={set("date")} />
          </Field>
          <Field label="Kind" hint="Essay / Process / Tools / Note">
            <TextInput value={note.kind} mono
                       placeholder="Essay"
                       onChange={set("kind")} />
          </Field>
          <Field label="Reading time" hint="auto-calculated from body">
            <input className="adm-input mono" readOnly
                   value={readMin ? `${readMin} min · ${wordCount} words` : "no body yet"} />
          </Field>
        </div>
        <Field label="Summary" hint="1 sentence preview — shown on the index and homepage strip" full>
          <TextArea value={note.summary} rows={2}
                    placeholder="A short preview line."
                    onChange={set("summary")} />
        </Field>
      </fieldset>

      <fieldset className="adm-fs">
        <legend>Cover image</legend>
        <Field label="Cover" full hint="optional — shown at the top of the article">
          <ImageDrop value={note.cover}
                     onChange={set("cover")}
                     label="Drop cover image" />
        </Field>
        <Field label="Cover alt text" full>
          <TextInput value={note.cover?.alt}
                     placeholder="Describe the image for accessibility"
                     onChange={setCover("alt")} />
        </Field>
      </fieldset>

      <fieldset className="adm-fs">
        <legend>Body</legend>
        <MarkdownEditor
          value={note.body}
          onChange={set("body")}
          rows={22}
          placeholder={`# Heading\n\nFirst paragraph with **bold** and *italic*.\n\n## Subhead\n\n- A bullet\n- Another\n\n[A link](https://example.com)`}
        />
      </fieldset>
    </div>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────

function PageAdmin({ go }) {
  const [tab, setTab] = React.useState("projects"); // "projects" | "notes" | "pages" | "identity" | "theme"
  const [selectedId, setSelectedId] = React.useState(window.PROJECTS[0]?.id);
  const [selectedNoteId, setSelectedNoteId] = React.useState(window.NOTES[0]?.id);
  const [, force] = React.useReducer((v) => v + 1, 0);
  const importRef = React.useRef(null);

  const project = window.PROJECTS.find((p) => p.id === selectedId);
  const note = window.NOTES.find((n) => n.id === selectedNoteId);
  const dirty = window.isContentDirty();

  // Patch a project in window.PROJECTS by id
  const patchProject = (next) => {
    const i = window.PROJECTS.findIndex((p) => p.id === next.id);
    if (i === -1) return;
    window.PROJECTS = window.PROJECTS.map((p, idx) => idx === i ? next : p);
    force();
  };

  // Rename a project's id (slug). Updates the array entry and the selection.
  const renameProjectId = (oldId, newId) => {
    if (!newId || newId === oldId) return;
    // ensure unique
    let uniq = newId;
    let n = 2;
    while (window.PROJECTS.some((p) => p.id === uniq && p.id !== oldId)) {
      uniq = `${newId}-${n++}`;
    }
    const i = window.PROJECTS.findIndex((p) => p.id === oldId);
    if (i === -1) return;
    window.PROJECTS[i] = { ...window.PROJECTS[i], id: uniq };
    setSelectedId(uniq);
    force();
  };

  const addProject = () => {
    const base = {
      id: `new-project-${Date.now().toString(36)}`,
      title: "New project",
      sub: "Discipline subtitle",
      year: new Date().getFullYear().toString(),
      client: "Client",
      role: "Your role",
      disciplines: ["motion"],
      primary: "motion",
      brief: "One or two sentences describing the brief.",
      summary: "A short snapshot paragraph.",
      writeup: ["First paragraph of the long-form writeup."],
      hero: { src: "", alt: "New project hero" },
      heroVideo: "",
      process: [
        { src: "", label: "Step one", note: "Working notes" },
        { src: "", label: "Step two", note: "Working notes" },
        { src: "", label: "Step three", note: "Working notes" },
      ],
      tools: "",
      duration: "",
      status: "In progress",
    };
    window.PROJECTS = [...window.PROJECTS, base];
    setSelectedId(base.id);
    force();
  };

  const deleteProject = (id) => {
    if (!confirm("Delete this project? This can't be undone (until you reset or import).")) return;
    const i = window.PROJECTS.findIndex((p) => p.id === id);
    window.PROJECTS = window.PROJECTS.filter((p) => p.id !== id);
    if (selectedId === id) {
      const next = window.PROJECTS[Math.max(0, i - 1)];
      setSelectedId(next?.id);
    }
    force();
  };

  const moveProject = (id, delta) => {
    const i = window.PROJECTS.findIndex((p) => p.id === id);
    const j = i + delta;
    if (i === -1 || j < 0 || j >= window.PROJECTS.length) return;
    const next = window.PROJECTS.slice();
    const [moved] = next.splice(i, 1);
    next.splice(j, 0, moved);
    window.PROJECTS = next;
    force();
  };

  // ── Notes CRUD ────────────────────────────────────────────────────────
  const patchNote = (next) => {
    const i = window.NOTES.findIndex((n) => n.id === next.id);
    if (i === -1) return;
    window.NOTES = window.NOTES.map((n, idx) => idx === i ? next : n);
    force();
  };
  const renameNoteId = (oldId, newId) => {
    if (!newId || newId === oldId) return;
    let uniq = newId;
    let n = 2;
    while (window.NOTES.some((x) => x.id === uniq && x.id !== oldId)) {
      uniq = `${newId}-${n++}`;
    }
    const i = window.NOTES.findIndex((x) => x.id === oldId);
    if (i === -1) return;
    window.NOTES[i] = { ...window.NOTES[i], id: uniq };
    setSelectedNoteId(uniq);
    force();
  };
  const addNote = () => {
    const base = {
      id: `new-note-${Date.now().toString(36)}`,
      date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      title: "New note",
      kind: "Essay",
      summary: "A short preview line.",
      body: "# Heading\n\nFirst paragraph of the new note.",
      cover: { src: "", alt: "" },
      pinned: false,
    };
    window.NOTES = [...window.NOTES, base];
    setSelectedNoteId(base.id);
    force();
  };
  const deleteNote = (id) => {
    if (!confirm("Delete this note? You can recover by importing a previous export.")) return;
    const i = window.NOTES.findIndex((n) => n.id === id);
    window.NOTES = window.NOTES.filter((n) => n.id !== id);
    if (selectedNoteId === id) {
      const nx = window.NOTES[Math.max(0, i - 1)];
      setSelectedNoteId(nx?.id);
    }
    force();
  };
  const moveNote = (id, delta) => {
    const i = window.NOTES.findIndex((n) => n.id === id);
    const j = i + delta;
    if (i === -1 || j < 0 || j >= window.NOTES.length) return;
    const next = window.NOTES.slice();
    const [moved] = next.splice(i, 1);
    next.splice(j, 0, moved);
    window.NOTES = next;
    force();
  };

  const save = () => {
    window.saveContent();
    force();
  };

  const reset = () => {
    if (!confirm("Reset all content to the file defaults? Your edits will be lost.")) return;
    window.resetContent();
    setSelectedId(window.PROJECTS[0]?.id);
    force();
  };

  const exportJSON = () => {
    downloadText("portfolio-content.json", window.exportJSON(), "application/json");
  };
  const exportDataJS = () => {
    downloadText("data.js", window.exportDataJS(), "text/javascript");
  };
  const handleImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        window.importJSON(e.target.result);
        setSelectedId(window.PROJECTS[0]?.id);
        force();
      } catch (err) {
        alert("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="page page-enter admin-page">
      <header className="adm-hd">
        <div className="adm-hd-l">
          <a href="/" data-cursor="link" className="cs-back"
             onClick={(e) => { e.preventDefault(); go("/"); }}>
            <span>←</span> Back to site
          </a>
          <div className="adm-hd-title">
            <span className="t-mono-sm" style={{ color: "var(--muted)" }}>Admin · v0.1</span>
            <h1 className="t-h2" style={{ marginTop: 4 }}>Content editor</h1>
          </div>
        </div>
        <div className="adm-hd-r">
          <div className="adm-status">
            {dirty ? (
              <><span className="adm-status-dot" data-on="1" /> Local changes saved</>
            ) : (
              <><span className="adm-status-dot" data-on="0" /> Showing file defaults</>
            )}
          </div>
        </div>
      </header>

      <div className="adm-toolbar">
        <div className="adm-tabs">
          <button className={`adm-tab ${tab === "projects" ? "on" : ""}`}
                  onClick={() => setTab("projects")}>Projects</button>
          <button className={`adm-tab ${tab === "notes" ? "on" : ""}`}
                  onClick={() => setTab("notes")}>Notes</button>
          <button className={`adm-tab ${tab === "pages" ? "on" : ""}`}
                  onClick={() => setTab("pages")}>Pages</button>
          <button className={`adm-tab ${tab === "identity" ? "on" : ""}`}
                  onClick={() => setTab("identity")}>Identity</button>
          <button className={`adm-tab ${tab === "theme" ? "on" : ""}`}
                  onClick={() => setTab("theme")}>Theme</button>
        </div>
        <div className="adm-toolbar-actions">
          <button className="adm-btn ghost" onClick={() => importRef.current?.click()}>
            ⬆ Import JSON
          </button>
          <input ref={importRef} type="file" accept="application/json,.json"
                 style={{ display: "none" }}
                 onChange={(e) => handleImport(e.target.files?.[0])} />
          <button className="adm-btn ghost" onClick={exportJSON}>⬇ Export JSON</button>
          <button className="adm-btn ghost" onClick={exportDataJS}>⬇ Export data.js</button>
          <button className="adm-btn danger" onClick={reset}>Reset</button>
          <button className="adm-btn primary" onClick={save}>
            Save & apply
          </button>
        </div>
      </div>

      <div className="adm-shell">
        {tab === "projects" && (
          <>
            <ProjectSidebar
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={addProject}
              onMove={moveProject}
              onDelete={deleteProject}
              version={0}
            />
            <main className="adm-main">
              <ProjectEditor
                project={project}
                onChange={patchProject}
                onChangeId={renameProjectId}
              />
            </main>
          </>
        )}
        {tab === "notes" && (
          <>
            <NoteSidebar
              selectedId={selectedNoteId}
              onSelect={setSelectedNoteId}
              onAdd={addNote}
              onMove={moveNote}
              onDelete={deleteNote}
              version={0}
            />
            <main className="adm-main">
              <NoteEditor
                note={note}
                onChange={patchNote}
                onChangeId={renameNoteId}
              />
            </main>
          </>
        )}
        {tab === "pages" && (
          <main className="adm-main adm-main-wide">
            <PagesEditor />
          </main>
        )}
        {tab === "identity" && (
          <main className="adm-main adm-main-wide">
            <IdentityEditor site={window.SITE}
                            onChange={(s) => { window.SITE = s; force(); }} />
          </main>
        )}
        {tab === "theme" && (
          <main className="adm-main adm-main-wide">
            <ThemeEditor />
          </main>
        )}
      </div>

      <div className="adm-foot">
        <div>
          <strong style={{ color: "var(--fg)" }}>This is the prototype editor.</strong>{" "}
          Changes save to your browser's localStorage and apply to the live preview.
          <br />
          For production, hand <code>SPEC.md §16</code> to Claude Code — it ships a
          real <code>/admin</code> route with auth, backed by Keystatic, Decap or Sanity.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PageAdmin });
