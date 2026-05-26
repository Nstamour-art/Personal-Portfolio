// admin-theme.jsx — Theme editor for the admin panel.
//
// Edits window.THEME (colors, fonts, display preferences) and triggers
// applyTheme() on every change so the live preview updates immediately.
//
// Sections:
//   - Accent — pick from curated swatches or paste a hex
//   - Surface palette — bg / surface / line / muted scale
//   - Foreground — fg / fg-2 / muted / muted-2
//   - Type — font preset picker + raw font stack editor
//   - Display preferences — caps headings toggle

function ThemeEditor() {
  const [, force] = React.useReducer((v) => v + 1, 0);
  const theme = window.THEME;

  const set = (key, val) => {
    window.THEME = { ...window.THEME, [key]: val };
    window.applyTheme();
    force();
  };

  const applyFontPreset = (preset) => {
    window.THEME = {
      ...window.THEME,
      sans: preset.sans,
      mono: preset.mono,
    };
    window.applyTheme();
    force();
  };

  const resetTheme = () => {
    if (!confirm("Reset theme to defaults? Other content (projects, notes, etc) is untouched.")) return;
    window.THEME = JSON.parse(JSON.stringify(window.__DEFAULTS.theme));
    window.applyTheme();
    force();
  };

  // Detect which font preset is currently active by sans match
  const activePreset = (theme.fontPresets || []).find((p) => p.sans === theme.sans);

  return (
    <div className="adm-form">
      <div className="adm-form-row" style={{ alignItems: "end", marginBottom: 20, gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="t-eyebrow">Editing</div>
          <div className="adm-title-input" style={{ pointerEvents: "none", userSelect: "none" }}>
            Visual theme
          </div>
          <p className="t-body-sm" style={{ color: "var(--muted)", marginTop: 4 }}>
            Colors, fonts, and display preferences. Changes apply live to the
            whole site.
          </p>
        </div>
        <button type="button" className="adm-btn ghost" onClick={resetTheme}>
          Reset to defaults
        </button>
      </div>

      {/* ── Accent ────────────────────────────────────────────── */}
      <fieldset className="adm-fs">
        <legend>Accent color</legend>
        <p className="t-body-sm" style={{ color: "var(--muted)", marginBottom: 12 }}>
          The single hot color used for state, hovers, callouts, and the
          rail-nav mark. Contrast against text is computed automatically.
        </p>
        <div className="adm-swatches">
          {(theme.accentPresets || []).map((c) => (
            <button key={c}
                    type="button"
                    className={`adm-swatch ${theme.accent === c ? "on" : ""}`}
                    style={{ background: c }}
                    title={c}
                    onClick={() => set("accent", c)}>
              {theme.accent === c && <span className="adm-swatch-check">✓</span>}
            </button>
          ))}
          <label className="adm-swatch adm-swatch-custom"
                 style={{ background: theme.accent }}>
            <input type="color"
                   value={theme.accent}
                   onChange={(e) => set("accent", e.target.value)} />
            <span className="adm-swatch-label">Custom</span>
          </label>
        </div>
        <div className="adm-form-grid" style={{ marginTop: 12 }}>
          <Field label="Hex code" hint="paste to override">
            <TextInput value={theme.accent} mono
                       onChange={(v) => set("accent", v)} />
          </Field>
        </div>
      </fieldset>

      {/* ── Surfaces ──────────────────────────────────────────── */}
      <fieldset className="adm-fs">
        <legend>Surface palette</legend>
        <p className="t-body-sm" style={{ color: "var(--muted)", marginBottom: 12 }}>
          The dark-mode scale from page background down to fine hairlines.
        </p>
        <div className="adm-form-grid">
          <ColorField label="Background" value={theme.bg} onChange={(v) => set("bg", v)} />
          <ColorField label="Surface tier 2" value={theme.bg2} onChange={(v) => set("bg2", v)} />
          <ColorField label="Surface" value={theme.surface} onChange={(v) => set("surface", v)} />
          <ColorField label="Hairline" value={theme.line} onChange={(v) => set("line", v)} />
          <ColorField label="Hairline 2" value={theme.line2} onChange={(v) => set("line2", v)} />
        </div>
      </fieldset>

      {/* ── Foreground ────────────────────────────────────────── */}
      <fieldset className="adm-fs">
        <legend>Foreground palette</legend>
        <p className="t-body-sm" style={{ color: "var(--muted)", marginBottom: 12 }}>
          Text and icon colors. Foreground is high-contrast headlines;
          muted is for labels and timestamps.
        </p>
        <div className="adm-form-grid">
          <ColorField label="Foreground" value={theme.fg} onChange={(v) => set("fg", v)} />
          <ColorField label="Foreground 2" value={theme.fg2} onChange={(v) => set("fg2", v)} />
          <ColorField label="Muted" value={theme.muted} onChange={(v) => set("muted", v)} />
          <ColorField label="Muted 2" value={theme.muted2} onChange={(v) => set("muted2", v)} />
        </div>
      </fieldset>

      {/* ── Typography ─────────────────────────────────────────── */}
      <fieldset className="adm-fs">
        <legend>Typography</legend>
        <p className="t-body-sm" style={{ color: "var(--muted)", marginBottom: 12 }}>
          Curated pairings of a body sans + monospace for labels and code.
          Google-hosted families load automatically when selected.
        </p>
        <div className="adm-font-presets">
          {(theme.fontPresets || []).map((p, i) => {
            const isActive = activePreset && activePreset.label === p.label;
            // Extract first family name from sans stack for the preview text
            const previewFamily = p.sans.split(",")[0].replace(/['"]/g, "").trim();
            return (
              <button key={i}
                      type="button"
                      className={`adm-font-card ${isActive ? "on" : ""}`}
                      onClick={() => applyFontPreset(p)}>
                <div className="adm-font-label">
                  <span>{p.label}</span>
                  {isActive && <span className="adm-font-check">✓ Active</span>}
                </div>
                <div className="adm-font-preview"
                     style={{ fontFamily: p.sans }}>
                  Aa Bb 123
                </div>
                <div className="adm-font-stack" style={{ fontFamily: p.mono }}>
                  {previewFamily} · {p.mono.split(",")[0].replace(/['"]/g, "").trim()}
                </div>
              </button>
            );
          })}
        </div>
        <details style={{ marginTop: 14 }}>
          <summary style={{ fontFamily: "var(--mono)", fontSize: 11,
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            color: "var(--muted)", cursor: "none" }}>
            Override raw font stacks
          </summary>
          <div className="adm-form-grid" style={{ marginTop: 10 }}>
            <Field label="Sans family stack" full>
              <TextInput value={theme.sans} mono
                         onChange={(v) => set("sans", v)} />
            </Field>
            <Field label="Mono family stack" full>
              <TextInput value={theme.mono} mono
                         onChange={(v) => set("mono", v)} />
            </Field>
          </div>
          <p className="t-body-sm" style={{ color: "var(--muted)", margin: "8px 0 0" }}>
            For self-hosted fonts in production, set the family name here and
            declare <code style={{ background: "var(--surface)",
              padding: "1px 5px", borderRadius: 3 }}>@font-face</code>{" "}
            rules in <code style={{ background: "var(--surface)",
              padding: "1px 5px", borderRadius: 3 }}>styles.css</code>.
          </p>
        </details>
      </fieldset>

      {/* ── Display preferences ────────────────────────────────── */}
      <fieldset className="adm-fs">
        <legend>Display preferences</legend>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label className="adm-toggle-row">
            <input type="checkbox"
                   checked={!!theme.capsHeadings}
                   onChange={(e) => set("capsHeadings", e.target.checked)} />
            <div>
              <div className="adm-toggle-title">All-caps headings</div>
              <div className="adm-toggle-sub">
                Display, hero, section heads, tile titles, exp rows render as
                UPPERCASE. Body prose stays sentence-case for readability.
              </div>
            </div>
          </label>
        </div>
      </fieldset>

      {/* ── Live preview ──────────────────────────────────────── */}
      <fieldset className="adm-fs">
        <legend>Preview</legend>
        <div className="adm-theme-preview">
          <div className="adm-theme-preview-eyebrow">Preview — current theme</div>
          <h2 className="adm-theme-preview-h">Designing in motion. Building with systems.</h2>
          <p className="adm-theme-preview-body">
            Body text uses the sans stack at 17px. Inline{" "}
            <strong>bold runs</strong>, <em>italic in accent</em>, and{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>linked text</a> all
            render with the current tokens. Monospace labels use the mono
            family.
          </p>
          <div className="adm-theme-preview-row">
            <button className="btn">
              Primary action <span className="arr">→</span>
            </button>
            <button className="btn ghost">
              Secondary <span className="arr">→</span>
            </button>
            <span className="t-mono-sm">2026 · folio · {theme.accent.toUpperCase()}</span>
          </div>
        </div>
      </fieldset>
    </div>
  );
}

// Small helper: a Field + color picker + hex input row, reused for every
// color slot in the theme grid.
function ColorField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div className="adm-color-row">
        <label className="adm-color-chip" style={{ background: value }}>
          <input type="color" value={value}
                 onChange={(e) => onChange(e.target.value)} />
        </label>
        <input className="adm-input mono"
               type="text"
               value={value}
               onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  );
}

Object.assign(window, { ThemeEditor });
