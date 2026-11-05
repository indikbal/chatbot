import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Message, WidgetConfig } from "./types";
import { askAgent } from "./api/agent";
import { Mascot } from "./components/Mascot";
import { Bubble, Typing } from "./components/Bubble";

const uid = () => Math.random().toString(36).slice(2, 10);

function load(key: string): Message[] | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Message[]).map((m) => ({ ...m, fresh: false })) : null;
  } catch {
    return null;
  }
}

export function Widget({ cfg }: { cfg: WidgetConfig }) {
  const reduce = useReducedMotion();
  const key = `agentchat:${cfg.storageKey}`;
  const side = cfg.position === "left" ? "left" : "right";

  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [dark, setDark] = useState(
    cfg.theme === "dark" || (cfg.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches),
  );
  const greet = useCallback(
    (): Message[] => [{ id: uid(), role: "bot", text: cfg.greeting, suggestions: cfg.suggestions }],
    [cfg.greeting, cfg.suggestions],
  );
  const [messages, setMessages] = useState<Message[]>(() => load(key) ?? greet());

  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollDown = useCallback(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  // persist
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(messages.slice(-60))); } catch { /* storage full/blocked */ }
  }, [messages, key]);

  // proactive teaser, once per session
  useEffect(() => {
    if (sessionStorage.getItem(`${key}:seen`)) return;
    const t = setTimeout(() => setTeaser(true), 3500);
    return () => clearTimeout(t);
  }, [key]);

  // open: dismiss teaser, focus, scroll; Escape closes
  useEffect(() => {
    if (!open) return;
    setTeaser(false);
    sessionStorage.setItem(`${key}:seen`, "1");
    const t = setTimeout(() => { inputRef.current?.focus(); scrollDown(); }, 250);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => { clearTimeout(t); window.removeEventListener("keydown", esc); };
  }, [open, key, scrollDown]);

  // When the panel closes, its bubbles unmount. Mark every message as already
  // seen so reopening shows the full text instead of re-streaming it.
  useEffect(() => {
    if (open) return;
    setMessages((p) => (p.some((m) => m.fresh) ? p.map((m) => (m.fresh ? { ...m, fresh: false } : m)) : p));
  }, [open]);

  useEffect(scrollDown, [messages.length, typing, scrollDown]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || typing) return;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((p) => [...p.map((m) => ({ ...m, suggestions: undefined })), { id: uid(), role: "user", text }]);
    setInput("");
    setTyping(true);
    try {
      const r = await askAgent(text, history, cfg);
      setMessages((p) => [...p, { id: uid(), role: "bot", text: r.text, suggestions: r.suggestions, fresh: true }]);
    } catch {
      setMessages((p) => [
        ...p,
        { id: uid(), role: "bot", text: "Oops, I lost my connection for a second 😅. Mind trying again?", suggestions: [text], fresh: true },
      ]);
    } finally {
      setTyping(false);
    }
  }

  const feedback = (id: string, v: "up" | "down") =>
    setMessages((p) => p.map((m) => (m.id === id ? { ...m, feedback: m.feedback === v ? undefined : v } : m)));

  const reset = () => { setMessages(greet()); setTyping(false); };

  const lastBotId = [...messages].reverse().find((m) => m.role === "bot")?.id;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 26 };
  const origin = side === "right" ? "bottom right" : "bottom left";

  return (
    <div
      className={dark ? "dark" : ""}
      style={{ ["--ac-brand" as string]: cfg.color, ["--ac-brand2" as string]: `color-mix(in srgb, ${cfg.color} 60%, #38bdf8)` }}
    >
      <div className="font-sans text-slate-900 antialiased [font-family:ui-sans-serif,system-ui,-apple-system,'Segoe_UI',Roboto,sans-serif]">
        {/* ───────── Chat panel ───────── */}
        <AnimatePresence>
          {open && (
            <motion.section
              role="dialog"
              aria-label={cfg.title}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.55, y: 40, rotate: side === "right" ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 30 }}
              transition={spring}
              style={{ transformOrigin: origin }}
              className={`fixed z-[2147483000] flex flex-col overflow-hidden bg-white shadow-[0_20px_60px_-10px_rgba(15,23,42,.35)] ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10
                max-sm:inset-0 sm:bottom-24 sm:h-[620px] sm:max-h-[calc(100vh-7rem)] sm:w-[390px] sm:rounded-3xl
                ${side === "right" ? "sm:right-5" : "sm:left-5"}`}
            >
              {/* header */}
              <header className="relative overflow-hidden bg-gradient-to-br from-brand to-brand2 px-4 pb-5 pt-4 text-white">
                <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-xl" />
                <div className="pointer-events-none absolute -bottom-12 left-10 h-28 w-28 rounded-full bg-white/10 blur-xl" />
                <div className="relative flex items-center gap-3">
                  <div className="relative">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-white/20 ring-2 ring-white/40">
                      <Mascot size={32} track />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[15px] font-semibold leading-tight">
                      {cfg.title} <span className="inline-block origin-[70%_70%] animate-wave">👋</span>
                    </h2>
                    <p className="truncate text-xs text-white/80">{cfg.subtitle}</p>
                  </div>
                  {[
                    { label: "Toggle theme", icon: dark ? "☀️" : "🌙", on: () => setDark((d) => !d) },
                    { label: "Restart chat", icon: "↺", on: reset },
                    { label: "Close", icon: "✕", on: () => setOpen(false) },
                  ].map((b) => (
                    <motion.button
                      key={b.label}
                      aria-label={b.label}
                      title={b.label}
                      whileHover={{ scale: 1.15, rotate: b.label === "Restart chat" ? -180 : 0 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={b.on}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-sm hover:bg-white/25"
                    >
                      {b.icon}
                    </motion.button>
                  ))}
                </div>
              </header>

              {/* messages */}
              <div ref={scroller} className="-mt-3 flex-1 space-y-3 overflow-y-auto rounded-t-3xl bg-blue-50 px-4 pb-2 pt-5 dark:bg-slate-900 [scrollbar-width:thin]">
                {messages.map((m) => (
                  <div key={m.id}>
                    <Bubble m={m} onFeedback={feedback} onTick={scrollDown} />
                    <AnimatePresence>
                      {m.id === lastBotId && !typing && m.suggestions && (
                        <motion.div
                          className="mt-2 flex flex-wrap gap-2 pl-9"
                          initial="hide" animate="show"
                          variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: m.fresh ? 0.9 : 0.2 } } }}
                        >
                          {m.suggestions.map((s) => (
                            <motion.button
                              key={s}
                              variants={{ hide: { opacity: 0, y: 10, scale: 0.8 }, show: { opacity: 1, y: 0, scale: 1 } }}
                              whileHover={{ scale: 1.06, y: -2 }}
                              whileTap={{ scale: 0.93 }}
                              onClick={() => send(s)}
                              className="rounded-full border border-brand/40 bg-white px-3 py-1.5 text-[13px] font-medium text-brand shadow-sm transition-colors hover:bg-brand hover:text-white dark:bg-slate-800"
                            >
                              {s}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                <AnimatePresence>{typing && <Typing />}</AnimatePresence>
              </div>

              {/* composer */}
              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-end gap-2 rounded-2xl bg-slate-100 py-1.5 pl-3.5 pr-1.5 ring-brand/50 transition focus-within:bg-white focus-within:ring-2 dark:bg-slate-800 dark:focus-within:bg-slate-800">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    maxLength={500}
                    placeholder="Type your question…"
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
                    }}
                    className="max-h-24 flex-1 resize-none self-center bg-transparent py-1 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                  <motion.button
                    type="submit"
                    aria-label="Send"
                    disabled={!input.trim() || typing}
                    animate={input.trim() ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0.85, rotate: -45, opacity: 0.5 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.85 }}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand2 text-white shadow"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 22 12 3.4 3.6 3.3 10l13 2-13 2z" /></svg>
                  </motion.button>
                </div>
                <p className="mt-2 text-center text-[10px] tracking-wide text-slate-400">Powered by AgentChat ⚡</p>
              </form>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ───────── Teaser bubble ───────── */}
        <AnimatePresence>
          {teaser && !open && (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={spring}
              style={{ transformOrigin: origin }}
              className={`fixed bottom-[104px] z-[2147483000] max-w-[240px] ${side === "right" ? "right-5" : "left-5"}`}
            >
              <button
                onClick={() => setOpen(true)}
                className="relative block rounded-2xl rounded-br-md bg-white py-3 pl-4 pr-8 text-left text-[14px] font-medium text-slate-800 shadow-xl ring-1 ring-black/5 dark:bg-slate-800 dark:text-slate-100"
              >
                {cfg.teaser}
              </button>
              <button
                aria-label="Dismiss"
                onClick={() => setTeaser(false)}
                className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───────── Launcher ───────── */}
        <motion.button
          aria-label={open ? "Close chat" : "Open chat"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0, y: open || reduce ? 0 : [0, -6, 0] }}
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 15, delay: 0.4 },
            rotate: { type: "spring", stiffness: 300, damping: 15, delay: 0.4 },
            y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
          }}
          whileHover={{ scale: 1.1, rotate: open ? 90 : -6 }}
          whileTap={{ scale: 0.9 }}
          className={`fixed bottom-5 z-[2147483001] grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand to-brand2 shadow-[0_10px_30px_-5px_var(--ac-brand)] max-sm:data-[open=true]:hidden ${
            side === "right" ? "right-5" : "left-5"
          }`}
          data-open={open}
        >
          {!open && !reduce && <span className="absolute inset-0 animate-ring rounded-full bg-brand" />}
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.svg
                key="x" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"
                initial={{ rotate: -90, opacity: 0, scale: 0.4 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.4 }}
                transition={{ duration: 0.18 }}
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </motion.svg>
            ) : (
              <motion.div
                key="face"
                initial={{ rotate: 90, opacity: 0, scale: 0.4 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: -90, opacity: 0, scale: 0.4 }}
                transition={{ duration: 0.18 }}
              >
                <Mascot size={38} track />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {teaser && !open && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[11px] font-bold text-white ring-2 ring-white"
              >
                1
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
