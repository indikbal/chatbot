import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Message } from "../types";
import { Mascot } from "./Mascot";

/** Tiny inline renderer: **bold** and `code`. */
function rich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) =>
    p.startsWith("**") ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : p.startsWith("`") ? (
      <code key={i} className="rounded bg-black/10 px-1 py-0.5 text-[12px] dark:bg-white/15">
        {p.slice(1, -1)}
      </code>
    ) : (
      p
    ),
  );
}

/** Reveals words progressively, like the agent is streaming. */
function useStream(text: string, enabled: boolean) {
  const words = text.split(/(\s+)/);
  const [n, setN] = useState(enabled ? 0 : words.length);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      setN((c) => {
        if (c >= words.length) clearInterval(id);
        return c + 2;
      });
    }, 38);
    return () => clearInterval(id);
  }, [enabled, words.length]);
  return { shown: words.slice(0, n).join(""), done: n >= words.length };
}

const BURST = ["👍", "✨", "💛", "🎉"];

export function Bubble({
  m,
  onFeedback,
  onTick,
}: {
  m: Message;
  onFeedback: (id: string, v: "up" | "down") => void;
  onTick: () => void;
}) {
  const isBot = m.role === "bot";
  const { shown, done } = useStream(m.text, !!m.fresh && isBot);
  useEffect(onTick, [shown]); // keep scrolled to the bottom while streaming

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={`group flex items-end gap-2 ${isBot ? "justify-start" : "justify-end"}`}
    >
      {isBot && (
        <div className="mb-5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand2 shadow">
          <Mascot size={20} />
        </div>
      )}
      <div className="flex max-w-[80%] flex-col">
        <div
          className={`whitespace-pre-wrap break-words px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm ${
            isBot
              ? "rounded-2xl rounded-bl-md bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100"
              : "rounded-2xl rounded-br-md bg-gradient-to-br from-brand to-brand2 text-white"
          }`}
        >
          {rich(shown)}
          {isBot && !done && (
            <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-current" />
          )}
        </div>

        {isBot && done && (
          <div
            className={`relative mt-1 flex gap-1 pl-1 transition-opacity group-hover:opacity-100 ${
              m.feedback ? "opacity-100" : "opacity-0"
            }`}
          >
            {(["up", "down"] as const).map((v) => (
              <motion.button
                key={v}
                whileHover={{ scale: 1.25, rotate: v === "up" ? -12 : 12 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => onFeedback(m.id, v)}
                aria-label={v === "up" ? "Helpful" : "Not helpful"}
                className={`text-[13px] ${m.feedback && m.feedback !== v ? "hidden" : ""} ${
                  m.feedback === v ? "" : "grayscale hover:grayscale-0"
                }`}
              >
                {v === "up" ? "👍" : "👎"}
              </motion.button>
            ))}
            <AnimatePresence>
              {m.feedback === "up" &&
                BURST.map((e, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 1, y: 0, x: 0, scale: 0.6 }}
                    animate={{ opacity: 0, y: -42 - i * 8, x: (i - 1.5) * 18, scale: 1.2, rotate: (i - 1.5) * 25 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className="pointer-events-none absolute left-2 top-0 text-sm"
                  >
                    {e}
                  </motion.span>
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function Typing() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-end gap-2"
    >
      <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand to-brand2 shadow">
        <Mascot size={20} />
      </div>
      <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3.5 shadow-sm dark:bg-slate-800">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-dot rounded-full bg-brand"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </motion.div>
  );
}
