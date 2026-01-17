import { spawn } from "child_process";
import net from "node:net";
import path from "path";
import process from "process";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const hostname = process.env.HOSTNAME ?? "localhost";

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
async function isPortFree(p) {
  return await new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(p, hostname);
  });
}

async function pickPort(preferredPort, maxTries = 20) {
  for (let i = 0; i <= maxTries; i += 1) {
    const candidate = preferredPort + i;
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(candidate)) return candidate;
  }
  throw new Error(
    `No free port found in range ${preferredPort}-${preferredPort + maxTries}`
  );
}

const chosenPort = await pickPort(port);
if (chosenPort !== port) {
  // eslint-disable-next-line no-console
  console.warn(
    `Port ${port} is in use. Falling back to ${chosenPort}. (You can set PORT to override.)`
  );
}

const args = dev
  ? ["dev", "-p", String(chosenPort), "-H", hostname]
  : ["start", "-p", String(chosenPort), "-H", hostname];

const child = spawn(nextBin, args, {
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});


