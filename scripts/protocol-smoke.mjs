import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const serverPath = fileURLToPath(new URL("../dist/server.js", import.meta.url));
const child = spawn(process.execPath, [serverPath], {
  env: { ...process.env, HOST: "127.0.0.1", PORT: "0" },
  stdio: ["ignore", "ignore", "pipe"],
});

let stderr = "";
let shutdownTimer;
let readyTimer;
let port;
const clients = [];

const ready = new Promise((resolve, reject) => {
  readyTimer = setTimeout(() => reject(new Error("Local MCP server did not start in time.")), 5000);
  child.once("error", reject);
  child.once("exit", (code) => {
    if (port === undefined) reject(new Error(`Local MCP server exited before startup (${code ?? "signal"}).`));
  });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
    const match = stderr.match(/\[server\] listening on 127\.0\.0\.1:(\d+)/);
    if (match && port === undefined) {
      port = Number(match[1]);
      clearTimeout(readyTimer);
      resolve(port);
    }
    if (stderr.includes("[server] startup failed") && port === undefined) {
      clearTimeout(readyTimer);
      reject(new Error("Local MCP server failed to start."));
    }
  });
});

async function verifyClient(versionNegotiation) {
  const client = new Client(
    { name: "oura-ai-connector-smoke", version: "0.1.0" },
    versionNegotiation ? { versionNegotiation } : undefined,
  );
  clients.push(client);

  const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`));
  await client.connect(transport);

  const listedTools = await client.listTools();
  assert.ok(listedTools.tools.some((tool) => tool.name === "get_synthetic_sleep_demo"));

  const result = await client.callTool({ name: "get_synthetic_sleep_demo", arguments: {} });
  assert.equal(result.isError, undefined);
  assert.deepEqual(result.structuredContent, {
    dataset: "synthetic",
    date: "2026-01-03",
    total_sleep_minutes: 430,
    sleep_score: 81,
  });
  await client.close();
}

try {
  await ready;

  const healthResponse = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: "ok" });

  // The default SDK mode exercises the initialize handshake; auto also checks
  // the current 2026-07-28 discovery path and fallback behavior.
  await verifyClient(undefined);
  await verifyClient({ mode: "auto" });

  console.log("Local MCP protocol smoke passed (health, initialize/list/call, modern discovery/list/call).");
} finally {
  clearTimeout(readyTimer);
  for (const client of clients) {
    await client.close().catch(() => undefined);
  }

  if (child.exitCode === null && child.signalCode === null) {
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    shutdownTimer = setTimeout(() => child.kill("SIGKILL"), 3000);
    await exited;
  }
  clearTimeout(shutdownTimer);
}
