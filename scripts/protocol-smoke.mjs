import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { request as httpRequest } from "node:http";
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

async function verifyClient(versionNegotiation, expectedProtocolEra) {
  const client = new Client(
    { name: "oura-ai-connector-smoke", version: "0.1.0" },
    versionNegotiation === undefined ? undefined : { versionNegotiation },
  );
  clients.push(client);

  const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`));
  await client.connect(transport);
  assert.equal(client.getProtocolEra(), expectedProtocolEra);

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

async function requestHealthStatus(headers) {
  return await new Promise((resolve, reject) => {
    const request = httpRequest(
      { hostname: "127.0.0.1", port, path: "/health", headers },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      },
    );
    request.once("error", reject);
    request.end();
  });
}

async function verifyNonLoopbackHostRejected() {
  const probe = spawn(process.execPath, [serverPath], {
    env: { ...process.env, HOST: "0.0.0.0", PORT: "0" },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let output = "";
  let killTimer;
  let timeout;
  probe.stderr.setEncoding("utf8");
  probe.stderr.on("data", (chunk) => { output += chunk; });

  try {
    const outcome = await Promise.race([
      once(probe, "exit").then(([code, signal]) => ({ code, signal })),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Non-loopback server probe did not exit.")), 3000);
      }),
    ]);
    assert.equal(outcome.code, 1, "Non-loopback HOST must fail startup.");
    assert.equal(outcome.signal, null);
    assert.match(output, /\[server\] startup failed INVALID_CONFIGURATION/);
    assert.doesNotMatch(output, /\[server\] listening/);
  } finally {
    clearTimeout(timeout);
    if (probe.exitCode === null && probe.signalCode === null) {
      const exited = once(probe, "exit");
      probe.kill("SIGTERM");
      killTimer = setTimeout(() => probe.kill("SIGKILL"), 3000);
      await exited;
    }
    clearTimeout(killTimer);
  }
}

try {
  await ready;

  const healthResponse = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: "ok" });

  assert.equal(await requestHealthStatus({ host: "attacker.example" }), 403);
  assert.equal(await requestHealthStatus({ origin: "https://attacker.example" }), 403);
  await verifyNonLoopbackHostRejected();

  await verifyClient(undefined, "legacy");
  await verifyClient({ mode: { pin: "2026-07-28" } }, "modern");

  console.log("Local MCP protocol smoke passed (health, Host/Origin rejection, loopback-only bind, legacy initialize, pinned 2026-07-28 discovery, synthetic tool list/call).");
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
