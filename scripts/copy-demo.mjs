// Vercel needs an index.html in the output dir; the lib build only emits agent-chat.js.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });
copyFileSync("demo/deploy-index.html", "dist/index.html");
console.log("Copied demo/deploy-index.html -> dist/index.html");
