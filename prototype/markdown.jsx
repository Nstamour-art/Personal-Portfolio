// markdown.jsx — tiny, dependency-free Markdown renderer.
//
// Supports the subset needed for notes/articles:
//   # / ## / ### / ####   headings
//   **bold** / *italic* / `inline code`
//   [link text](https://url)
//   - / *  bullet lists
//   1. 2. 3.  numbered lists
//   > blockquote (block-level, can wrap multiple lines)
//   ``` fenced code blocks ```
//   ---   horizontal rule
//   blank line = paragraph break
//
// Why hand-rolled instead of marked.js: ~120 lines beats a 50 KB dep for
// content this scoped, and we can match the design system exactly.
//
// Usage: <Markdown text={someString} />

// ── Inline parser ──────────────────────────────────────────────────────────
// Walks text and emits an array of React nodes, handling **bold**, *italic*,
// `code`, and [link](url). Order matters — code is parsed first so its
// contents are protected from bold/italic.
function renderInline(text, keyPrefix = "i") {
  if (!text) return null;
  const nodes = [];
  let rest = text;
  let i = 0;
  // Combined regex: code | bold | italic | link
  // We match the FIRST occurring marker, slice, and continue.
  const pattern = /(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))/;
  while (rest.length > 0) {
    const match = rest.match(pattern);
    if (!match) {
      nodes.push(<React.Fragment key={`${keyPrefix}${i++}`}>{rest}</React.Fragment>);
      break;
    }
    const before = rest.slice(0, match.index);
    if (before) {
      nodes.push(<React.Fragment key={`${keyPrefix}${i++}`}>{before}</React.Fragment>);
    }
    if (match[2] != null) {
      // Inline code
      nodes.push(<code key={`${keyPrefix}${i++}`} className="md-code">{match[2]}</code>);
    } else if (match[4] != null) {
      // Bold
      nodes.push(<strong key={`${keyPrefix}${i++}`}>{match[4]}</strong>);
    } else if (match[6] != null) {
      // Italic
      nodes.push(<em key={`${keyPrefix}${i++}`}>{match[6]}</em>);
    } else if (match[8] != null && match[9] != null) {
      // Link
      const url = match[9];
      const isExternal = /^https?:/.test(url);
      const isInternal = url.startsWith("/") || url.startsWith("#/");
      nodes.push(
        <a key={`${keyPrefix}${i++}`}
           href={url}
           data-cursor="link"
           target={isExternal ? "_blank" : undefined}
           rel={isExternal ? "noopener noreferrer" : undefined}
           onClick={isInternal && window.__appGo
             ? (e) => { e.preventDefault(); window.__appGo(url); }
             : undefined}
           className="md-link">
          {match[8]}
        </a>
      );
    }
    rest = rest.slice(match.index + match[0].length);
  }
  return nodes;
}

// ── Block parser ───────────────────────────────────────────────────────────
// Splits markdown source into blocks (paragraphs, headings, lists, quotes,
// code, hr) and renders each.
function Markdown({ text }) {
  if (!text) return null;
  const blocks = [];
  const lines = String(text).split("\n");
  let i = 0;

  while (i < lines.length) {
    let line = lines[i];

    // Skip blank lines between blocks
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Fenced code block: ```lang
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      blocks.push({ type: "code", lang, content: codeLines.join("\n") });
      continue;
    }

    // Horizontal rule
    if (/^(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Headings
    const hMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (hMatch) {
      blocks.push({ type: "h", level: hMatch[1].length, content: hMatch[2].trim() });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        buf.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "blockquote", content: buf.join(" ") });
      continue;
    }

    // Bullet list
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Paragraph — consume until blank line or another block marker
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("> ") &&
      !lines[i].startsWith("```") &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^(---|\*\*\*|___)\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", content: buf.join(" ") });
  }

  return (
    <div className="md">
      {blocks.map((b, idx) => {
        switch (b.type) {
          case "h": {
            const Tag = `h${b.level}`;
            return <Tag key={idx} className={`md-h md-h${b.level}`}>{renderInline(b.content, `h${idx}_`)}</Tag>;
          }
          case "p":
            return <p key={idx} className="md-p">{renderInline(b.content, `p${idx}_`)}</p>;
          case "ul":
            return (
              <ul key={idx} className="md-ul">
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `ul${idx}_${j}_`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={idx} className="md-ol">
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `ol${idx}_${j}_`)}</li>
                ))}
              </ol>
            );
          case "blockquote":
            return <blockquote key={idx} className="md-bq">{renderInline(b.content, `bq${idx}_`)}</blockquote>;
          case "code":
            return (
              <pre key={idx} className="md-pre">
                <code className={`md-codeblock ${b.lang ? `lang-${b.lang}` : ""}`}>{b.content}</code>
              </pre>
            );
          case "hr":
            return <hr key={idx} className="md-hr" />;
          default:
            return null;
        }
      })}
    </div>
  );
}

Object.assign(window, { Markdown, renderInline });
