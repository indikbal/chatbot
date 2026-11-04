import { createRoot } from "react-dom/client";
import css from "./styles.css?inline";
import { Widget } from "./Widget";
import type { WidgetConfig } from "./types";

const DEFAULTS: WidgetConfig = {
  title: "Ask Buddy",
  subtitle: "Typically replies instantly",
  color: "#2563eb",
  position: "right",
  greeting: "Hi! 👋 I'm Buddy. Got a question about anything on this page? Ask away, I'm all ears.",
  teaser: "👋 Got a question? I can help!",
  suggestions: ["Pricing plans", "How do I integrate?", "Refund policy", "Talk to a human"],
  theme: "light",
  storageKey: location.hostname || "default",
};

let mounted = false;

/** window.AgentChat.init({...}) or just use <script data-color="..."> attributes. */
function init(user: Partial<WidgetConfig> = {}) {
  if (mounted) return;
  mounted = true;
  const host = document.createElement("div");
  host.id = "agent-chat-host";
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = css;
  const mount = document.createElement("div");
  shadow.append(style, mount);
  createRoot(mount).render(<Widget cfg={{ ...DEFAULTS, ...user }} />);
}

function fromScriptTag(): Partial<WidgetConfig> {
  const s = (document.currentScript ?? document.querySelector("script[data-agent-chat]")) as HTMLScriptElement | null;
  const d = s?.dataset ?? {};
  const out: Partial<WidgetConfig> = {};
  if (d.apiUrl) out.apiUrl = d.apiUrl;
  if (d.title) out.title = d.title;
  if (d.subtitle) out.subtitle = d.subtitle;
  if (d.color) out.color = d.color;
  if (d.position === "left" || d.position === "right") out.position = d.position;
  if (d.greeting) out.greeting = d.greeting;
  if (d.teaser) out.teaser = d.teaser;
  if (d.theme === "light" || d.theme === "dark" || d.theme === "auto") out.theme = d.theme;
  if (d.suggestions) out.suggestions = d.suggestions.split("|").map((x) => x.trim()).filter(Boolean);
  return out;
}

const scriptCfg = fromScriptTag();
(window as unknown as { AgentChat: unknown }).AgentChat = { init };

const start = () => init(scriptCfg);
// auto-start unless the page opts out with data-manual
if (!document.currentScript || !(document.currentScript as HTMLScriptElement).dataset.manual) {
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
}
