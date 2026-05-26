'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface MagneticProps {
  children: React.ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
}

/**
 * Magnetic wrapper — SPEC §6.3.
 *
 * On mousemove inside the wrap, translates the inner element toward the
 * cursor by `strength * falloff` using RAF lerps. Resets to 0,0 on
 * mouseleave. Disabled under prefers-reduced-motion: reduce.
 */
export function Magnetic({
  children,
  strength = 0.35,
  radius = 90,
  className,
}: MagneticProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    let rect: DOMRect | null = null;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const measure = () => {
      rect = wrap.getBoundingClientRect();
    };

    const onMove = (e: MouseEvent) => {
      if (!rect) measure();
      if (!rect) return;
      const ccx = rect.left + rect.width / 2;
      const ccy = rect.top + rect.height / 2;
      const ddx = e.clientX - ccx;
      const ddy = e.clientY - ccy;
      const dist = Math.hypot(ddx, ddy);
      const falloff = Math.max(0, 1 - dist / (radius * 2.4));
      tx = ddx * strength * falloff;
      ty = ddy * strength * falloff;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      inner.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    wrap.addEventListener('mouseenter', measure);
    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('mouseleave', onLeave);
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);

    return () => {
      wrap.removeEventListener('mouseenter', measure);
      wrap.removeEventListener('mousemove', onMove);
      wrap.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength, radius, reduced]);

  return (
    <span ref={wrapRef} className={className} style={{ display: 'inline-block' }}>
      <span ref={innerRef} style={{ display: 'inline-block', willChange: 'transform' }}>
        {children}
      </span>
    </span>
  );
}
