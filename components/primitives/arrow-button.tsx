import Link from 'next/link';
import styles from './arrow-button.module.css';

interface BaseProps {
  children: React.ReactNode;
  variant?: 'accent' | 'ghost';
  cursorLabel?: string;
  className?: string;
}

type ArrowButtonProps = BaseProps &
  (
    | { href: string; external?: boolean; onClick?: never; type?: never }
    | { href?: undefined; onClick?: () => void; type?: 'button' | 'submit'; external?: never }
  );

/**
 * The rounded pill CTA with the trailing circular arrow used throughout
 * the site (mailto in footer, "All work" on home, etc.). Renders as
 * <Link> for internal hrefs, <a target="_blank"> for external, and a
 * <button> when only onClick is provided.
 */
export function ArrowButton({
  children,
  variant = 'accent',
  cursorLabel,
  className,
  href,
  external,
  onClick,
  type = 'button',
}: ArrowButtonProps) {
  const cls = [styles.btn, variant === 'ghost' ? styles.ghost : null, className]
    .filter(Boolean)
    .join(' ');
  const arrow = (
    <span className={styles.arr} aria-hidden="true">
      →
    </span>
  );

  if (href !== undefined) {
    if (external || href.startsWith('http')) {
      return (
        <a
          href={href}
          className={cls}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="link"
          data-cursor-label={cursorLabel}
        >
          {children}
          {arrow}
        </a>
      );
    }
    if (href.startsWith('mailto:') || href.startsWith('tel:')) {
      return (
        <a
          href={href}
          className={cls}
          data-cursor="link"
          data-cursor-label={cursorLabel}
        >
          {children}
          {arrow}
        </a>
      );
    }
    return (
      <Link
        href={href}
        className={cls}
        data-cursor="link"
        data-cursor-label={cursorLabel}
      >
        {children}
        {arrow}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={cls}
      data-cursor="link"
      data-cursor-label={cursorLabel}
    >
      {children}
      {arrow}
    </button>
  );
}
