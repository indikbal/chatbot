export interface WidgetConfig {
  /** Real backend endpoint. Leave empty to use the built-in mock agent. */
  apiUrl?: string;
  title: string;
  subtitle: string;
  /** Brand color (hex). */
  color: string;
  position: "right" | "left";
  greeting: string;
  teaser: string;
  suggestions: string[];
  theme: "light" | "dark" | "auto";
  /** Used to namespace stored chat history per site. */
  storageKey: string;
}

export interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  /** Follow-up quick replies shown under a bot message. */
  suggestions?: string[];
  /** Only true for freshly received messages (drives the streaming effect). */
  fresh?: boolean;
  feedback?: "up" | "down";
}

export interface AgentReply {
  text: string;
  suggestions?: string[];
}
