import { spawn } from "node:child_process";
import net from "node:net";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import process from "node:process";

const host = "127.0.0.1";

function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, host, () => {
      const { port } = probe.address();
      probe.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

const port = await findAvailablePort();
const baseURL = `http://${host}:${port}`;
const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_ENABLE_SUPABASE_AUTH: "false",
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
  PLAYWRIGHT_BROWSERS_PATH: "0",
  PLAYWRIGHT_TEST_BASE_URL: baseURL,
};

async function waitForServer(server) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`O servidor local terminou antes de iniciar (código ${server.exitCode}).`);
    }

    try {
      const response = await fetch(baseURL, { signal: AbortSignal.timeout(3_000) });
      if (response.ok) return;
    } catch {
      // O Next pode precisar de alguns segundos para compilar a primeira rota.
    }

    await delay(500);
  }

  throw new Error("O servidor local não respondeu dentro de 120 segundos.");
}

async function stopServer(server) {
  if (server.exitCode !== null) return;
  server.kill();
  await Promise.race([once(server, "exit"), delay(5_000)]);
}

const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", host, "--port", String(port)],
  { env, stdio: "inherit" },
);

try {
  await waitForServer(server);

  const testProcess = spawn(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test", "--config=playwright.config.js", ...process.argv.slice(2)],
    { env, stdio: "inherit" },
  );
  const [exitCode] = await once(testProcess, "exit");
  process.exitCode = exitCode ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await stopServer(server);
}
