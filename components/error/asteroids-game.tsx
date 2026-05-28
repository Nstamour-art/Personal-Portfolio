'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCoarsePointer } from '@/lib/hooks/useReducedMotion';
import styles from './asteroids-game.module.css';

/* ────────────────────────────────────────────────────────────────────────
 * "Adrift" — the 404 game.
 *
 * Classic Asteroids loop themed to the site:
 *   • the rocks carry the marquee discipline words (Motion, 3D, …) so
 *     blowing them up is, narratively, the user picking the page back
 *     up out of the void.
 *   • everything renders as line art (no bitmaps) so it sits inside the
 *     site's editorial vector-art language instead of looking like a
 *     dropped-in arcade widget.
 *   • all colours read from CSS variables on mount so the game theme
 *     follows the user's Keystatic accent.
 *
 * Engine notes:
 *   • Game state lives in a ref and the loop runs on requestAnimationFrame
 *     with a delta-time integrator, so React never re-renders during play.
 *   • A small `phase` state (idle / playing / paused / gameover) is the
 *     only thing reflected back into React; it drives the overlay UI.
 *   • Edge wrap is implicit via mod-arithmetic in the update step.
 *   • Asteroid shape is pre-baked at spawn time (per-vertex radius noise)
 *     so the outline doesn't shimmer between frames.
 * ──────────────────────────────────────────────────────────────────── */

// ── Tuning ────────────────────────────────────────────────────────────
const TURN_RATE = 3.4; // rad / sec
const THRUST_ACC = 240; // px / sec²
const DRAG_PER_S = 0.55; // exponential drag; lower = more glide
const SHIP_RADIUS = 11; // collision radius
const BULLET_SPEED = 520; // px / sec
const BULLET_LIFE = 0.95; // sec
const FIRE_COOLDOWN = 0.18; // sec
const MAX_BULLETS = 5;
/* Generous invulnerability so you don't get pinballed across two lives
 * by a stuck asteroid right after respawn. Pairs with the smoother
 * fade-flash in drawShip below — the player can clearly see the shield
 * counting down. */
const INVULN_AFTER_SPAWN = 4.0; // sec
const RESPAWN_DELAY = 1.4; // sec after death — a beat longer for the notice
const STARTING_LIVES = 3;

type Size = 'lg' | 'md' | 'sm';
const ASTEROID_RADIUS: Record<Size, number> = { lg: 48, md: 28, sm: 16 };
const ASTEROID_SCORE: Record<Size, number> = { lg: 20, md: 50, sm: 100 };
const ASTEROID_SPEED: Record<Size, [number, number]> = {
  lg: [28, 64],
  md: [48, 100],
  sm: [70, 150],
};

/* Saucer tuning — small saucers are squishy but mobile (single-hit
 * mini-bosses), motherships are tanky but slow (5-hit set-pieces).
 * Score values reward the player far more than asteroids: small at 200
 * is double a small-asteroid kill (100), and the mothership at 1000 is
 * a meaningful score spike that makes the boss feel like a high-stakes
 * moment in the run. */
const SAUCER_RADIUS: Record<SaucerSize, number> = { small: 16, large: 40 };
const SAUCER_HP: Record<SaucerSize, number> = { small: 1, large: 5 };
const SAUCER_SCORE: Record<SaucerSize, number> = { small: 200, large: 1000 };
const SAUCER_SPEED: Record<SaucerSize, number> = { small: 110, large: 55 };

/* Fire pacing — small saucer is a sparse warning shot (mostly
 * pressure, easy to dodge), mothership is the real threat with
 * faster cadence and tighter aim. Cooldown is seconds between
 * shots. Scatter is the half-width of a uniform random aim error
 * in radians (so a value of 0.26 ≈ ±15° spread off the perfect
 * aim line — enough that point-blank hits aren't guaranteed but
 * close enough that the player has to actively dodge). */
const SAUCER_FIRE_CD: Record<SaucerSize, number> = { small: 2.8, large: 1.6 };
const SAUCER_SHOT_SCATTER: Record<SaucerSize, number> = {
  small: 0.42, // ±24°, the small one is bad at aiming
  large: 0.18, // ±10°, the mothership is precise
};
const SAUCER_SHOT_SPEED = 190; // px/s — slower than player bullets so dodging is possible
const SAUCER_SHOT_LIFE = 2.4; // s — long enough to cross most of the canvas

/* Mothership warning — the boss telegraphs its arrival with a
 * pulsing arrow at the edge it'll enter from, so the player has
 * time to manoeuvre into a defensive position before the fight
 * starts. 1.8 seconds is enough to read "INCOMING" and reposition
 * but short enough that it doesn't kill the tension. Small
 * saucers don't get this — they're meant to be sudden mid-wave
 * pressure, not telegraphed events. */
const WARNING_DURATION = 1.8;

/* Pause between waves — gives the player a beat to breathe after
 * clearing the board, and shows a "GET READY · WAVE N" overlay so
 * the next wave's arrival is announced rather than instantaneous.
 * The ship can still move and fire during this window (handy if the
 * player wants to reposition before the rocks materialize), but no
 * enemies are spawned until the timer hits zero. 1.8s lines up with
 * the mothership warning so boss waves have a single coherent
 * build-up arc (Get Ready → asteroids spawn + Mothership INCOMING
 * → mothership arrives). */
const WAVE_INTERMISSION_DURATION = 1.8;

const HIGH_SCORE_KEY = 'nsa.lost-in-space.hs';

/* Asteroid labels — light, universally-recognized annoyances and craft
 * clichés the player gets to vaporize on the way back to the home page.
 * Picked from a long pool at spawn time so wave-to-wave variety is high;
 * children of a split asteroid inherit the parent's word (classic
 * Asteroids feel), which means "COMIC SANS" breaks into smaller
 * "COMIC SANS" shards.
 *
 * Curation rule — audience is recruiters and hiring managers, NOT
 * fellow engineers / designers. Every entry has to be instantly legible
 * to a non-specialist: corporate clichés (Synergy), modern annoyances
 * (Cookie banner, Captcha), design memes (Comic Sans, Papyrus, Lens
 * flare), 90s/2000s nostalgia jokes (Clip art, Word art), and recent
 * AI-discourse terms (AI slop, Hallucination). Insider jargon was
 * removed because a recruiter doesn't know what "yak shave" or
 * "spaghetti" means out of context and the joke lands as confusion.
 *
 * Also avoid anything that reads as anti-collaboration (Meetings,
 * Revisions), anti-client (Bad brief), anti-business (Pivot), or
 * anti-personal-wellbeing (Burnout, Crunch) — the field should make a
 * hiring manager smile, not wince.
 *
 * Words are kept short enough to fit a medium asteroid (~14 chars at
 * 10px mono is the practical ceiling — see "Cookie banner") without
 * being trimmed by the renderer. */
const ENEMY_WORDS = [
  // Corporate / process clichés
  'Scope creep',
  'Synergy',
  'Buzzword',
  'Reply all',
  'Doom scroll',
  // AI discourse
  'AI slop',
  'Hallucination',
  // Design memes everyone recognizes
  'Stock photo',
  'Lorem ipsum',
  'Lens flare',
  'Comic Sans',
  'Papyrus',
  'Beige',
  'Clip art',
  'Word art',
  'Drop shadow',
  'All caps',
  // Modern web / UX annoyances
  'Pop-up ad',
  'Cookie banner',
  'Captcha',
  'Auto-play',
  'Hold music',
] as const;

type Vec = { x: number; y: number };
type Phase = 'idle' | 'playing' | 'paused' | 'gameover';

interface Ship {
  pos: Vec;
  vel: Vec;
  angle: number;
  thrusting: boolean;
  alive: boolean;
  invulnFor: number;
  respawnIn: number;
}
interface Bullet {
  pos: Vec;
  vel: Vec;
  life: number;
}
interface Asteroid {
  pos: Vec;
  vel: Vec;
  angle: number;
  spin: number;
  size: Size;
  word: string;
  radius: number;
  /** Per-vertex radius multiplier (8–11 entries), pre-baked at spawn. */
  shape: number[];
}
/* Saucer — boss-tier enemy that punctuates the asteroid grind. Two
 * variants:
 *   - 'small'  appears on every 3rd wave that's NOT also a 5th wave
 *     (3, 6, 9, 12, 18, 21, …). Single-hit, fast, vertical zigzag.
 *   - 'large'  is the mothership and replaces the small saucer on
 *     every 5th wave (5, 10, 15, 20, …). Multi-hit HP, larger
 *     silhouette, slow horizontal sweep with a gentle bob. Boss waves
 *     also halve the asteroid count so the mothership reads as the
 *     event rather than getting lost in the rock field.
 *
 * Despite the size difference both share the same data shape; gameplay
 * differences live in the constants below and in the per-frame motion
 * branch in update(). */
type SaucerSize = 'small' | 'large';
interface Saucer {
  pos: Vec;
  vel: Vec;
  size: SaucerSize;
  radius: number;
  hp: number;
  /** Time accumulator (s) driving the zigzag / bob phase. */
  t: number;
  /** Seconds until the next shot. Saucers fire when this counts
   * down to ≤ 0, then reset to the size's fire-cooldown value. */
  fireCd: number;
}
/* Saucer-fired projectiles, kept on a separate array from the
 * player's bullets so they:
 *   • render in a different style (rings vs streaks),
 *   • only collide with the ship (not asteroids — saucers don't
 *     break up the rock field for the player),
 *   • participate in their own ship-collision check that respects
 *     post-respawn invulnerability. */
interface EnemyBullet {
  pos: Vec;
  vel: Vec;
  life: number;
}
/* Pending saucer — a queued saucer spawn that's currently
 * displaying its INCOMING warning. The wave-clear gate also
 * waits on this being null so the next wave can't fire while a
 * mothership entrance is still pending. Currently only used for
 * the mothership; small saucers spawn directly. */
interface PendingSaucer {
  size: SaucerSize;
  /** Side of the canvas the saucer will emerge from. */
  fromLeft: boolean;
  /** Vertical position the saucer will arrive at. */
  y: number;
  /** Seconds until the saucer materialises. Drives the warning
   * blink and gates the spawn. */
  timer: number;
}
interface Particle {
  pos: Vec;
  vel: Vec;
  life: number;
  max: number;
}

interface Input {
  left: boolean;
  right: boolean;
  thrust: boolean;
  brake: boolean;
  fire: boolean;
}

interface Theme {
  bg: string;
  fg: string;
  fg2: string;
  muted: string;
  muted2: string;
  line: string;
  accent: string;
}

interface State {
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  saucers: Saucer[];
  pendingSaucer: PendingSaucer | null;
  enemyBullets: EnemyBullet[];
  particles: Particle[];
  stars: { pos: Vec; alpha: number }[];
  score: number;
  highScore: number;
  lives: number;
  wave: number;
  fireCooldown: number;
  width: number;
  height: number;
  dpr: number;
  input: Input;
  theme: Theme;
  /** Snapshot of `(pointer: coarse)` taken when the run starts.
   * Read by `buildWave` to scale asteroid counts down on touch
   * devices, where thumb controls can't keep up with the
   * desktop wave curve. Captured into state so the difficulty
   * stays consistent for a whole run even if the user docks /
   * undocks a keyboard mid-game. */
  isTouch: boolean;
  /** Seconds remaining on the inter-wave pause. > 0 means the
   * player has cleared the board and is in the brief "Get Ready"
   * window before the next wave's enemies materialize. Wave
   * number is incremented when this timer starts (so the HUD
   * shows the upcoming wave during the pause); enemies are
   * spawned when it reaches 0. Stays at 0 during normal play. */
  waveIntermission: number;
}

// ── Helpers ───────────────────────────────────────────────────────────
const TAU = Math.PI * 2;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const randSign = () => (Math.random() < 0.5 ? -1 : 1);
const wrap = (v: number, max: number) => ((v % max) + max) % max;
const dist2 = (a: Vec, b: Vec) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

function makeShape(verts: number): number[] {
  // 0.78–1.10 per-vertex jitter gives a chunky-rock silhouette without
  // ever pinching to a sharp star shape.
  const out: number[] = [];
  for (let i = 0; i < verts; i++) out.push(0.78 + Math.random() * 0.32);
  return out;
}

function readTheme(host: HTMLElement): Theme {
  const cs = getComputedStyle(host);
  const v = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  return {
    bg: v('--bg', '#0e1117'),
    fg: v('--fg', '#ede5d8'),
    fg2: v('--fg-2', '#c9c5bc'),
    muted: v('--muted', '#7a7f8a'),
    muted2: v('--muted-2', '#4f535e'),
    line: v('--line-2', '#2a303c'),
    accent: v('--accent', '#ff5b1f'),
  };
}

function spawnAsteroid(
  size: Size,
  word: string,
  w: number,
  h: number,
  origin?: Vec,
  safeZone?: Vec,
): Asteroid {
  const radius = ASTEROID_RADIUS[size];
  let pos: Vec;
  if (origin) {
    pos = { x: origin.x, y: origin.y };
  } else {
    // Spawn away from the ship's safe zone so the player isn't insta-killed.
    let tries = 0;
    do {
      pos = { x: rand(0, w), y: rand(0, h) };
      tries++;
    } while (safeZone && tries < 16 && dist2(pos, safeZone) < (140 + radius) ** 2);
  }
  const [vmin, vmax] = ASTEROID_SPEED[size];
  const ang = rand(0, TAU);
  const sp = rand(vmin, vmax);
  return {
    pos,
    vel: { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp },
    angle: rand(0, TAU),
    spin: rand(0.4, 1.6) * randSign(),
    size,
    word,
    radius,
    shape: makeShape(8 + Math.floor(Math.random() * 4)),
  };
}

function freshShip(w: number, h: number): Ship {
  return {
    pos: { x: w / 2, y: h / 2 },
    vel: { x: 0, y: 0 },
    angle: -Math.PI / 2, // pointing up
    thrusting: false,
    alive: true,
    invulnFor: INVULN_AFTER_SPAWN,
    respawnIn: 0,
  };
}

function buildWave(
  state: State,
  waveNumber: number,
  words: readonly string[],
): Asteroid[] {
  /* Boss waves (every 5th) cut the asteroid count nearly in half so
   * the mothership reads as the centrepiece — too many rocks alongside
   * a 5-hit tanky boss turns the moment into noise. Non-boss waves
   * follow the classic ramp: 4 rocks at wave 1, +1 each wave, capped
   * at 8 to keep the field readable.
   *
   * Touch devices get a softer curve. Thumbs can't rotate-and-thrust
   * with the precision of arrow keys, the playfield is smaller, and
   * the on-screen pad occupies real estate at the bottom of the
   * canvas. Same boss cadence (every 3rd / 5th wave), just fewer
   * rocks at every step and a lower cap so the field stays sparse
   * enough to navigate. Touch wave 7 ≈ desktop wave 3 in density. */
  const isMothershipWave = waveNumber % 5 === 0;
  let count: number;
  if (state.isTouch) {
    count = isMothershipWave ? 3 : Math.min(2 + Math.ceil(waveNumber / 2), 5);
  } else {
    count = isMothershipWave ? 4 : Math.min(3 + waveNumber, 8);
  }
  // Shuffle a copy and take `count` so a wave gets unique-as-possible
  // labels. If `count` ever exceeds the word pool we wrap.
  const pool = [...words];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i] ?? '';
    pool[i] = pool[j] ?? '';
    pool[j] = tmp;
  }
  const result: Asteroid[] = [];
  for (let i = 0; i < count; i++) {
    const w = pool[i % pool.length] ?? '???';
    result.push(
      spawnAsteroid('lg', w, state.width, state.height, undefined, state.ship.pos),
    );
  }
  return result;
}

/* Spawn a single saucer just off-screen so it visibly enters the
 * playfield rather than popping into existence at a random interior
 * point. Vertical placement is biased to the middle 60% of the canvas
 * (0.2–0.8 of height) so saucers stay in line-of-sight rather than
 * skimming the top/bottom edges where the player has less reaction
 * time and the asteroid wrap-bands obscure the silhouette. */
function spawnSaucer(size: SaucerSize, w: number, h: number): Saucer {
  const fromLeft = Math.random() < 0.5;
  const radius = SAUCER_RADIUS[size];
  const startX = fromLeft ? -radius - 8 : w + radius + 8;
  const sp = SAUCER_SPEED[size];
  return {
    pos: { x: startX, y: rand(h * 0.2, h * 0.8) },
    vel: { x: fromLeft ? sp : -sp, y: 0 },
    size,
    radius,
    hp: SAUCER_HP[size],
    t: 0,
    /* Seed with a fraction of the full cooldown so the saucer has
     * a beat to enter the screen before opening fire — firing the
     * instant a saucer materialises off-camera would feel cheap. */
    fireCd: SAUCER_FIRE_CD[size] * 0.7,
  };
}

/* Wave-to-saucer mapping:
 *   wave % 5 === 0 → mothership (boss event) — TRUMPS the small-saucer
 *                   rule on overlapping waves (15, 30, …). The
 *                   mothership doesn't spawn here; it enters via
 *                   `buildPendingSaucer` after an INCOMING warning.
 *   wave % 3 === 0 → small saucer (mini-boss). Spawns directly with
 *                   no warning — the surprise is the point.
 *   otherwise     → no saucer, classic asteroid wave.
 *
 * Result is always an array (possibly empty) so the call site can
 * concat without a null-check branch. */
function buildSaucers(waveNumber: number, w: number, h: number): Saucer[] {
  if (waveNumber % 5 === 0) return []; // mothership comes via pendingSaucer
  if (waveNumber % 3 === 0) return [spawnSaucer('small', w, h)];
  return [];
}

/* Mothership-wave entrance, queued behind a 1.8 s warning blink at
 * the edge it'll arrive from. The wave-clear gate also waits on
 * the pending entry so the round can't roll forward without the
 * boss appearing. Returns null on non-mothership waves so the
 * call site can assign unconditionally. */
function buildPendingSaucer(
  waveNumber: number,
  h: number,
): PendingSaucer | null {
  if (waveNumber % 5 !== 0) return null;
  return {
    size: 'large',
    fromLeft: Math.random() < 0.5,
    y: rand(h * 0.2, h * 0.8),
    timer: WARNING_DURATION,
  };
}

/* Convert a pending-saucer record into a real Saucer at the
 * appropriate edge with the right initial velocity. Mirrors the
 * geometry that `spawnSaucer` uses for direct spawns so a saucer
 * that came via the warning pipeline is indistinguishable from
 * one that didn't, post-entry. */
function spawnSaucerFromPending(p: PendingSaucer, w: number): Saucer {
  const radius = SAUCER_RADIUS[p.size];
  const sp = SAUCER_SPEED[p.size];
  return {
    pos: { x: p.fromLeft ? -radius - 8 : w + radius + 8, y: p.y },
    vel: { x: p.fromLeft ? sp : -sp, y: 0 },
    size: p.size,
    radius,
    hp: SAUCER_HP[p.size],
    t: 0,
    fireCd: SAUCER_FIRE_CD[p.size] * 0.7,
  };
}

function readHighScore(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function writeHighScore(score: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    /* storage disabled — non-fatal */
  }
}

// ── Component ─────────────────────────────────────────────────────────
export function AsteroidsGame() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<State | null>(null);
  const phaseRef = useRef<Phase>('idle');
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>('idle');
  const [scoreView, setScoreView] = useState({ score: 0, high: 0, wave: 1, lives: STARTING_LIVES });

  const words = ENEMY_WORDS;

  /* Touch detection. `useCoarsePointer` is a `useSyncExternalStore`
   * over `matchMedia('(pointer: coarse)')`, so it's SSR-safe and
   * reacts to dock/undock events. We mirror it to a ref so the
   * (memo-stable) `initState` callback can read the current value
   * without taking a dep on it — re-creating initState would tear
   * down the rAF loop on every change. */
  const isTouch = useCoarsePointer();
  const isTouchRef = useRef(isTouch);
  useEffect(() => {
    isTouchRef.current = isTouch;
  }, [isTouch]);

  /* Mirror phase to a ref so the rAF loop doesn't have to dance around
   * React's stale-closure problem. */
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // ── Lifecycle ──────────────────────────────────────────────────────
  const initState = useCallback((): State | null => {
    const canvas = canvasRef.current;
    const host = wrapRef.current;
    if (!canvas || !host) return null;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = rect.width;
    const height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const theme = readTheme(host);
    const ship = freshShip(width, height);
    const stars: { pos: Vec; alpha: number }[] = [];
    const starCount = Math.round((width * height) / 9000);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        pos: { x: rand(0, width), y: rand(0, height) },
        alpha: 0.25 + Math.random() * 0.55,
      });
    }

    return {
      ship,
      bullets: [],
      asteroids: [],
      saucers: [],
      pendingSaucer: null,
      enemyBullets: [],
      particles: [],
      stars,
      score: 0,
      highScore: readHighScore(),
      lives: STARTING_LIVES,
      wave: 1,
      fireCooldown: 0,
      width,
      height,
      dpr,
      input: { left: false, right: false, thrust: false, brake: false, fire: false },
      theme,
      isTouch: isTouchRef.current,
      waveIntermission: 0,
    };
  }, []);

  const resyncHud = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    setScoreView({
      score: s.score,
      high: s.highScore,
      wave: s.wave,
      lives: s.lives,
    });
  }, []);

  const resetRound = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    // Refresh touch flag at run start so a user who docked or
    // undocked a keyboard between runs gets the right difficulty
    // curve. Asteroid count for wave 1 depends on this read.
    s.isTouch = isTouchRef.current;
    s.ship = freshShip(s.width, s.height);
    s.bullets = [];
    s.particles = [];
    s.asteroids = buildWave(s, 1, words);
    s.saucers = buildSaucers(1, s.width, s.height);
    s.pendingSaucer = buildPendingSaucer(1, s.height);
    s.enemyBullets = [];
    s.score = 0;
    s.lives = STARTING_LIVES;
    s.wave = 1;
    s.fireCooldown = 0;
    s.waveIntermission = 0;
    resyncHud();
  }, [resyncHud, words]);

  const startGame = useCallback(() => {
    if (!stateRef.current) stateRef.current = initState();
    if (!stateRef.current) return;
    resetRound();
    setPhase('playing');
  }, [initState, resetRound]);

  const togglePause = useCallback(() => {
    setPhase((p) => {
      if (p === 'playing') return 'paused';
      if (p === 'paused') return 'playing';
      return p;
    });
  }, []);

  // ── Resize ─────────────────────────────────────────────────────────
  useEffect(() => {
    const host = wrapRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width;
      const height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const s = stateRef.current;
      if (s) {
        s.width = width;
        s.height = height;
        s.dpr = dpr;
        // Re-scatter stars at the new dimensions so the field stays even.
        const starCount = Math.round((width * height) / 9000);
        s.stars = [];
        for (let i = 0; i < starCount; i++) {
          s.stars.push({
            pos: { x: rand(0, width), y: rand(0, height) },
            alpha: 0.25 + Math.random() * 0.55,
          });
        }
      } else {
        stateRef.current = initState();
        resyncHud();
      }
    });
    ro.observe(canvas);

    if (!stateRef.current) {
      stateRef.current = initState();
      resyncHud();
    }

    return () => ro.disconnect();
  }, [initState, resyncHud]);

  // ── Input ──────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent, down: boolean) {
      const s = stateRef.current;
      if (!s) return;
      const key = e.key.toLowerCase();
      const handled = (() => {
        switch (key) {
          case 'arrowleft':
          case 'a':
            s.input.left = down;
            return true;
          case 'arrowright':
          case 'd':
            s.input.right = down;
            return true;
          case 'arrowup':
          case 'w':
            s.input.thrust = down;
            return true;
          case 'arrowdown':
          case 's':
            s.input.brake = down;
            return true;
          case ' ':
          case 'spacebar':
            s.input.fire = down;
            return true;
          default:
            return false;
        }
      })();

      if (!handled) {
        if (down && key === 'p') {
          if (phaseRef.current === 'playing' || phaseRef.current === 'paused') {
            togglePause();
            e.preventDefault();
          }
          return;
        }
        if (down && (key === 'r' || key === 'enter')) {
          if (phaseRef.current === 'idle' || phaseRef.current === 'gameover') {
            startGame();
            e.preventDefault();
          }
          return;
        }
        return;
      }

      // Auto-start: any control key from idle/gameover begins a new run.
      if (
        down &&
        (phaseRef.current === 'idle' || phaseRef.current === 'gameover')
      ) {
        startGame();
      }
      // preventDefault on every game key — including ArrowDown — so the
      // browser doesn't scroll the page while the player is steering.
      e.preventDefault();
    }

    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [startGame, togglePause]);

  // ── Auto-pause on tab blur ─────────────────────────────────────────
  useEffect(() => {
    function onVisibility() {
      if (document.hidden && phaseRef.current === 'playing') {
        setPhase('paused');
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // ── Main loop ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function fire(s: State) {
      if (!s.ship.alive) return;
      if (s.bullets.length >= MAX_BULLETS) return;
      if (s.fireCooldown > 0) return;
      const sp = BULLET_SPEED;
      s.bullets.push({
        pos: { x: s.ship.pos.x, y: s.ship.pos.y },
        vel: {
          x: Math.cos(s.ship.angle) * sp + s.ship.vel.x,
          y: Math.sin(s.ship.angle) * sp + s.ship.vel.y,
        },
        life: BULLET_LIFE,
      });
      s.fireCooldown = FIRE_COOLDOWN;
    }

    function spawnDebris(s: State, at: Vec, n: number) {
      for (let i = 0; i < n; i++) {
        const ang = rand(0, TAU);
        const sp = rand(40, 180);
        s.particles.push({
          pos: { x: at.x, y: at.y },
          vel: { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp },
          life: rand(0.35, 0.7),
          max: 0.7,
        });
      }
    }

    function splitAsteroid(s: State, a: Asteroid) {
      if (a.size === 'lg') {
        for (let i = 0; i < 2; i++) {
          s.asteroids.push(spawnAsteroid('md', a.word, s.width, s.height, a.pos));
        }
      } else if (a.size === 'md') {
        for (let i = 0; i < 2; i++) {
          s.asteroids.push(spawnAsteroid('sm', a.word, s.width, s.height, a.pos));
        }
      }
    }

    function killShip(s: State) {
      if (!s.ship.alive) return;
      spawnDebris(s, s.ship.pos, 22);
      s.ship.alive = false;
      s.ship.respawnIn = RESPAWN_DELAY;
      s.lives -= 1;
      resyncHud();
      if (s.lives <= 0) {
        if (s.score > s.highScore) {
          s.highScore = s.score;
          writeHighScore(s.score);
        }
        setPhase('gameover');
      }
    }

    function update(s: State, dt: number) {
      // — Ship ────────────────────────────────────────────────────
      if (s.ship.alive) {
        if (s.input.left) s.ship.angle -= TURN_RATE * dt;
        if (s.input.right) s.ship.angle += TURN_RATE * dt;
        s.ship.thrusting = s.input.thrust;
        if (s.ship.thrusting) {
          s.ship.vel.x += Math.cos(s.ship.angle) * THRUST_ACC * dt;
          s.ship.vel.y += Math.sin(s.ship.angle) * THRUST_ACC * dt;
          // Thrust spark trail
          if (Math.random() < 0.7) {
            const back = s.ship.angle + Math.PI;
            const jitter = back + rand(-0.35, 0.35);
            s.particles.push({
              pos: {
                x: s.ship.pos.x + Math.cos(back) * 9,
                y: s.ship.pos.y + Math.sin(back) * 9,
              },
              vel: {
                x: Math.cos(jitter) * 120 + s.ship.vel.x * 0.5,
                y: Math.sin(jitter) * 120 + s.ship.vel.y * 0.5,
              },
              life: 0.32,
              max: 0.32,
            });
          }
        }
        // Drag — exponential per-second. Brake (ArrowDown / S) multiplies
        // that drag by ~6× so the player can scrub off momentum quickly
        // without needing to point-and-counter-thrust.
        const dragRate = s.input.brake ? Math.min(0.99, DRAG_PER_S * 6) : DRAG_PER_S;
        const dragFactor = Math.pow(1 - dragRate, dt);
        s.ship.vel.x *= dragFactor;
        s.ship.vel.y *= dragFactor;
        s.ship.pos.x = wrap(s.ship.pos.x + s.ship.vel.x * dt, s.width);
        s.ship.pos.y = wrap(s.ship.pos.y + s.ship.vel.y * dt, s.height);
        if (s.ship.invulnFor > 0) s.ship.invulnFor -= dt;
      } else if (s.lives > 0) {
        s.ship.respawnIn -= dt;
        if (s.ship.respawnIn <= 0) {
          /* Wait for the centre to be clear before respawning.
           * Asteroids use a 120 px buffer because they ricochet
           * randomly and clear themselves quickly. Saucers get a
           * wider 200 px buffer because they cruise at a constant
           * velocity — a mothership at the 120 px threshold
           * heading toward the spawn would drift back onto the
           * ship during the 4 s post-spawn invulnerability and
           * kill the player the instant invuln expired. */
          const centre = { x: s.width / 2, y: s.height / 2 };
          const clearOfRocks = s.asteroids.every(
            (a) => dist2(centre, a.pos) > (a.radius + 120) ** 2,
          );
          const clearOfSaucers = s.saucers.every(
            (u) => dist2(centre, u.pos) > (u.radius + 200) ** 2,
          );
          if (clearOfRocks && clearOfSaucers) {
            s.ship = freshShip(s.width, s.height);
            /* Belt-and-braces: any saucer still heading toward
             * the spawn column at respawn time gets its
             * horizontal velocity flipped so it's now moving
             * AWAY. The buffer above prevents an immediate
             * collision; this prevents the saucer from drifting
             * back through the spawn during the invuln window
             * and parking on top of the ship the moment it
             * becomes vulnerable. Visually reads as the saucer
             * being startled by the respawn flash. */
            for (const u of s.saucers) {
              const dx = u.pos.x - centre.x;
              if (u.vel.x * dx < 0) u.vel.x = -u.vel.x;
            }
            /* Also clear any saucer-fired bullets that would hit
             * the spawn point within the invuln window — those
             * already-in-flight projectiles ignore the saucer's
             * "don't fire at invuln ships" gate and could outlive
             * invuln if a bullet was launched at the player's
             * last position just before they died. Sweep is
             * scoped to bullets aimed roughly at the centre so
             * we don't wipe shots that were going to miss
             * anyway. */
            s.enemyBullets = s.enemyBullets.filter((b) => {
              const projX = b.pos.x + b.vel.x * INVULN_AFTER_SPAWN;
              const projY = b.pos.y + b.vel.y * INVULN_AFTER_SPAWN;
              const swept = Math.min(
                dist2(b.pos, centre),
                dist2({ x: projX, y: projY }, centre),
              );
              return swept > (SHIP_RADIUS + 60) ** 2;
            });
          }
        }
      }

      // — Bullets ─────────────────────────────────────────────────
      s.fireCooldown = Math.max(0, s.fireCooldown - dt);
      if (s.input.fire) fire(s);
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        if (!b) continue;
        b.life -= dt;
        if (b.life <= 0) {
          s.bullets.splice(i, 1);
          continue;
        }
        b.pos.x = wrap(b.pos.x + b.vel.x * dt, s.width);
        b.pos.y = wrap(b.pos.y + b.vel.y * dt, s.height);
      }

      // — Asteroids ──────────────────────────────────────────────
      for (const a of s.asteroids) {
        a.pos.x = wrap(a.pos.x + a.vel.x * dt, s.width);
        a.pos.y = wrap(a.pos.y + a.vel.y * dt, s.height);
        a.angle += a.spin * dt;
      }

      // — Pending mothership entry ───────────────────────────────
      // Tick down the warning timer; when it hits zero, materialise
      // the saucer at the chosen edge and clear the pending slot.
      // Doing this BEFORE the saucer motion pass means the newly
      // arrived mothership gets a position step on its very first
      // frame (slides into view) rather than spawning frozen.
      if (s.pendingSaucer) {
        s.pendingSaucer.timer -= dt;
        if (s.pendingSaucer.timer <= 0) {
          s.saucers.push(spawnSaucerFromPending(s.pendingSaucer, s.width));
          s.pendingSaucer = null;
        }
      }

      // — Saucers ────────────────────────────────────────────────
      // Small saucers zigzag vertically with a fast sine (~0.8 Hz, ±80
      // px/s peak) — readable as "darting" without becoming
      // unpredictable. Motherships drift on a slow, low-amplitude bob
      // (±25 px/s) so they read as a deliberate sweep across the
      // playfield. Both wrap on both axes so a boss can't permanently
      // escape — important because the wave-clear gate waits on them.
      //
      // Saucers also fire at the ship — fireCd ticks down each frame
      // and on ≤0 the saucer emits an EnemyBullet aimed at the ship
      // with size-dependent scatter, then the cooldown resets. Two
      // gates suppress firing:
      //   • ship is not alive  → no target.
      //   • ship is invulnerable (post-respawn) → respect the
      //     respite so a parked mothership can't trickle bullets
      //     onto the spawn point and immediately kill the player
      //     the moment invuln ends. Keeps the post-respawn 4 s
      //     genuinely safe.
      const shipFireable =
        s.ship.alive && s.ship.invulnFor <= 0;
      for (const u of s.saucers) {
        u.t += dt;
        u.pos.x += u.vel.x * dt;
        if (u.size === 'small') {
          u.pos.y += Math.sin(u.t * 5) * 80 * dt;
        } else {
          u.pos.y += Math.sin(u.t * 1.2) * 25 * dt;
        }
        u.pos.x = wrap(u.pos.x, s.width);
        u.pos.y = wrap(u.pos.y, s.height);

        u.fireCd -= dt;
        if (u.fireCd <= 0 && shipFireable) {
          const dx = s.ship.pos.x - u.pos.x;
          const dy = s.ship.pos.y - u.pos.y;
          const baseA = Math.atan2(dy, dx);
          const scatter =
            (Math.random() - 0.5) * 2 * SAUCER_SHOT_SCATTER[u.size];
          const a = baseA + scatter;
          s.enemyBullets.push({
            pos: { x: u.pos.x, y: u.pos.y },
            vel: {
              x: Math.cos(a) * SAUCER_SHOT_SPEED,
              y: Math.sin(a) * SAUCER_SHOT_SPEED,
            },
            life: SAUCER_SHOT_LIFE,
          });
          u.fireCd = SAUCER_FIRE_CD[u.size];
        } else if (u.fireCd <= 0) {
          /* Even when fire is suppressed (ship dead/invuln), keep
           * the cooldown floored at a tiny positive value so the
           * next fire-ready frame after the gate opens doesn't
           * spray a backlog of pent-up shots. */
          u.fireCd = 0.3;
        }
      }

      // — Enemy bullets ──────────────────────────────────────────
      // Same lifecycle as player bullets: tick life, wrap position,
      // remove on expiry. Saucer fire keeps flying after the saucer
      // dies, which gives kills a satisfying "last gasp" beat.
      for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
        const b = s.enemyBullets[i];
        if (!b) continue;
        b.life -= dt;
        if (b.life <= 0) {
          s.enemyBullets.splice(i, 1);
          continue;
        }
        b.pos.x = wrap(b.pos.x + b.vel.x * dt, s.width);
        b.pos.y = wrap(b.pos.y + b.vel.y * dt, s.height);
      }

      // — Particles ───────────────────────────────────────────────
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        if (!p) continue;
        p.life -= dt;
        if (p.life <= 0) {
          s.particles.splice(i, 1);
          continue;
        }
        p.pos.x += p.vel.x * dt;
        p.pos.y += p.vel.y * dt;
        // Mild drift damping so debris doesn't streak forever
        p.vel.x *= 0.985;
        p.vel.y *= 0.985;
      }

      // — Collisions: bullets × asteroids ─────────────────────────
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        if (!b) continue;
        for (let j = s.asteroids.length - 1; j >= 0; j--) {
          const a = s.asteroids[j];
          if (!a) continue;
          if (dist2(b.pos, a.pos) <= a.radius * a.radius) {
            s.bullets.splice(i, 1);
            s.asteroids.splice(j, 1);
            s.score += ASTEROID_SCORE[a.size];
            if (s.score > s.highScore) s.highScore = s.score;
            spawnDebris(s, a.pos, a.size === 'lg' ? 14 : a.size === 'md' ? 9 : 6);
            splitAsteroid(s, a);
            resyncHud();
            break;
          }
        }
      }

      // — Collisions: bullets × saucers ───────────────────────────
      // Multi-hit motherships use the same dist² check but decrement HP
      // instead of dying on first contact. A non-lethal hit still
      // consumes the bullet (so the player has to land the shots) and
      // spawns a tiny "hit flash" debris burst at the bullet's
      // position for tactile feedback. Lethal hits award the full
      // boss-tier score and spawn a larger debris cloud at the
      // saucer's centre.
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        if (!b) continue;
        for (let j = s.saucers.length - 1; j >= 0; j--) {
          const u = s.saucers[j];
          if (!u) continue;
          if (dist2(b.pos, u.pos) <= u.radius * u.radius) {
            s.bullets.splice(i, 1);
            u.hp -= 1;
            if (u.hp <= 0) {
              s.saucers.splice(j, 1);
              s.score += SAUCER_SCORE[u.size];
              if (s.score > s.highScore) s.highScore = s.score;
              spawnDebris(s, u.pos, u.size === 'large' ? 26 : 12);
              resyncHud();
            } else {
              // Hit flash — small sparks at the bullet impact, not the
              // saucer centre, so the player sees WHERE they hit.
              spawnDebris(s, b.pos, 4);
            }
            break;
          }
        }
      }

      // — Collisions: ship × asteroids ────────────────────────────
      if (s.ship.alive && s.ship.invulnFor <= 0) {
        for (const a of s.asteroids) {
          const r = a.radius + SHIP_RADIUS;
          if (dist2(s.ship.pos, a.pos) <= r * r) {
            killShip(s);
            break;
          }
        }
      }

      // — Collisions: ship × saucers ──────────────────────────────
      if (s.ship.alive && s.ship.invulnFor <= 0) {
        for (const u of s.saucers) {
          const r = u.radius + SHIP_RADIUS;
          if (dist2(s.ship.pos, u.pos) <= r * r) {
            killShip(s);
            break;
          }
        }
      }

      // — Collisions: enemy bullets × ship ────────────────────────
      // Invulnerability after respawn fully blocks enemy fire — the
      // bullet still flies past (no splice) so the player can see
      // where shots are coming from during the safe window. Once
      // invuln ends, the next collision pass eats the ship.
      if (s.ship.alive && s.ship.invulnFor <= 0) {
        for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
          const b = s.enemyBullets[i];
          if (!b) continue;
          if (dist2(b.pos, s.ship.pos) <= SHIP_RADIUS * SHIP_RADIUS) {
            s.enemyBullets.splice(i, 1);
            killShip(s);
            break;
          }
        }
      }

      // — Next wave when board is cleared ─────────────────────────
      // ALL three must be empty: asteroids cleared, saucers cleared,
      // AND no pending mothership entrance still in its warning
      // countdown. Otherwise the wave could roll forward while the
      // INCOMING marker is still on screen — making the boss arrive
      // mid-next-wave instead of as the wave's headlining event.
      //
      // Two-phase progression so the next wave doesn't slam in
      // instantly:
      //   1. Board clear + no active intermission + still alive
      //      → bump wave number, start the WAVE_INTERMISSION_DURATION
      //        timer, sync the HUD. No enemies yet — `drawWaveIntermission`
      //        renders the "Get Ready · Wave N" overlay during this beat.
      //   2. Intermission expires (timer ≤ 0) → spawn the new wave's
      //      asteroids / saucers / pending mothership. Wave number is
      //      already correct from step 1.
      // The `s.lives > 0` gate keeps the timer from firing on the
      // same frame the player loses their last life (wave-clear and
      // gameover would otherwise race). `phaseRef.current` is still
      // 'playing' inside that frame because React's setPhase commit
      // hasn't propagated yet — so we belt-and-braces with the lives
      // check too.
      const boardClear =
        s.asteroids.length === 0 &&
        s.saucers.length === 0 &&
        !s.pendingSaucer;

      if (s.waveIntermission > 0) {
        s.waveIntermission = Math.max(0, s.waveIntermission - dt);
        if (s.waveIntermission === 0 && boardClear) {
          s.asteroids = buildWave(s, s.wave, words);
          s.saucers = buildSaucers(s.wave, s.width, s.height);
          s.pendingSaucer = buildPendingSaucer(s.wave, s.height);
        }
      } else if (boardClear && s.lives > 0) {
        s.wave += 1;
        s.waveIntermission = WAVE_INTERMISSION_DURATION;
        resyncHud();
      }
    }

    // ── Render ───────────────────────────────────────────────────
    function drawPolygon(
      g: CanvasRenderingContext2D,
      pos: Vec,
      angle: number,
      shape: number[],
      radius: number,
    ) {
      g.beginPath();
      for (let i = 0; i < shape.length; i++) {
        const t = (i / shape.length) * TAU;
        const r = (shape[i] ?? 1) * radius;
        const x = pos.x + Math.cos(t + angle) * r;
        const y = pos.y + Math.sin(t + angle) * r;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.stroke();
    }

    function drawShip(g: CanvasRenderingContext2D, s: State) {
      if (!s.ship.alive) return;

      /* Smooth sin-wave opacity during the post-respawn invuln window —
       * reads as a pulsing shield instead of a hard strobe. Also draw a
       * faint concentric ring at the same rhythm so the protection
       * feels diegetic, not just "the sprite is flickering." */
      const inv = s.ship.invulnFor;
      const shielded = inv > 0;
      const pulse = shielded ? 0.45 + 0.55 * Math.abs(Math.sin(inv * 6)) : 1;

      const { pos, angle, thrusting } = s.ship;
      g.save();
      g.translate(pos.x, pos.y);

      if (shielded) {
        g.save();
        g.globalAlpha = 0.3 + 0.4 * Math.abs(Math.sin(inv * 6));
        g.strokeStyle = s.theme.accent;
        g.lineWidth = 1;
        g.beginPath();
        g.arc(0, 0, 18, 0, TAU);
        g.stroke();
        g.restore();
      }

      g.globalAlpha = pulse;
      g.rotate(angle);
      g.lineWidth = 1.5;
      g.strokeStyle = s.theme.accent;
      g.beginPath();
      g.moveTo(14, 0);
      g.lineTo(-10, 8);
      g.lineTo(-6, 0);
      g.lineTo(-10, -8);
      g.closePath();
      g.stroke();
      if (thrusting) {
        g.beginPath();
        g.moveTo(-6, 4);
        g.lineTo(-14 - Math.random() * 6, 0);
        g.lineTo(-6, -4);
        g.stroke();
      }
      g.restore();
      g.globalAlpha = 1;
    }

    /* Mid-game "you're dead, hang on" notice — drawn on the canvas
     * (not React) so it doesn't trigger a re-render and so it sits
     * inside the same dark space the player has been looking at.
     * Only shown while a respawn is pending and lives remain;
     * gameover (lives = 0) uses the React overlay instead.
     *
     * Two-phase subline:
     *   1. respawnIn > 0   →  "1.4s · 2 LIVES REMAINING"
     *   2. respawnIn ≤ 0   →  "WAITING FOR CLEAR · 2 LIVES REMAINING"
     * The second phase happens because the respawn waits for asteroids
     * to vacate the centre before placing the new ship. Without copy,
     * the player thinks the game is frozen. */
    function drawRespawnNotice(g: CanvasRenderingContext2D, s: State) {
      if (s.ship.alive || s.lives <= 0) return;
      const cx = s.width / 2;
      const cy = s.height / 2;
      const t = s.ship.respawnIn;
      const livesWord = s.lives === 1 ? 'LIFE' : 'LIVES';
      const status = t > 0 ? `${t.toFixed(1)}s` : 'WAITING FOR CLEAR';

      g.save();
      g.textAlign = 'center';

      g.fillStyle = s.theme.accent;
      g.font = `500 11px var(--mono), ui-monospace, monospace`;
      g.fillText('SHIELD DOWN', cx, cy - 28);

      g.fillStyle = s.theme.fg;
      g.font = `500 36px var(--font-display), ui-sans-serif, sans-serif`;
      g.fillText('Respawning…', cx, cy + 8);

      g.fillStyle = s.theme.fg2;
      g.font = `500 12px var(--mono), ui-monospace, monospace`;
      g.fillText(`${status} · ${s.lives} ${livesWord} REMAINING`, cx, cy + 30);

      g.restore();
    }

    function drawAsteroid(g: CanvasRenderingContext2D, s: State, a: Asteroid) {
      g.lineWidth = a.size === 'sm' ? 1 : 1.25;
      g.strokeStyle = s.theme.fg2;
      drawPolygon(g, a.pos, a.angle, a.shape, a.radius);
      // Word label, scaled to the asteroid size; never on tiny shards.
      if (a.size !== 'sm') {
        const fs = a.size === 'lg' ? 13 : 10;
        g.save();
        g.translate(a.pos.x, a.pos.y);
        g.fillStyle = s.theme.fg;
        g.font = `500 ${fs}px var(--mono), ui-monospace, monospace`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        // Keep the word upright regardless of asteroid rotation.
        g.fillText(a.word.toUpperCase(), 0, 0);
        g.restore();
      }
    }

    /* Wireframe saucer in the classic Atari Asteroids silhouette:
     * a flattened hexagon for the body, a trapezoidal dome on top, and
     * a mid-line through the body. The mothership scales every
     * dimension up ~2.5×, adds three "window" pips inside the dome,
     * and renders in the accent color so it visually stands apart from
     * both the small saucer and the muted asteroid field. Above the
     * mothership we draw a pip row that doubles as an HP bar (filled
     * = remaining hit, hollow = consumed). */
    function drawSaucer(g: CanvasRenderingContext2D, s: State, u: Saucer) {
      const isLg = u.size === 'large';
      const bw = isLg ? 72 : 28; // body width
      const bh = isLg ? 16 : 7; // body height
      const dw = isLg ? 36 : 14; // dome width
      const dh = isLg ? 14 : 5; // dome height
      g.save();
      g.translate(u.pos.x, u.pos.y);
      g.strokeStyle = isLg ? s.theme.accent : s.theme.fg2;
      g.lineWidth = isLg ? 1.75 : 1.25;
      // Body: flattened hex (looks like a stretched diamond)
      g.beginPath();
      g.moveTo(-bw / 2, 0);
      g.lineTo(-bw / 4, -bh / 2);
      g.lineTo(bw / 4, -bh / 2);
      g.lineTo(bw / 2, 0);
      g.lineTo(bw / 4, bh / 2);
      g.lineTo(-bw / 4, bh / 2);
      g.closePath();
      g.stroke();
      // Mid-line through the body (the classic equator detail)
      g.beginPath();
      g.moveTo(-bw / 2, 0);
      g.lineTo(bw / 2, 0);
      g.stroke();
      // Dome: trapezoid sitting on the body's top edge
      g.beginPath();
      g.moveTo(-dw / 2, -bh / 2);
      g.lineTo(-dw / 3, -bh / 2 - dh);
      g.lineTo(dw / 3, -bh / 2 - dh);
      g.lineTo(dw / 2, -bh / 2);
      g.stroke();
      if (isLg) {
        // Three "window" pips in the dome — pure flavour, only on the
        // mothership where there's room for them.
        g.fillStyle = s.theme.accent;
        for (let k = -1; k <= 1; k++) {
          g.beginPath();
          g.arc(k * 9, -bh / 2 - dh / 2, 1.6, 0, TAU);
          g.fill();
        }
        // HP pips above the dome: 5 slots, filled = alive, outline =
        // hits taken. Reads as a health bar without leaving the canvas
        // aesthetic.
        const max = SAUCER_HP.large;
        const pipW = 5;
        const pipH = 3;
        const gap = 3;
        const totalW = max * pipW + (max - 1) * gap;
        const y = -bh / 2 - dh - 9;
        for (let k = 0; k < max; k++) {
          const x = -totalW / 2 + k * (pipW + gap);
          if (k < u.hp) {
            g.fillStyle = s.theme.accent;
            g.fillRect(x, y, pipW, pipH);
          } else {
            g.strokeStyle = s.theme.muted;
            g.lineWidth = 1;
            g.strokeRect(x + 0.5, y + 0.5, pipW - 1, pipH - 1);
          }
        }
      }
      g.restore();
    }

    function drawBullets(g: CanvasRenderingContext2D, s: State) {
      g.strokeStyle = s.theme.accent;
      g.lineWidth = 2;
      g.beginPath();
      for (const b of s.bullets) {
        const tx = b.pos.x - b.vel.x * 0.012;
        const ty = b.pos.y - b.vel.y * 0.012;
        g.moveTo(tx, ty);
        g.lineTo(b.pos.x, b.pos.y);
      }
      g.stroke();
    }

    /* Mothership entry warning — a pulsing chevron at the edge the
     * boss will emerge from, with an "INCOMING" label inboard of
     * the arrow. The blink is a sine wave on the warning timer
     * (so all three warning frames share a single phase that
     * accelerates as the timer drains, raising urgency near
     * spawn-time). Rendered in the accent color so it matches the
     * mothership it's announcing. */
    function drawWarning(g: CanvasRenderingContext2D, s: State) {
      const p = s.pendingSaucer;
      if (!p) return;
      // Pulse alpha: 0.35..1.0, ~5 Hz, biased high so the marker is
      // always readable rather than dimming to invisibility.
      const elapsed = WARNING_DURATION - p.timer;
      const freq = 5 + elapsed * 1.5; // accelerate as spawn approaches
      const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(elapsed * freq * TAU));
      const dir = p.fromLeft ? 1 : -1;
      const edgeX = p.fromLeft ? 18 : s.width - 18;
      const y = p.y;
      g.save();
      g.globalAlpha = blink;
      g.fillStyle = s.theme.accent;
      g.strokeStyle = s.theme.accent;
      // Filled triangle pointing into the playfield
      g.beginPath();
      g.moveTo(edgeX, y - 11);
      g.lineTo(edgeX + dir * 20, y);
      g.lineTo(edgeX, y + 11);
      g.closePath();
      g.fill();
      // "INCOMING" label — sits inboard of the arrow with mono caps
      // for the techy / klaxon feel.
      g.font = `600 11px var(--mono), ui-monospace, monospace`;
      g.textAlign = p.fromLeft ? 'left' : 'right';
      g.textBaseline = 'middle';
      g.fillText('INCOMING', edgeX + dir * 28, y);
      g.restore();
    }

    /* Enemy fire — rendered as hollow rings in the accent color
     * with a short trailing line behind them. The ring silhouette
     * (vs the player's streak) makes incoming projectiles instantly
     * readable as "danger" even at small sizes, and the trailing
     * line gives motion direction so the player can predict where a
     * shot is heading and dodge it. */
    function drawEnemyBullets(g: CanvasRenderingContext2D, s: State) {
      g.strokeStyle = s.theme.accent;
      g.lineWidth = 1.5;
      for (const b of s.enemyBullets) {
        // Motion trail (short streak behind the ring)
        const tx = b.pos.x - b.vel.x * 0.025;
        const ty = b.pos.y - b.vel.y * 0.025;
        g.beginPath();
        g.moveTo(tx, ty);
        g.lineTo(b.pos.x, b.pos.y);
        g.stroke();
        // Ring at the bullet's current position
        g.beginPath();
        g.arc(b.pos.x, b.pos.y, 3, 0, TAU);
        g.stroke();
      }
    }

    function drawParticles(g: CanvasRenderingContext2D, s: State) {
      for (const p of s.particles) {
        const alpha = Math.max(0, p.life / p.max);
        g.strokeStyle = `rgba(255, 91, 31, ${alpha})`;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(p.pos.x, p.pos.y);
        g.lineTo(p.pos.x - p.vel.x * 0.014, p.pos.y - p.vel.y * 0.014);
        g.stroke();
      }
    }

    function drawStars(g: CanvasRenderingContext2D, s: State) {
      g.fillStyle = s.theme.muted2;
      for (const star of s.stars) {
        g.globalAlpha = star.alpha;
        g.fillRect(star.pos.x, star.pos.y, 1, 1);
      }
      g.globalAlpha = 1;
    }

    /* Inter-wave "Get Ready" overlay, drawn over an empty playfield
     * while `state.waveIntermission` ticks down. Mirrors the typographic
     * hierarchy of the respawn notice (mono eyebrow + display headline +
     * mono detail) so the two read as siblings instead of two competing
     * design languages.
     *
     * Layered behaviour:
     *   • Skipped while the ship is dead — `drawRespawnNotice` owns the
     *     centre of the screen during that arc and is the more urgent
     *     message ("Respawning… 2 LIVES REMAINING"), so we step aside.
     *   • Boss waves (wave % 5 === 0) swap the headline color to the
     *     accent and add a "MOTHERSHIP DETECTED" subtitle — the boss
     *     pendingSaucer warning at the canvas edge then takes over
     *     after the intermission ends.
     *
     * Fade envelope: a 0.3s ease in / 0.3s ease out at each end of the
     * 1.8s window, solid in the middle. Smooth enough that the text
     * doesn't pop, fast enough that the player isn't left waiting for
     * a logo animation. */
    function drawWaveIntermission(g: CanvasRenderingContext2D, s: State) {
      if (s.waveIntermission <= 0) return;
      if (!s.ship.alive) return;

      const FADE = 0.3;
      const elapsed = WAVE_INTERMISSION_DURATION - s.waveIntermission;
      const remaining = s.waveIntermission;
      let alpha = 1;
      if (elapsed < FADE) alpha = elapsed / FADE;
      else if (remaining < FADE) alpha = remaining / FADE;

      const cx = s.width / 2;
      const cy = s.height / 2;
      const isBossWave = s.wave % 5 === 0;

      g.save();
      g.globalAlpha = alpha;
      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';

      g.fillStyle = s.theme.muted;
      g.font = `500 11px var(--mono), ui-monospace, monospace`;
      g.fillText(`WAVE ${s.wave.toString().padStart(2, '0')}`, cx, cy - 28);

      g.fillStyle = isBossWave ? s.theme.accent : s.theme.fg;
      g.font = `500 36px var(--font-display), ui-sans-serif, sans-serif`;
      g.fillText('GET READY', cx, cy + 8);

      if (isBossWave) {
        g.fillStyle = s.theme.accent;
        g.font = `600 11px var(--mono), ui-monospace, monospace`;
        g.fillText('MOTHERSHIP DETECTED', cx, cy + 30);
      }

      g.restore();
    }

    function render(s: State) {
      if (!ctx) return;
      const w = s.width;
      const h = s.height;
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      ctx.fillStyle = s.theme.bg;
      ctx.fillRect(0, 0, w, h);
      drawStars(ctx, s);
      drawParticles(ctx, s);
      for (const a of s.asteroids) drawAsteroid(ctx, s, a);
      for (const u of s.saucers) drawSaucer(ctx, s, u);
      drawWarning(ctx, s);
      drawEnemyBullets(ctx, s);
      drawBullets(ctx, s);
      drawShip(ctx, s);
      drawWaveIntermission(ctx, s);
      drawRespawnNotice(ctx, s);
    }

    function frame(now: number) {
      const s = stateRef.current;
      if (!s) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }
      const last = lastTimeRef.current || now;
      // Cap dt at 1/30 so tab-resumes / breakpoints don't tunnel the
      // ship through every asteroid in one step.
      const dt = Math.min((now - last) / 1000, 1 / 30);
      lastTimeRef.current = now;

      if (phaseRef.current === 'playing') update(s, dt);
      render(s);

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [resyncHud, words]);

  // ── Touch buttons ──────────────────────────────────────────────────
  const touchHandler = useCallback(
    (key: keyof Input, down: boolean) => (e: React.PointerEvent) => {
      const s = stateRef.current;
      if (!s) return;
      e.preventDefault();
      s.input[key] = down;
      if (
        down &&
        (phaseRef.current === 'idle' || phaseRef.current === 'gameover')
      ) {
        startGame();
      }
    },
    [startGame],
  );

  /* Pointer-down on the canvas:
   *   • idle / gameover → start a new run
   *   • playing         → press the fire input (will be released on pointer
   *                       up). Holding the mouse button down behaves the
   *                       same way as holding Space — bullets stream out
   *                       on the FIRE_COOLDOWN cadence.
   * Pointer-up always releases the virtual fire button. The handlers are
   * bound directly on the canvas element so they don't fight the body
   * touch-action setup or the global keyboard listeners. */
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (phaseRef.current === 'idle' || phaseRef.current === 'gameover') {
        startGame();
        return;
      }
      const s = stateRef.current;
      if (s && phaseRef.current === 'playing') {
        s.input.fire = true;
      }
    },
    [startGame],
  );

  const handleCanvasPointerUp = useCallback(() => {
    const s = stateRef.current;
    if (s) s.input.fire = false;
  }, []);

  // ── UI ─────────────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} className={styles.wrap}>
      <div className={styles.stage}>
        <div className={styles.hud}>
          <div className={styles.hudLeft}>
            <span className={styles.hudLabel}>Score</span>
            <span className={styles.hudValue}>
              {scoreView.score.toString().padStart(5, '0')}
            </span>
          </div>
          <div className={styles.hudCenter}>
            <span className={styles.hudLabel}>Wave</span>
            <span className={styles.hudValue}>
              {scoreView.wave.toString().padStart(2, '0')}
            </span>
          </div>
          <div className={styles.hudRight}>
            <span className={styles.hudLabel}>Best</span>
            <span className={styles.hudValue}>
              {scoreView.high.toString().padStart(5, '0')}
            </span>
            <span
              className={styles.hudShips}
              aria-label={`${scoreView.lives} lives remaining`}
            >
              {Array.from({ length: scoreView.lives }, (_, i) => (
                <span key={i} className={styles.hudShip} aria-hidden="true" />
              ))}
            </span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className={styles.canvas}
          aria-label="Asteroids minigame canvas"
          onPointerDown={handleCanvasPointerDown}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerUp}
        />

        {phase !== 'playing' && (
          <div className={styles.overlay} role="dialog" aria-live="polite">
            {phase === 'idle' && (
              <div className={styles.overlayCard}>
                <p className={styles.overlayEyebrow}>
                  Error 404 · Uncharted space
                </p>
                <h2 className={styles.overlayTitle}>
                  You&apos;ve drifted into uncharted space.
                </h2>
                <p className={styles.overlayLede}>
                  The URL you tried to reach isn&apos;t on any chart. Your
                  craft has drifted into a belt of everyday annoyances —
                  scope creep, AI slop, lens flare, Comic Sans, every
                  shortcut a careful project pushes back on. Blast through.
                  Survive the field. The way home returns as you clear.
                </p>
                <button
                  type="button"
                  className={styles.overlayBtn}
                  onClick={startGame}
                  data-cursor="link"
                  data-cursor-label="Engage"
                >
                  Engage thrusters
                </button>
                <p className={styles.overlayFootnote}>
                  Arrow keys, Space, or click the canvas to begin.
                </p>
              </div>
            )}
            {phase === 'paused' && (
              <div className={styles.overlayCard}>
                <p className={styles.overlayEyebrow}>Drift halted</p>
                <h2 className={styles.overlayTitle}>Paused</h2>
                <button
                  type="button"
                  className={styles.overlayBtn}
                  onClick={togglePause}
                  data-cursor="link"
                  data-cursor-label="Resume"
                >
                  Resume
                </button>
                <p className={styles.overlayFootnote}>P to resume</p>
              </div>
            )}
            {phase === 'gameover' && (
              <div className={styles.overlayCard}>
                <p className={styles.overlayEyebrow}>Signal lost</p>
                <h2 className={styles.overlayTitle}>
                  {scoreView.score >= scoreView.high && scoreView.score > 0
                    ? 'You charted further.'
                    : 'Caught in the drift.'}
                </h2>
                <p className={styles.overlayLede}>
                  {scoreView.score >= scoreView.high && scoreView.score > 0
                    ? 'New personal best — you charted further into the belt than before.'
                    : 'The belt closed in. The field resets for another pass.'}
                </p>
                <p className={styles.overlayScore} aria-label="Score summary">
                  <span className={styles.overlayScoreLabel}>Run</span>
                  <span className={styles.overlayScoreValue}>
                    {scoreView.score.toString().padStart(5, '0')}
                  </span>
                  <span className={styles.overlayScoreSep} aria-hidden="true">
                    ·
                  </span>
                  <span className={styles.overlayScoreLabel}>Best</span>
                  <span className={styles.overlayScoreValue}>
                    {scoreView.high.toString().padStart(5, '0')}
                  </span>
                </p>
                <button
                  type="button"
                  className={styles.overlayBtn}
                  onClick={startGame}
                  data-cursor="link"
                  data-cursor-label="Retry"
                >
                  Re-engage
                </button>
                <p className={styles.overlayFootnote}>
                  Or step out of the drift below.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Touch controls — only render on coarse pointers (CSS handles
         * the media query toggle). Keeps the desktop look clean. */}
        <div className={styles.touchPad} aria-hidden="true">
          <button
            type="button"
            className={styles.touchBtn}
            onPointerDown={touchHandler('left', true)}
            onPointerUp={touchHandler('left', false)}
            onPointerCancel={touchHandler('left', false)}
            onPointerLeave={touchHandler('left', false)}
          >
            ◀
          </button>
          <button
            type="button"
            className={styles.touchBtn}
            onPointerDown={touchHandler('right', true)}
            onPointerUp={touchHandler('right', false)}
            onPointerCancel={touchHandler('right', false)}
            onPointerLeave={touchHandler('right', false)}
          >
            ▶
          </button>
          <button
            type="button"
            className={`${styles.touchBtn} ${styles.touchBtnAccent}`}
            onPointerDown={touchHandler('thrust', true)}
            onPointerUp={touchHandler('thrust', false)}
            onPointerCancel={touchHandler('thrust', false)}
            onPointerLeave={touchHandler('thrust', false)}
          >
            ▲
          </button>
          <button
            type="button"
            className={`${styles.touchBtn} ${styles.touchBtnAccent}`}
            onPointerDown={touchHandler('fire', true)}
            onPointerUp={touchHandler('fire', false)}
            onPointerCancel={touchHandler('fire', false)}
            onPointerLeave={touchHandler('fire', false)}
          >
            ●
          </button>
        </div>
      </div>

      {/* Persistent control strip — always visible, mirrors what the
       * keyboard handler accepts. Each key shape uses <kbd> for the right
       * default semantics; screen readers will read out "rotate left,
       * rotate right" etc. via the surrounding labels. Hidden on coarse
       * pointers since the on-screen touch pad covers the same actions. */}
      <ul className={styles.controlStrip} aria-label="Game controls">
        <li className={styles.controlItem}>
          <span className={styles.controlKeys}>
            <kbd className={styles.kbd}>←</kbd>
            <kbd className={styles.kbd}>→</kbd>
          </span>
          <span className={styles.controlLabel}>Rotate</span>
        </li>
        <li className={styles.controlItem}>
          <span className={styles.controlKeys}>
            <kbd className={styles.kbd}>↑</kbd>
          </span>
          <span className={styles.controlLabel}>Thrust</span>
        </li>
        <li className={styles.controlItem}>
          <span className={styles.controlKeys}>
            <kbd className={styles.kbd}>↓</kbd>
          </span>
          <span className={styles.controlLabel}>Brake</span>
        </li>
        <li className={styles.controlItem}>
          <span className={styles.controlKeys}>
            <kbd className={`${styles.kbd} ${styles.kbdWide}`}>Space</kbd>
            <span className={styles.controlOr}>or</span>
            <kbd className={`${styles.kbd} ${styles.kbdWide}`}>Click</kbd>
          </span>
          <span className={styles.controlLabel}>Fire</span>
        </li>
        <li className={styles.controlItem}>
          <span className={styles.controlKeys}>
            <kbd className={styles.kbd}>P</kbd>
          </span>
          <span className={styles.controlLabel}>Pause</span>
        </li>
      </ul>
    </div>
  );
}
