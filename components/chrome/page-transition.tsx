'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import styles from './page-transition.module.css';

/**
 * Page transition wipe — SPEC §6.4 / §7.
 *
 * Wraps the children in an AnimatePresence keyed on pathname so route
 * changes trigger a fade-up + a CSS-driven wipe stripe. Respects
 * prefers-reduced-motion: framer's `useReducedMotion` collapses the wipe
 * to a fade, and the wipeUp keyframes are disabled in CSS.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className={styles.shell}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={pathname}
          className={styles.content}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{
            duration: 0.62,
            ease: [0.22, 0.61, 0.36, 1],
          }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
