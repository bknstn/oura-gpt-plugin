import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { pathToFileURL } from "node:url";
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { localhostHostValidation, localhostOriginValidation, toNodeHandler } from "@modelcontextprotocol/node";
import * as z from "zod/v4";

const APP_NAME = "oura-ai-connector-local";
const APP_VERSION = "0.1.0";
const SYNTHETIC_TOOL_NAME = "get_synthetic_sleep_demo";
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

const syntheticSleepRecord = {
  dataset: "synthetic",
  date: "2026-01-03",
  total_sleep_minutes: 430,
  sleep_score: 81,
};

function createMcpServer(): McpServer {
  const server = new McpServer({ name: APP_NAME, version: APP_VERSION });

  server.registerTool(
    SYNTHETIC_TOOL_NAME,
    {
      description: "Returns one clearly synthetic sleep record for local MCP protocol smoke testing. It is not Oura data.",
      inputSchema: z.object({}),
      outputSchema: z.object({
        dataset: z.literal("synthetic"),
        date: z.string(),
        total_sleep_minutes: z.number().int(),
        sleep_score: z.number().int(),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => ({
      content: [{ type: "text", text: "Synthetic local smoke-test record." }],
      structuredContent: syntheticSleepRecord,
    }),
  );

  return server;
}

function sendJson(response: ServerResponse, statusCode: number, value: unknown): void {
  const body = JSON.stringify(value);
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
  });
  response.end(body);
}

function requestPath(request: IncomingMessage): string {
  return new URL(request.url ?? "/", "http://127.0.0.1").pathname;
}

export function createAppServer(host = process.env.HOST ?? "127.0.0.1", port = Number(process.env.PORT ?? "8787")): Server {
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error("HOST must be 127.0.0.1, localhost, or ::1; this scaffold is local-only.");
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be an integer between 0 and 65535.");
  }

  const mcpHandler = createMcpHandler(createMcpServer);
  const nodeMcpHandler = toNodeHandler(mcpHandler);
  const validateHost = localhostHostValidation();
  const validateOrigin = localhostOriginValidation();

  return createHttpServer((request, response) => {
    void (async () => {
      try {
        if (!validateHost(request, response) || !validateOrigin(request, response)) return;

        const pathname = requestPath(request);
        if (pathname === "/health") {
          if (request.method !== "GET") {
            response.setHeader("allow", "GET");
            response.writeHead(405);
            response.end();
            return;
          }
          sendJson(response, 200, { status: "ok" });
          return;
        }

        if (pathname === "/mcp") {
          await nodeMcpHandler(request, response);
          return;
        }

        response.writeHead(404);
        response.end();
      } catch (error) {
        if (!response.headersSent) {
          response.writeHead(500);
          response.end();
        }
        const errorName = error instanceof Error ? error.name : "UnknownError";
        console.error("[server] request failed", errorName);
      }
    })();
  });
}

function start(): void {
  const host = process.env.HOST ?? "127.0.0.1";
  const port = Number(process.env.PORT ?? "8787");
  let server: Server;
  try {
    server = createAppServer(host, port);
  } catch {
    console.error("[server] startup failed", "INVALID_CONFIGURATION");
    process.exitCode = 1;
    return;
  }

  server.on("error", (error: NodeJS.ErrnoException) => {
    console.error("[server] startup failed", error.code ?? error.name);
    process.exitCode = 1;
  });
  server.listen(port, host, () => {
    const address = server.address();
    const boundPort = typeof address === "object" && address !== null ? address.port : port;
    console.error(`[server] listening on ${host}:${boundPort}`);
  });
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  start();
}
