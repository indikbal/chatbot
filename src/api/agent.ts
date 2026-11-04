import type { AgentReply, WidgetConfig } from "../types";

/**
 * Single entry point the UI talks to.
 * - With `apiUrl` set: POST { message, history } -> { text, suggestions? }
 * - Otherwise: the mock knowledge base below.
 */
export async function askAgent(
  message: string,
  history: { role: string; text: string }[],
  cfg: WidgetConfig,
): Promise<AgentReply> {
  if (cfg.apiUrl) {
    const res = await fetch(cfg.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error(`Agent error ${res.status}`);
    return res.json();
  }
  return mockAgent(message);
}

const KB: { match: RegExp; reply: AgentReply }[] = [
  {
    match: /price|pricing|cost|plan|subscription|cheap/i,
    reply: {
      text: "We have **3 plans**: Starter ($9/mo), Pro ($29/mo) and Enterprise (custom). Every plan includes a **14-day free trial**, no credit card needed. 🎉",
      suggestions: ["What's in Pro?", "Is there a discount?", "Talk to a human"],
    },
  },
  {
    match: /discount|offer|coupon|student/i,
    reply: {
      text: "Yes! Annual billing saves **20%**, and students and non-profits get **40% off**. Just email us a proof of status. 💌",
      suggestions: ["Pricing plans", "Talk to a human"],
    },
  },
  {
    match: /pro\b|feature|include/i,
    reply: {
      text: "**Pro** includes unlimited projects, priority support, team roles, analytics and API access. Most teams start here. ⚡",
      suggestions: ["Pricing plans", "How do I integrate?"],
    },
  },
  {
    match: /ship|deliver|track|order/i,
    reply: {
      text: "Orders ship within **24 hours** and usually arrive in **3-5 business days**. You'll get a tracking link by email. 📦",
      suggestions: ["Refund policy", "Talk to a human"],
    },
  },
  {
    match: /refund|return|cancel|money back/i,
    reply: {
      text: "No stress, we offer a **30-day money-back guarantee**. Cancel any time from Settings → Billing and we'll refund you. 💸",
      suggestions: ["Pricing plans", "Talk to a human"],
    },
  },
  {
    match: /integrat|install|setup|set up|api|embed/i,
    reply: {
      text: "Setup takes about **2 minutes**: paste one `<script>` tag before `</body>` and you're live. Works on any site: WordPress, Shopify, Webflow, plain HTML. 🔌",
      suggestions: ["Pricing plans", "Talk to a human"],
    },
  },
  {
    match: /human|agent|person|support|contact|email|call|phone/i,
    reply: {
      text: "Of course! Our team is online **Mon-Fri, 9am-6pm**. Email **support@example.com** and they'll reply within a few hours. 🙋",
      suggestions: ["Pricing plans", "Refund policy"],
    },
  },
  {
    match: /hour|open|time|when/i,
    reply: {
      text: "Our support team is available **Mon-Fri, 9am-6pm (IST)**. I'm here 24/7 though! 🌙",
      suggestions: ["Talk to a human", "Pricing plans"],
    },
  },
  {
    match: /^(hi|hello|hey|hola|yo|namaste)\b/i,
    reply: {
      text: "Hey there! 👋 Ask me anything about pricing, shipping, refunds or how things work.",
      suggestions: ["Pricing plans", "How do I integrate?", "Refund policy"],
    },
  },
  {
    match: /thank|thanks|thx|great|awesome/i,
    reply: { text: "Happy to help! 😊 Anything else on your mind?", suggestions: ["Pricing plans", "Talk to a human"] },
  },
];

const FALLBACK: AgentReply = {
  text: "Hmm, I'm not 100% sure about that one 🤔. Here's what I can help with right now, or I can connect you to a human.",
  suggestions: ["Pricing plans", "Refund policy", "How do I integrate?", "Talk to a human"],
};

async function mockAgent(message: string): Promise<AgentReply> {
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 900)); // feels like "thinking"
  return KB.find((k) => k.match.test(message))?.reply ?? FALLBACK;
}
