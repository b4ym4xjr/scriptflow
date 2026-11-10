"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  FlipHorizontal2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  StickyNote,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

interface Block {
  type: "h" | "p" | "note" | "li" | "hr";
  text: string;
}

/**
 * Turns TipTap HTML into plain blocks via DOMParser. We render React text nodes
 * (never innerHTML), so collaborator-supplied markup can't execute anything.
 */
function parseBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const blocks: Block[] = [];

  const walk = (node: Element, inQuote = false) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();
      const text = (child.textContent ?? "").trim();
      if (/^h[1-6]$/.test(tag)) {
        if (text) blocks.push({ type: "h", text });
      } else if (tag === "p") {
        if (text) blocks.push({ type: inQuote ? "note" : "p", text });
      } else if (tag === "blockquote") {
        walk(child, true);
        if (!child.querySelector("p") && text)
          blocks.push({ type: "note", text });
      } else if (tag === "ul" || tag === "ol") {
        for (const li of Array.from(child.children)) {
          const t = (li.textContent ?? "").trim();
          if (t) blocks.push({ type: "li", text: t });
        }
      } else if (tag === "hr") {
        blocks.push({ type: "hr", text: "" });
      } else if (text) {
        blocks.push({ type: inQuote ? "note" : "p", text });
      }
    }
  };
  walk(doc.body);
  return blocks;
}

interface TeleprompterProps {
  title: string;
  html: string;
  onClose: () => void;
}

const MIN_PACE = 1;
const MAX_PACE = 12;
/** ~150 wpm at pace 5 for typical line widths. */
const PX_PER_PACE = 0.133;

export function Teleprompter({ title, html, onClose }: TeleprompterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pace, setPace] = useState(5);
  const [fontSize, setFontSize] = useState(48);
  const [mirror, setMirror] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [progress, setProgress] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const blocks = useMemo(() => parseBlocks(html), [html]);

  // Lock page scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Auto-scroll loop. Position is tracked as a float; scrollTop alone rounds.
  const posRef = useRef(0);
  const paceRef = useRef(pace);
  const sizeRef = useRef(fontSize);
  useEffect(() => {
    paceRef.current = pace;
    sizeRef.current = fontSize;
  }, [pace, fontSize]);

  useEffect(() => {
    if (!playing) return;
    const el = scrollRef.current;
    if (!el) return;
    posRef.current = el.scrollTop;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      // Respect manual scrolling (wheel / touch) between frames.
      if (Math.abs(el.scrollTop - posRef.current) > 2) {
        posRef.current = el.scrollTop;
      }
      posRef.current += paceRef.current * sizeRef.current * PX_PER_PACE * dt;
      el.scrollTop = posRef.current;

      const max = el.scrollHeight - el.clientHeight;
      if (posRef.current >= max) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const start = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (countdown !== null) return;
    setCountdown(3);
  }, [playing, countdown]);

  // 3-2-1 before scrolling starts.
  useEffect(() => {
    if (countdown === null) return;
    const t = setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(null);
        setPlaying(true);
      } else {
        setCountdown(countdown - 1);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [countdown]);

  const restart = () => {
    setPlaying(false);
    setCountdown(null);
    posRef.current = 0;
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const wake = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2800);
  }, []);

  // Controls start visible, then auto-hide after a moment of inactivity.
  useEffect(() => {
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2800);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // Keyboard controls.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      wake();
      switch (e.key) {
        case " ":
          e.preventDefault();
          start();
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
        case "ArrowUp":
          e.preventDefault();
          setPace((p) => Math.min(MAX_PACE, p + 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setPace((p) => Math.max(MIN_PACE, p - 1));
          break;
        case "+":
        case "=":
          setFontSize((s) => Math.min(120, s + 4));
          break;
        case "-":
          setFontSize((s) => Math.max(24, s - 4));
          break;
        case "m":
        case "M":
          setMirror((m) => !m);
          break;
        case "r":
        case "R":
          restart();
          break;
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [start, onClose, wake]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? el.scrollTop / max : 0);
  };

  const renderBlock = (b: Block, i: number): ReactNode => {
    switch (b.type) {
      case "h":
        return (
          <h2
            key={i}
            className="mt-[1.2em] mb-[0.4em] font-display font-bold text-[var(--tp-accent)]"
            style={{ fontSize: "1.15em" }}
          >
            {b.text}
          </h2>
        );
      case "note":
        return showNotes ? (
          <p
            key={i}
            className="my-[0.6em] rounded-xl border border-dashed border-white/20 px-[0.6em] py-[0.2em] italic text-white/45"
            style={{ fontSize: "0.7em" }}
          >
            [ {b.text} ]
          </p>
        ) : null;
      case "li":
        return (
          <p key={i} className="my-[0.4em] pl-[1em] -indent-[1em]">
            <span className="text-[var(--tp-accent)]">•</span> {b.text}
          </p>
        );
      case "hr":
        return (
          <div
            key={i}
            className="my-[1.2em] flex items-center gap-4 text-white/30"
            style={{ fontSize: "0.5em" }}
          >
            <span className="h-px flex-1 bg-white/20" />
            NEXT SCENE
            <span className="h-px flex-1 bg-white/20" />
          </div>
        );
      default:
        return (
          <p key={i} className="my-[0.55em]">
            {b.text}
          </p>
        );
    }
  };

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Teleprompter: ${title}`}
      onMouseMove={wake}
      onTouchStart={wake}
      className={cn(
        "fixed inset-0 z-[90] bg-black text-white [--tp-accent:oklch(0.82_0.1_270)]",
        !controlsVisible && "cursor-none",
      )}
    >
      {/* Progress */}
      <div className="absolute inset-x-0 top-0 z-20 h-1 bg-white/10">
        <div
          className="h-full bg-primary"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Reading guide */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 top-[34%] h-[1.6em] -translate-y-1/2 border-y border-[var(--tp-accent)]/30 bg-[var(--tp-accent)]/[0.06]"
        style={{ fontSize: fontSize }}
        aria-hidden
      >
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--tp-accent)]">
          ▶
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[22%] bg-linear-to-b from-black to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[22%] bg-linear-to-t from-black to-transparent" />

      {/* Text */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full overflow-y-scroll px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          className="mx-auto max-w-5xl pb-[60vh] pt-[34vh] font-medium leading-[1.55] transition-transform duration-300"
          style={{
            fontSize,
            transform: mirror ? "scaleX(-1)" : undefined,
          }}
        >
          {blocks.length === 0 ? (
            <p className="text-center text-white/40">This script has no content yet.</p>
          ) : (
            blocks.map(renderBlock)
          )}
          <p
            className="mt-[1.5em] text-center text-white/30"
            style={{ fontSize: "0.5em" }}
          >
            — end of script —
          </p>
        </div>
      </div>

      {/* Countdown */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            key={countdown}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center font-display text-[18rem] font-bold text-[var(--tp-accent)]/90"
          >
            {countdown}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 bottom-5 z-30 flex justify-center px-4"
          >
            <div className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-2xl border border-white/10 bg-zinc-900/85 p-2 shadow-2xl backdrop-blur-xl">
              <TpButton
                onClick={start}
                label={playing ? "Pause (Space)" : "Play (Space)"}
                primary
              >
                {playing ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </TpButton>
              <TpButton onClick={restart} label="Restart (R)">
                <RotateCcw className="h-4 w-4" />
              </TpButton>

              <Sep />
              <TpButton
                onClick={() => setPace((p) => Math.max(MIN_PACE, p - 1))}
                label="Slower (↓)"
              >
                <Minus className="h-4 w-4" />
              </TpButton>
              <div className="w-20 text-center text-xs tabular-nums text-white/70">
                <span className="block text-[10px] uppercase tracking-wider text-white/40">
                  Speed
                </span>
                ~{pace * 30} wpm
              </div>
              <TpButton
                onClick={() => setPace((p) => Math.min(MAX_PACE, p + 1))}
                label="Faster (↑)"
              >
                <Plus className="h-4 w-4" />
              </TpButton>

              <Sep />
              <TpButton
                onClick={() => setFontSize((s) => Math.max(24, s - 4))}
                label="Smaller text (−)"
              >
                <span className="text-xs font-bold">A</span>
              </TpButton>
              <span className="w-10 text-center text-xs tabular-nums text-white/70">
                {fontSize}
              </span>
              <TpButton
                onClick={() => setFontSize((s) => Math.min(120, s + 4))}
                label="Larger text (+)"
              >
                <span className="text-lg font-bold leading-none">A</span>
              </TpButton>

              <Sep />
              <TpButton
                onClick={() => setMirror((m) => !m)}
                label="Mirror (M)"
                active={mirror}
              >
                <FlipHorizontal2 className="h-4 w-4" />
              </TpButton>
              <TpButton
                onClick={() => setShowNotes((s) => !s)}
                label="Show on-screen notes"
                active={showNotes}
              >
                <StickyNote className="h-4 w-4" />
              </TpButton>

              <Sep />
              <TpButton onClick={onClose} label="Exit (Esc)">
                <X className="h-4 w-4" />
              </TpButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "absolute left-5 top-4 z-20 max-w-[60%] truncate text-sm text-white/40 transition-opacity duration-500",
          !controlsVisible && "opacity-0",
        )}
      >
        {title}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

function Sep() {
  return <span className="mx-1 hidden h-6 w-px bg-white/15 sm:block" />;
}

function TpButton({
  children,
  onClick,
  label,
  primary,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  primary?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-white/80 transition-all hover:bg-white/10 hover:text-white active:scale-90",
        primary && "bg-primary text-primary-foreground hover:opacity-90",
        active && "bg-white/15 text-[var(--tp-accent)]",
      )}
    >
      {children}
    </button>
  );
}
