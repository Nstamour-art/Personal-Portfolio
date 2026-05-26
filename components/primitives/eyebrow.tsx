interface EyebrowProps {
  children: React.ReactNode;
  as?: 'p' | 'span' | 'div';
  className?: string;
  color?: string;
}

/**
 * Small all-caps mono eyebrow label. SPEC type scale §2 (.t-eyebrow).
 */
export function Eyebrow({ children, as: Tag = 'p', className, color }: EyebrowProps) {
  const cls = ['t-eyebrow', className].filter(Boolean).join(' ');
  return (
    <Tag className={cls} style={color ? { color } : undefined}>
      {children}
    </Tag>
  );
}
