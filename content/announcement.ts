import announcementData from '@/data/announcement.json';

/* ──────────────────────────────────────────────────────────────────────────
 * Announcement banner — thin top strip toggled from Keystatic.
 *
 * Editor flow: /keystatic → Pages → Announcement bar
 *   1. Tick "Enabled"
 *   2. Type the message (e.g. "Booking Q3 2026 — limited spots")
 *   3. Optionally add a CTA label + href (absolute URL or relative path)
 *   4. Save → next deploy renders the banner above every public page
 *
 * Setting `enabled: false` removes the banner entirely (no DOM, no
 * layout shift), so the same data shape acts as a kill switch.
 * ──────────────────────────────────────────────────────────────────── */

export interface AnnouncementConfig {
  enabled: boolean;
  message: string;
  ctaLabel: string;
  ctaHref: string;
}

export const ANNOUNCEMENT: AnnouncementConfig =
  announcementData as AnnouncementConfig;

/** True when the banner has enough content to render meaningfully. */
export function shouldShowAnnouncement(
  config: AnnouncementConfig = ANNOUNCEMENT,
): boolean {
  return config.enabled === true && config.message.trim().length > 0;
}
