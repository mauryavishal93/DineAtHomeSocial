import { spawn } from "child_process";
import path from "path";
import process from "process";
import os from "os";

// Render automatically sets PORT, use it directly
const port = process.env.PORT || "3000";
// Bind to 0.0.0.0 so the app is reachable from other devices on the same network
const hostname = process.env.HOSTNAME || "0.0.0.0";

function getLocalNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return null;
}

// If NODE_ENV isn't set, default to development for local runs.
if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
const dev = process.env.NODE_ENV !== "production";

const nextBin = path.resolve(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next"
);

process.on("unhandledRejection", (err) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled rejection:", err);
});
process.on("uncaughtException", (err) => {
  // eslint-disable-next-line no-console
  console.error("Uncaught exception:", err);
  process.exitCode = 1;
});

// NOTE:
// Next.js App Router dev mode is not compatible with a custom HTTP server in some versions
// (it can break devtools/RSC manifests and cause missing /_next/static assets).
// To ensure "node server.js" always boots the full app reliably:
// - dev: spawn `next dev`
// - prod: spawn `next start`
const args = dev
  ? ["dev", "-p", port, "-H", hostname]
  : ["start", "-p", port, "-H", hostname];

const networkIP = hostname === "0.0.0.0" ? getLocalNetworkIP() : hostname;
console.log(`Starting Next.js in ${dev ? "development" : "production"} mode`);
console.log(`  Local:   http://localhost:${port}`);
if (networkIP) console.log(`  Network: http://${networkIP}:${port}`);

const child = spawn(nextBin, args, {
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});


