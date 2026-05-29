import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import styles from './markdown.module.css';

/**
 * Tiny markdown renderer — SPEC §6.11.
 * Supports headings (#–####), **bold**, *italic* (rendered in accent),
 * `inline code`, [links](url), bullet/numbered lists, blockquotes,
 * fenced code blocks, and `---` horizontal rules.
 *
 * Internal links (paths starting with /) route through next/link; external
 * https? links open in a new tab with rel="noopener noreferrer".
 * Zero runtime dependencies — keeps the bundle within SPEC §11 budgets.
 */

interface MarkdownProps {
  text: string;
  className?: string;
}

export function Markdown({ text, className }: MarkdownProps) {
  if (!text) return null;
  const blocks = parseBlocks(text);
  const cls = [styles.md, className].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {blocks.map((b, idx) => renderBlock(b, idx))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

type FigureLayout = 'block' | 'float-right' | 'float-left';

type Block =
  | { type: 'h'; level: 1 | 2 | 3 | 4; content: string }
  | { type: 'p'; content: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'blockquote'; content: string }
  | { type: 'code'; lang: string; content: string }
  | { type: 'hr' }
  | {
      type: 'figure';
      src: string;
      alt: string;
      caption?: string;
      layout?: FigureLayout;
    };

/* Block-level image: a line that STARTS with `![alt](src)` or
 * `![alt](src "caption")` becomes a <figure>. Keystatic's markdoc
 * editor's image-insert UI exposes both an "alt" and a "title" field;
 * the title (when set) serializes as the "..." trailing string and we
 * surface it as the visible figcaption. When the title is blank, we
 * fall back to the alt — that way a single-field insert (alt only)
 * still gets a visible label below the screenshot.
 *
 * Two robustness notes:
 *
 *  - Caption capture is greedy (`"(.*)"`), not `"([^"]*)"`. Keystatic
 *    writes caption strings verbatim, INCLUDING raw inner double
 *    quotes — e.g. a caption like `"He said "wow" then."`. Greedy
 *    matching backs off to the LAST `"` before the trailing `)` so
 *    inner quotes don't break the figure match.
 *
 *  - Trailing content after `)` is captured and re-fed to the parser
 *    on the next iteration. Keystatic occasionally serializes an
 *    image and the prose that follows it onto the same line (no
 *    blank line between them); without this, the whole line would
 *    fall through to paragraph rendering and the `![]()` would
 *    appear as literal text. */
const FIGURE_PATTERN = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"(.*)")?\)\s*(.*)$/;

/* Magazine image — a Keystatic-authored `wrapper` content component
 * (see `magazineImage` in keystatic.config.ts). The wrapper wraps a
 * normal Markdoc image with a layout selector. On disk it serialises
 * as a paired Markdoc tag with the image inside:
 *
 *   {% magazineImage layout="float-right" %}
 *   ![Alt text](/assets/notes/foo/bar.png "Caption text")
 *   {% /magazineImage %}
 *
 * The wrapper carries only the `layout` attribute; the `src`, `alt`,
 * and `caption` all come from the regular inline image inside it. This
 * is the supported Keystatic pattern — `fields.image` inside a custom
 * block's schema doesn't round-trip through the editor's asset loader,
 * but the native image block already handles asset storage end-to-end.
 *
 * Parsing notes:
 *  - The opener line may span multiple physical lines if Markdoc
 *    serialised the attrs broken across lines. We accumulate until the
 *    line containing `%}`.
 *  - The closer line must match exactly (`{% /magazineImage %}`).
 *  - If there's no image between the opener and closer, we fall back
 *    to rendering the inner content as regular markdown blocks so we
 *    never silently drop authored text. */
const MAGAZINE_OPEN_PATTERN =
  /^\s*\{%\s*magazineImage\b([\s\S]*?)\s*%\}\s*$/;
const MAGAZINE_CLOSE_PATTERN =
  /^\s*\{%\s*\/\s*magazineImage\s*%\}\s*$/;
const MAGAZINE_ATTR_PATTERN = /(\w+)\s*=\s*"((?:[^"\\]|\\.)*)"/g;

function parseMagazineLayout(raw: string | undefined): FigureLayout {
  if (raw === 'float-right' || raw === 'float-left') return raw;
  return 'block';
}

function parseMagazineAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  let m: RegExpExecArray | null;
  MAGAZINE_ATTR_PATTERN.lastIndex = 0;
  while ((m = MAGAZINE_ATTR_PATTERN.exec(source)) !== null) {
    const key = m[1];
    const raw = m[2];
    if (key !== undefined && raw !== undefined) {
      attrs[key] = raw.replace(/\\(.)/g, '$1');
    }
  }
  return attrs;
}

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = String(text).split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    if (line.trim() === '') {
      i++;
      continue;
    }

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !(lines[i] ?? '').startsWith('```')) {
        codeLines.push(lines[i] ?? '');
        i++;
      }
      i++;
      blocks.push({ type: 'code', lang, content: codeLines.join('\n') });
      continue;
    }

    if (/^(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    /* Markdoc tag — currently only the paired `{% magazineImage … %}`
     * wrapper is recognised. Unknown tags fall through to paragraph
     * rendering so they're visibly broken rather than silently dropped. */
    if (line.trimStart().startsWith('{%')) {
      /* Accumulate the opener line(s) until we see `%}` closing the
       * tag. Markdoc usually emits the tag on one line, but the parser
       * is tolerant of attrs broken across lines. */
      let openText = line;
      let openConsumed = 1;
      while (!openText.includes('%}') && i + openConsumed < lines.length) {
        openText += '\n' + (lines[i + openConsumed] ?? '');
        openConsumed++;
      }
      const openMatch = openText.match(MAGAZINE_OPEN_PATTERN);
      /* `MAGAZINE_OPEN_PATTERN` matches the paired form only — Markdoc
       * self-closing tags (`{% … /%}`) end with `/%}`, which fails the
       * `%}` boundary in the pattern. So we don't need a separate guard
       * to skip self-closing tags. */
      if (openMatch) {
        const attrs = parseMagazineAttrs(openMatch[1] ?? '');
        const layout = parseMagazineLayout(attrs['layout']);

        /* Walk forward looking for the matching close tag, collecting
         * inner lines along the way. If we run off the end of the
         * document without finding a close, we still emit what we
         * collected — better than dropping authored content. */
        let j = i + openConsumed;
        const innerLines: string[] = [];
        while (
          j < lines.length &&
          !MAGAZINE_CLOSE_PATTERN.test(lines[j] ?? '')
        ) {
          innerLines.push(lines[j] ?? '');
          j++;
        }
        /* `j` now points AT the close tag (or past the end). Advance
         * past it so the outer loop resumes on the line after. */
        const closeFound = j < lines.length;

        /* Find the first inline image inside the wrapper. We don't
         * recurse into the inner content for other block types — the
         * wrapper is designed to hold exactly one image, and the
         * Keystatic editor enforces this by default. */
        let figureEmitted = false;
        for (const inLine of innerLines) {
          const figMatch = inLine.match(FIGURE_PATTERN);
          if (figMatch && figMatch[2]) {
            blocks.push({
              type: 'figure',
              alt: figMatch[1] ?? '',
              src: figMatch[2],
              ...(figMatch[3] !== undefined && figMatch[3] !== ''
                ? { caption: figMatch[3] }
                : {}),
              layout,
            });
            figureEmitted = true;
            break;
          }
        }

        /* No image inside the wrapper — fall back to rendering the
         * inner lines as regular markdown so authored prose still
         * appears on the page. Should be rare in practice (the editor
         * UI guides users toward an image) but it's a safer default
         * than silently dropping content. */
        if (!figureEmitted && innerLines.length > 0) {
          const innerBlocks = parseBlocks(innerLines.join('\n'));
          for (const block of innerBlocks) {
            blocks.push(block);
          }
        }

        i = closeFound ? j + 1 : j;
        continue;
      }
      /* Not a recognised tag — fall through. The original opener line
       * will be picked up by the paragraph fallback at the bottom of
       * the loop. */
    }

    const figMatch = line.match(FIGURE_PATTERN);
    if (figMatch && figMatch[2]) {
      blocks.push({
        type: 'figure',
        alt: figMatch[1] ?? '',
        src: figMatch[2],
        caption: figMatch[3],
      });
      /* If the source line had non-empty content AFTER the image's
       * closing `)`, replay that content as the current line so the
       * next loop iteration picks it up as the start of whatever
       * block it actually is (usually a paragraph). This is the
       * "Keystatic glued the image and the following paragraph onto
       * one line" case — see the FIGURE_PATTERN comment above. */
      const trailing = (figMatch[4] ?? '').trim();
      if (trailing) {
        lines[i] = trailing;
      } else {
        i++;
      }
      continue;
    }

    const hMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (hMatch && hMatch[1] && hMatch[2] !== undefined) {
      const level = Math.min(4, hMatch[1].length) as 1 | 2 | 3 | 4;
      blocks.push({ type: 'h', level, content: hMatch[2].trim() });
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const buf: string[] = [];
      while (i < lines.length && (lines[i] ?? '').startsWith('> ')) {
        buf.push((lines[i] ?? '').slice(2));
        i++;
      }
      blocks.push({ type: 'blockquote', content: buf.join(' ') });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Paragraph
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      (lines[i] ?? '').trim() !== '' &&
      !(lines[i] ?? '').startsWith('#') &&
      !(lines[i] ?? '').startsWith('> ') &&
      !(lines[i] ?? '').startsWith('```') &&
      !/^[-*]\s+/.test(lines[i] ?? '') &&
      !/^\d+\.\s+/.test(lines[i] ?? '') &&
      !/^(---|\*\*\*|___)\s*$/.test(lines[i] ?? '')
    ) {
      buf.push(lines[i] ?? '');
      i++;
    }
    blocks.push({ type: 'p', content: buf.join(' ') });
  }

  return blocks;
}

function renderBlock(b: Block, idx: number): ReactNode {
  switch (b.type) {
    case 'h': {
      const hClass = `${styles.h} ${styles[`h${b.level}`] ?? ''}`;
      const inner = renderInline(b.content, `h${idx}_`);
      if (b.level === 1) return <h1 key={idx} className={hClass}>{inner}</h1>;
      if (b.level === 2) return <h2 key={idx} className={hClass}>{inner}</h2>;
      if (b.level === 3) return <h3 key={idx} className={hClass}>{inner}</h3>;
      return <h4 key={idx} className={hClass}>{inner}</h4>;
    }
    case 'p':
      return (
        <p key={idx} className={styles.p}>
          {renderInline(b.content, `p${idx}_`)}
        </p>
      );
    case 'ul':
      return (
        <ul key={idx} className={styles.ul}>
          {b.items.map((it, j) => (
            <li key={j}>{renderInline(it, `ul${idx}_${j}_`)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={idx} className={styles.ol}>
          {b.items.map((it, j) => (
            <li key={j}>{renderInline(it, `ol${idx}_${j}_`)}</li>
          ))}
        </ol>
      );
    case 'blockquote':
      return (
        <blockquote key={idx} className={styles.bq}>
          {renderInline(b.content, `bq${idx}_`)}
        </blockquote>
      );
    case 'code':
      return (
        <pre key={idx} className={styles.pre}>
          <code className={b.lang ? `lang-${b.lang}` : undefined}>{b.content}</code>
        </pre>
      );
    case 'hr':
      return <hr key={idx} className={styles.hr} />;
    case 'figure': {
      /* Prefer the explicit caption (markdoc `"title"`); fall back to
       * the alt so a single-field author flow still gets a visible
       * label below the screenshot. */
      const captionText = b.caption ?? b.alt;
      const layoutClass =
        b.layout === 'float-right'
          ? styles.figureFloatRight
          : b.layout === 'float-left'
            ? styles.figureFloatLeft
            : undefined;
      const figureClass = [styles.figure, layoutClass]
        .filter(Boolean)
        .join(' ');
      return (
        <figure key={idx} className={figureClass}>
          {/* Plain <img> keeps the markdown source-of-truth simple: the
           * alt comes straight from the [...] portion and width is
           * derived from the file's intrinsic size. Lazy-loaded so the
           * article never blocks paint waiting on screenshots below
           * the fold. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.src}
            alt={b.alt}
            loading="lazy"
            decoding="async"
            className={styles.figureImg}
          />
          {captionText ? (
            <figcaption className={styles.figcaption}>
              {renderInline(captionText, `fig${idx}_`)}
            </figcaption>
          ) : null}
        </figure>
      );
    }
  }
}

/* Inline parser — first-match wins; code is parsed first so it shields */
const INLINE_PATTERN =
  /(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))/;

export function renderInline(text: string, keyPrefix = 'i'): ReactNode[] {
  if (!text) return [];
  const nodes: ReactNode[] = [];
  let rest = text;
  let n = 0;

  while (rest.length > 0) {
    const match = rest.match(INLINE_PATTERN);
    if (!match) {
      nodes.push(<Fragment key={`${keyPrefix}${n++}`}>{rest}</Fragment>);
      break;
    }
    const before = rest.slice(0, match.index);
    if (before) {
      nodes.push(<Fragment key={`${keyPrefix}${n++}`}>{before}</Fragment>);
    }
    if (match[2] != null) {
      /* Inline code is a leaf — its content (`[^`]+`) can't contain
       * other inline markers by definition, so we render the raw text. */
      nodes.push(
        <code key={`${keyPrefix}${n++}`} className={styles.codeInline}>
          {match[2]}
        </code>,
      );
    } else if (match[4] != null) {
      /* Bold can wrap code, italic, or a link — recurse so e.g.
       * `**\`commit-msg\`**` renders as <strong><code>...</code></strong>
       * instead of <strong>`commit-msg`</strong> with literal ticks. */
      const childKey = `${keyPrefix}${n}b_`;
      nodes.push(
        <strong key={`${keyPrefix}${n++}`}>
          {renderInline(match[4], childKey)}
        </strong>,
      );
    } else if (match[6] != null) {
      const childKey = `${keyPrefix}${n}i_`;
      nodes.push(
        <em key={`${keyPrefix}${n++}`}>{renderInline(match[6], childKey)}</em>,
      );
    } else if (match[8] != null && match[9] != null) {
      const label = match[8];
      const url = match[9];
      const isExternal = /^https?:/.test(url);
      const isInternal = url.startsWith('/');
      /* Link labels can themselves carry bold / italic / code, so
       * recurse on the label too for the same reason as above. */
      const childKey = `${keyPrefix}${n}a_`;
      const labelNodes = renderInline(label, childKey);
      if (isInternal) {
        nodes.push(
          <Link key={`${keyPrefix}${n++}`} href={url} className={styles.link} data-cursor="link">
            {labelNodes}
          </Link>,
        );
      } else {
        nodes.push(
          <a
            key={`${keyPrefix}${n++}`}
            href={url}
            className={styles.link}
            data-cursor="link"
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
          >
            {labelNodes}
          </a>,
        );
      }
    }
    rest = rest.slice((match.index ?? 0) + match[0].length);
  }
  return nodes;
}
