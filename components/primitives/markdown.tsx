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

type Block =
  | { type: 'h'; level: 1 | 2 | 3 | 4; content: string }
  | { type: 'p'; content: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'blockquote'; content: string }
  | { type: 'code'; lang: string; content: string }
  | { type: 'hr' };

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
      nodes.push(
        <code key={`${keyPrefix}${n++}`} className={styles.codeInline}>
          {match[2]}
        </code>,
      );
    } else if (match[4] != null) {
      nodes.push(<strong key={`${keyPrefix}${n++}`}>{match[4]}</strong>);
    } else if (match[6] != null) {
      nodes.push(<em key={`${keyPrefix}${n++}`}>{match[6]}</em>);
    } else if (match[8] != null && match[9] != null) {
      const label = match[8];
      const url = match[9];
      const isExternal = /^https?:/.test(url);
      const isInternal = url.startsWith('/');
      if (isInternal) {
        nodes.push(
          <Link key={`${keyPrefix}${n++}`} href={url} className={styles.link} data-cursor="link">
            {label}
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
            {label}
          </a>,
        );
      }
    }
    rest = rest.slice((match.index ?? 0) + match[0].length);
  }
  return nodes;
}
