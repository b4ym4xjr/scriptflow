"use client";

import { useState } from "react";
import { motion } from "motion/react";

// Palette only: primary, its soft tint, and the theme ink.
const COLORS = [
  "var(--primary)",
  "color-mix(in oklab, var(--primary) 55%, white)",
  "var(--secondary-foreground)",
  "var(--foreground)",
];

/** One-shot confetti burst. Mount with a fresh `key` to replay. */
export function Confetti({ onDone }: { onDone?: () => void }) {
  // Lazy initializer: randomised once per mount, not on every render.
  const [pieces] = useState(() =>
      Array.from({ length: 56 }, (_, i) => {
        const angle = (Math.random() - 0.5) * Math.PI * 1.1 - Math.PI / 2;
        const velocity = 260 + Math.random() * 380;
        return {
          id: i,
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity,
          rotate: (Math.random() - 0.5) * 900,
          size: 6 + Math.random() * 6,
          color: COLORS[i % COLORS.length],
          round: Math.random() > 0.6,
          delay: Math.random() * 0.08,
        };
      }),
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-100 overflow-hidden"
      aria-hidden
    >
      <div className="absolute left-1/2 top-[55%]">
        {pieces.map((p, i) => (
          <motion.span
            key={p.id}
            className="absolute block"
            style={{
              width: p.size,
              height: p.round ? p.size : p.size * 0.5,
              borderRadius: p.round ? "9999px" : 2,
              background: p.color,
            }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: p.x,
              y: [0, p.y, p.y + 420],
              opacity: [1, 1, 0],
              rotate: p.rotate,
            }}
            transition={{
              duration: 1.9,
              delay: p.delay,
              ease: "easeOut",
              times: [0, 0.4, 1],
            }}
            onAnimationComplete={i === 0 ? onDone : undefined}
          />
        ))}
      </div>
    </div>
  );
}
