// markdown-editor.jsx — reusable rich markdown editor with toolbar + preview.
//
// Drop-in replacement for any long-form admin textarea. Provides:
//   - Write / Preview tabs (renders via the same Markdown component the site uses)
//   - GitHub-style formatting toolbar: H, B, I, link, list, ol, quote, code,
//     codeblock, hr
//   - Keyboard shortcuts: Cmd/Ctrl+B (bold), Cmd/Ctrl+I (italic), Cmd/Ctrl+K (link)
//   - Smart selection wrapping: select text + click B → **text**
//                                no selection + click B → **bold text** (placeholder)
//
// Usage:
//   <MarkdownEditor value={text} onChange={setText} rows={14} placeholder="..." />

function MarkdownEditor({ value, onChange, rows = 14, placeholder, compact = false }) {
  const [tab, setTab] = React.useState("write"); // "write" | "preview"
  const taRef = React.useRef(null);

  // Wrap (or insert) a markdown construct around the current selection.
  // - prefix / suffix: text put before / after the selection
  // - placeholder:     used when nothing is selected, e.g. "bold text"
  // - block:           if true, ensure prefix sits on its own line
  //                    (used for headings, blockquotes, lists)
  const wrap = (prefix, suffix = "", placeholder = "text", block = false) => {
    const ta = taRef.current;
    if (!ta) return;
    const v = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = v.slice(start, end) || placeholder;

    let leftPad = "";
    let rightPad = "";
    if (block) {
      // Ensure the prefix starts on a new line
      const before = v.slice(0, start);
      if (before && !before.endsWith("\n")) leftPad = "\n";
      if (before && !before.endsWith("\n\n") && !before.endsWith("\n")) leftPad = "\n";
      const after = v.slice(end);
      if (after && !after.startsWith("\n")) rightPad = "\n";
    }

    const insertion = `${leftPad}${prefix}${selected}${suffix}${rightPad}`;
    const next = v.slice(0, start) + insertion + v.slice(end);
    onChange(next);

    // Restore selection on the inserted content
    requestAnimationFrame(() => {
      if (!taRef.current) return;
      const cursorStart = start + leftPad.length + prefix.length;
      const cursorEnd = cursorStart + selected.length;
      taRef.current.focus();
      taRef.current.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  // Toggle a line-prefix on each selected line (e.g. "- ", "> ", "1. ")
  const linePrefix = (prefix) => {
    const ta = taRef.current;
    if (!ta) return;
    const v = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    // Expand to full lines
    const lineStart = v.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = v.indexOf("\n", end);
    const sliceEnd = lineEnd === -1 ? v.length : lineEnd;
    const chunk = v.slice(lineStart, sliceEnd);
    const lines = chunk.split("\n");
    const allPrefixed = lines.every((l) => l.startsWith(prefix));
    const nextLines = lines.map((l, i) => {
      if (allPrefixed) return l.slice(prefix.length);
      // Numbered list — auto-increment if prefix ends with ". "
      if (/^\d+\.\s/.test(prefix)) {
        return `${i + 1}. ${l}`;
      }
      return l ? prefix + l : prefix.trimEnd();
    });
    const next = v.slice(0, lineStart) + nextLines.join("\n") + v.slice(sliceEnd);
    onChange(next);
    requestAnimationFrame(() => {
      if (!taRef.current) return;
      taRef.current.focus();
      taRef.current.setSelectionRange(lineStart, lineStart + nextLines.join("\n").length);
    });
  };

  // Heading toggle — applies/removes the prefix on the current line only.
  const heading = (level) => {
    const ta = taRef.current;
    if (!ta) return;
    const v = ta.value;
    const pos = ta.selectionStart;
    const lineStart = v.lastIndexOf("\n", pos - 1) + 1;
    const lineEnd = v.indexOf("\n", pos);
    const sliceEnd = lineEnd === -1 ? v.length : lineEnd;
    const line = v.slice(lineStart, sliceEnd);
    const stripped = line.replace(/^#{1,4}\s+/, "");
    const prefix = "#".repeat(level) + " ";
    const wasSame = line.startsWith(prefix);
    const nextLine = wasSame ? stripped : (prefix + stripped);
    const next = v.slice(0, lineStart) + nextLine + v.slice(sliceEnd);
    onChange(next);
    requestAnimationFrame(() => {
      if (!taRef.current) return;
      taRef.current.focus();
      const newPos = lineStart + nextLine.length;
      taRef.current.setSelectionRange(newPos, newPos);
    });
  };

  const insertLink = () => {
    const ta = taRef.current;
    if (!ta) return;
    const v = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = v.slice(start, end);
    const text = selected || "link text";
    const url = "https://";
    const insertion = `[${text}](${url})`;
    const next = v.slice(0, start) + insertion + v.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      if (!taRef.current) return;
      taRef.current.focus();
      // Place cursor inside the URL part so user can immediately paste/type
      const urlStart = start + insertion.indexOf("(") + 1;
      const urlEnd = urlStart + url.length;
      taRef.current.setSelectionRange(urlStart, urlEnd);
    });
  };

  const insertCodeBlock = () => {
    const ta = taRef.current;
    if (!ta) return;
    const v = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = v.slice(start, end) || "code here";
    const before = v.slice(0, start);
    const leftPad = before && !before.endsWith("\n") ? "\n" : "";
    const insertion = `${leftPad}\`\`\`\n${selected}\n\`\`\`\n`;
    const next = v.slice(0, start) + insertion + v.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      if (!taRef.current) return;
      const cursorStart = start + leftPad.length + 4; // skip ```\n
      const cursorEnd = cursorStart + selected.length;
      taRef.current.focus();
      taRef.current.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const insertHr = () => {
    const ta = taRef.current;
    if (!ta) return;
    const v = ta.value;
    const pos = ta.selectionStart;
    const before = v.slice(0, pos);
    const after = v.slice(pos);
    const leftPad = before && !before.endsWith("\n") ? "\n\n" : "\n";
    const rightPad = after && !after.startsWith("\n") ? "\n\n" : "\n";
    const insertion = `${leftPad}---${rightPad}`;
    const next = before + insertion + after;
    onChange(next);
    requestAnimationFrame(() => {
      if (!taRef.current) return;
      const cursor = pos + insertion.length;
      taRef.current.focus();
      taRef.current.setSelectionRange(cursor, cursor);
    });
  };

  const onKeyDown = (e) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const k = e.key.toLowerCase();
    if (k === "b") { e.preventDefault(); wrap("**", "**", "bold text"); }
    else if (k === "i") { e.preventDefault(); wrap("*", "*", "italic text"); }
    else if (k === "k") { e.preventDefault(); insertLink(); }
  };

  const buttons = [
    { label: "H1", title: "Heading 1",     fn: () => heading(1) },
    { label: "H2", title: "Heading 2",     fn: () => heading(2) },
    { label: "H3", title: "Heading 3",     fn: () => heading(3) },
    { sep: true },
    { icon: "B",   title: "Bold (Cmd+B)",  fn: () => wrap("**", "**", "bold text"),
      style: { fontWeight: 700 } },
    { icon: "I",   title: "Italic (Cmd+I)",fn: () => wrap("*", "*", "italic text"),
      style: { fontStyle: "italic" } },
    { icon: "</>", title: "Inline code",   fn: () => wrap("`", "`", "code") },
    { icon: "🔗",  title: "Link (Cmd+K)",  fn: insertLink },
    { sep: true },
    { icon: "•",   title: "Bullet list",   fn: () => linePrefix("- ") },
    { icon: "1.",  title: "Numbered list", fn: () => linePrefix("1. ") },
    { icon: "❝",   title: "Quote",         fn: () => linePrefix("> ") },
    { icon: "{ }", title: "Code block",    fn: insertCodeBlock },
    { icon: "—",   title: "Divider",       fn: insertHr },
  ];

  return (
    <div className={`md-ed ${compact ? "compact" : ""}`}>
      <div className="md-ed-bar">
        <div className="md-ed-tabs">
          <button type="button"
                  className={`md-ed-tab ${tab === "write" ? "on" : ""}`}
                  onClick={() => setTab("write")}>✎ Write</button>
          <button type="button"
                  className={`md-ed-tab ${tab === "preview" ? "on" : ""}`}
                  onClick={() => setTab("preview")}>👁 Preview</button>
        </div>
        <div className="md-ed-tools" style={{ visibility: tab === "write" ? "visible" : "hidden" }}>
          {buttons.map((b, i) => {
            if (b.sep) return <span key={i} className="md-ed-sep" />;
            return (
              <button key={i} type="button"
                      className="md-ed-btn"
                      title={b.title}
                      style={b.style}
                      onClick={b.fn}>
                {b.label || b.icon}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "write" ? (
        <textarea ref={taRef}
                  className="adm-input adm-md-editor md-ed-area"
                  rows={rows}
                  value={value || ""}
                  placeholder={placeholder || "Start writing…"}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={onKeyDown} />
      ) : (
        <div className="adm-md-preview md-ed-preview">
          <Markdown text={value} />
          {!value && (
            <p className="t-body-sm" style={{ color: "var(--muted)" }}>
              Nothing to preview yet. Click <strong>Write</strong> and start typing.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { MarkdownEditor });
