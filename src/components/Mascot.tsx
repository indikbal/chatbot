import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/** Friendly face. Pupils follow the cursor, eyes blink on a timer. */
export function Mascot({ size = 36, track = false }: { size?: number; track?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });

  useEffect(() => {
    if (!track) return;
    const onMove = (e: MouseEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 200) * 3; // pupils travel at most 3 units
      x.set((dx / d) * k);
      y.set((dy / d) * k);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [track, x, y]);

  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="18" fill="white" />
      <g className="animate-blink [transform-box:fill-box] [transform-origin:center]">
        <ellipse cx="14" cy="18" rx="4" ry="4.8" fill="#fff" stroke="#0f172a" strokeWidth="1.2" />
        <ellipse cx="26" cy="18" rx="4" ry="4.8" fill="#fff" stroke="#0f172a" strokeWidth="1.2" />
        <motion.circle cx="14" cy="18" r="2.1" fill="#0f172a" style={{ x: sx, y: sy }} />
        <motion.circle cx="26" cy="18" r="2.1" fill="#0f172a" style={{ x: sx, y: sy }} />
      </g>
      <path d="M13 27 Q20 33 27 27" stroke="#0f172a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="9" cy="25" r="2.2" fill="#fb7185" opacity=".45" />
      <circle cx="31" cy="25" r="2.2" fill="#fb7185" opacity=".45" />
    </svg>
  );
}
