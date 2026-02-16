#!/usr/bin/env node
/**
 * Start Next.js dev server bound to the machine's local network IP
 * so "Network" in the terminal shows http://<your-ip>:3000
 */
const { spawn } = require("child_process");
const os = require("os");

function getLocalNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "0.0.0.0";
}

const host = getLocalNetworkIP();
const port = process.env.PORT || 3000;

console.log(`Starting dev server (network: http://${host}:${port})...\n`);

const child = spawn(
  "npx",
  ["next", "dev", "-H", host, "-p", String(port)],
  {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, PORT: String(port) },
  }
);

child.on("exit", (code) => process.exit(code ?? 0));
