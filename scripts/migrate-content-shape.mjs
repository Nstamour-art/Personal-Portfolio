#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
 * One-time migration: reshape project + note frontmatter from flat to
 * grouped, matching the sectioned Keystatic schema.
 *
 * Project mapping (old → new):
 *   order, sub, year, client, role, disciplines, primary
 *                                              → about.*
 *   featured, draft                            → visibility.*
 *   pitch, brief, summary                      → story.*
 *   heroSrc, heroAlt, heroVideo,
 *     thumbSrc, thumbAlt                       → visuals.*
 *   process, tools, duration, status, output   → caseStudy.*
 *   ph, span, seoTitle, seoDescription         → advanced.*
 *   title, body                                → stay at root
 *
 * Note mapping:
 *   order, date, kind, summary                 → about.*
 *   pinned, draft                              → visibility.*
 *   coverSrc, coverAlt                         → cover.{src,alt}
 *   seoTitle, seoDescription                   → advanced.*
 *   title, body                                → stay at root
 *
 * The script is IDEMPOTENT — it detects already-migrated files (presence
 * of `about` as an object) and skips them. Safe to re-run.
 *
 * Run:
 *   pnpm content:migrate    (alias added in package.json)
 *   node scripts/migrate-content-shape.mjs
 * ──────────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');

function isAlreadyMigrated(front) {
  return (
    front &&
    typeof front === 'object' &&
    front.about &&
    typeof front.about === 'object' &&
    !Array.isArray(front.about)
  );
}

function migrateProject(front) {
  return {
    title: front.title,
    about: {
      order: front.order ?? 100,
      sub: front.sub ?? '',
      year: front.year ?? '',
      client: front.client ?? '',
      role: front.role ?? '',
      disciplines: front.disciplines ?? ['motion'],
      primary: front.primary ?? 'motion',
    },
    visibility: {
      featured: front.featured ?? false,
      draft: front.draft ?? false,
    },
    story: {
      pitch: front.pitch ?? '',
      brief: front.brief ?? '',
      summary: front.summary ?? '',
    },
    visuals: {
      heroSrc: front.heroSrc ?? null,
      heroAlt: front.heroAlt ?? '',
      heroVideo: front.heroVideo ?? '',
      thumbSrc: front.thumbSrc ?? null,
      thumbAlt: front.thumbAlt ?? '',
    },
    caseStudy: {
      process: (front.process ?? []).map((p) => ({
        label: p.label ?? '',
        note: p.note ?? '',
        mediaSrc: p.mediaSrc ?? null,
        mediaAlt: p.mediaAlt ?? '',
      })),
      tools: front.tools ?? '',
      duration: front.duration ?? '',
      status: front.status ?? '',
      output: front.output ?? '',
    },
    advanced: {
      ph: front.ph ?? '',
      span: front.span ?? '',
      seoTitle: front.seoTitle ?? '',
      seoDescription: front.seoDescription ?? '',
    },
  };
}

function migrateNote(front) {
  return {
    title: front.title,
    about: {
      order: front.order ?? 100,
      date: front.date ?? '',
      kind: front.kind ?? '',
      summary: front.summary ?? '',
    },
    visibility: {
      pinned: front.pinned ?? false,
      draft: front.draft ?? false,
    },
    cover: {
      src: front.coverSrc ?? null,
      alt: front.coverAlt ?? '',
    },
    advanced: {
      seoTitle: front.seoTitle ?? '',
      seoDescription: front.seoDescription ?? '',
    },
  };
}

function processDir(dirName, migrate) {
  const root = path.join(DATA, dirName);
  if (!fs.existsSync(root)) {
    console.log(`  ⚠ ${dirName}/ does not exist; skipping`);
    return;
  }
  const slugs = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)
    .sort();

  let migrated = 0;
  let skipped = 0;
  for (const slug of slugs) {
    const file = path.join(root, slug, 'index.mdoc');
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = matter(raw);
    if (isAlreadyMigrated(parsed.data)) {
      skipped++;
      continue;
    }
    const newFront = migrate(parsed.data);
    /* Preserve the original body verbatim (with leading newline only — the
     * default matter.stringify behaviour). gray-matter handles YAML
     * serialisation. */
    const newRaw = matter.stringify(parsed.content, newFront);
    fs.writeFileSync(file, newRaw);
    console.log(`  ✓ migrated ${dirName}/${slug}`);
    migrated++;
  }
  console.log(
    `  → ${dirName}/: ${migrated} migrated, ${skipped} already up-to-date`,
  );
}

function main() {
  console.log('▸ Migrating content shape (flat → grouped)');
  processDir('projects', migrateProject);
  processDir('notes', migrateNote);
  console.log('✓ Migration complete.');
}

main();
