// pages-notes.jsx — /notes index + /notes/[slug] article detail

// ── /notes — editorial index of all articles ───────────────────────────────

function PageNotesIndex({ go }) {
  const notes = window.getSortedNotes();

  return (
    <div className="page page-enter notes-page">
      <header className="notes-head">
        <div>
          <div className="sec-label">Notes & writing · {notes.length}</div>
          <h1 className="t-h1" style={{ marginTop: 12 }}>
            Short writing on tools, rigs and how things get made.
          </h1>
        </div>
        <div className="t-body lede" style={{ maxWidth: 480 }}>
          Process notes, essays, and tooling logs. Most started as private
          documentation that turned out to be worth sharing.
        </div>
      </header>

      <section className="notes-list">
        {notes.map((n, i) => (
          <a key={n.id}
             href={`/notes/${n.id}`}
             data-cursor="view" data-cursor-label="Read"
             onClick={(e) => { e.preventDefault(); go(`/notes/${n.id}`); }}
             className="note-row clickable">
            <div className="note-num">/ {String(i + 1).padStart(2, "0")}</div>
            <div className="note-meta">
              <div className="t-mono-sm">{n.date}</div>
              {n.pinned && <div className="t-mono-sm note-pin">★ Pinned</div>}
            </div>
            <div className="note-body">
              <h3 className="note-title">{n.title}</h3>
              <p className="note-summary">{n.summary}</p>
            </div>
            <div className="note-kind">{n.kind}</div>
            <div className="note-arrow">↗</div>
          </a>
        ))}
      </section>

      <Footer go={go} />
    </div>
  );
}

// ── /notes/[id] — single article ───────────────────────────────────────────

function PageNote({ noteId, go }) {
  const note = window.getNote(noteId);
  if (!note) {
    return (
      <div className="page page-enter" style={{ padding: "200px var(--pad)" }}>
        <div className="sec-label">404 — Not found</div>
        <h1 className="t-h1">No such note.</h1>
        <a href="/notes" data-cursor="link" className="btn ghost"
           onClick={(e) => { e.preventDefault(); go("/notes"); }}
           style={{ marginTop: 32 }}>
          Back to notes <span className="arr">→</span>
        </a>
      </div>
    );
  }

  const all = window.getSortedNotes();
  const idx = all.findIndex((n) => n.id === noteId);
  const next = window.getNextNote(noteId);
  const prev = window.getPrevNote(noteId);

  // Approximate reading time (200 wpm)
  const wordCount = String(note.body || "").trim().split(/\s+/).length;
  const readMin = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="page page-enter note-page">
      <header className="note-header">
        <a href="/notes" data-cursor="link" className="cs-back"
           onClick={(e) => { e.preventDefault(); go("/notes"); }}>
          <span>←</span> Notes index
        </a>
        <div className="t-mono-sm">
          {String(idx + 1).padStart(2, "0")} / {String(all.length).padStart(2, "0")}
        </div>
      </header>

      <article className="note-article">
        <div className="note-meta-row">
          <span className="t-mono-sm">{note.date}</span>
          <span className="t-mono-sm note-kind-pill">{note.kind}</span>
          <span className="t-mono-sm" style={{ color: "var(--muted)" }}>
            {readMin} min read
          </span>
        </div>

        <h1 className="note-h1">{note.title}</h1>

        {note.summary && (
          <p className="note-deck">{note.summary}</p>
        )}

        {note.cover && note.cover.src ? (
          <div className="note-cover">
            <img src={note.cover.src} alt={note.cover.alt || note.title} />
          </div>
        ) : (
          <div className="note-cover note-cover-empty">
            <div className="ph ph-ai">
              <div className="ph-grid" />
              <div className="ph-label">
                {note.cover?.alt || "Cover image — drop in /admin"}
              </div>
            </div>
          </div>
        )}

        <div className="note-body-wrap">
          <Markdown text={note.body} />
        </div>
      </article>

      <section className="note-next">
        <a href={`/notes/${prev.id}`} className="panel clickable"
           data-cursor="view" data-cursor-label="Previous"
           onClick={(e) => { e.preventDefault(); go(`/notes/${prev.id}`); }}>
          <div className="panel-overlay">
            <div className="t-mono-sm">← Previous note</div>
            <div>
              <div className="t-h3" style={{ marginBottom: 4 }}>{prev.title}</div>
              <div className="t-mono-sm">{prev.kind} · {prev.date}</div>
            </div>
          </div>
        </a>
        <a href={`/notes/${next.id}`} className="panel clickable"
           data-cursor="view" data-cursor-label="Next note"
           onClick={(e) => { e.preventDefault(); go(`/notes/${next.id}`); }}>
          <div className="panel-overlay">
            <div className="t-mono-sm" style={{ textAlign: "right" }}>Next note →</div>
            <div style={{ textAlign: "right" }}>
              <div className="t-h3" style={{ marginBottom: 4 }}>{next.title}</div>
              <div className="t-mono-sm">{next.kind} · {next.date}</div>
            </div>
          </div>
        </a>
      </section>

      <Footer go={go} />
    </div>
  );
}

Object.assign(window, { PageNotesIndex, PageNote });
