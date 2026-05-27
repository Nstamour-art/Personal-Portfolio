'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

const HIGH_SCORE_KEY = 'nsa.lost-in-space.hs';

/* Asteroid labels — anti-patterns and craft-killers across motion / 3D /
 * illustration / AI workflows / code / process. Picked from a long pool
 * at spawn time so wave-to-wave variety is high; children of a split
 * asteroid inherit the parent's word (classic Asteroids feel), which
 * means "SCOPE CREEP" breaks into smaller "SCOPE CREEP" shards.
 *
 * Curation rule: every entry should read as "this person knows what's
 * bad and avoids it" — i.e. craft signals. Avoid anything that could
 * land as anti-collaboration (Meetings, Revisions), anti-client (Bad
 * brief), anti-business (Pivot), or anti-personal-wellbeing (Burnout,
 * Crunch). The list should make a hiring manager nod, not wince.
 *
 * Words are kept short enough to fit a medium asteroid (~10 chars at
 * 10px mono) without being trimmed by the renderer. */
const ENEMY_WORDS = [
  // Process / strategy
  'Scope creep',
  'Cargo cult',
  'Buzzword',
  'Synergy',
  // Code
  'Tech debt',
  'Boilerplate',
  'Spaghetti',
  'Hotfix',
  'Friday deploy',
  'Merge conflict',
  'Yak shave',
  // AI workflows
  'AI slop',
  'Hallucination',
  // Motion
  'Linear easing',
  // 3D
  'N-gon',
  // Illustration / design
  'Stock photo',
  'Auto-trace',
  'Lorem ipsum',
  'Lens flare',
  'Comic Sans',
  'Bevel',
  'Beige',
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
  const count = Math.min(3 + waveNumber, 8);
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
    s.ship = freshShip(s.width, s.height);
    s.bullets = [];
    s.particles = [];
    s.asteroids = buildWave(s, 1, words);
    s.score = 0;
    s.lives = STARTING_LIVES;
    s.wave = 1;
    s.fireCooldown = 0;
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
          // Wait for the centre to be clear before respawning.
          const centre = { x: s.width / 2, y: s.height / 2 };
          const clear = s.asteroids.every(
            (a) => dist2(centre, a.pos) > (a.radius + 120) ** 2,
          );
          if (clear) {
            s.ship = freshShip(s.width, s.height);
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

      // — Next wave when board is cleared ─────────────────────────
      if (s.asteroids.length === 0) {
        s.wave += 1;
        s.asteroids = buildWave(s, s.wave, words);
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
      drawBullets(ctx, s);
      drawShip(ctx, s);
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
                  craft has drifted into a belt of pipeline anti-patterns —
                  scope creep, AI slop, lens flare, linear easing, every
                  shortcut a careful pipeline pushes back on. Blast through.
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
