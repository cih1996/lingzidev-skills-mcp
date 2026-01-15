import { readFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';

async function loadEnvFile(path) {
  const text = await readFile(path, 'utf8');
  const env = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function main() {
  const fileEnv = await loadEnvFile(new URL('./.env', import.meta.url));
  const env = { ...process.env, ...fileEnv };

  const required = [
    'TWITTER_API_KEY',
    'TWITTER_API_SECRET',
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_SECRET',
  ];
  const missing = required.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`Missing env vars in .env: ${missing.join(', ')}`);
  }

  const client = new Client({ name: 'x-mcp-quick-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js'],
    cwd: process.cwd(),
    env,
    stderr: 'inherit',
  });

  await client.connect(transport);

  const tools = await client.request(
    { method: 'tools/list', params: {} },
    ListToolsResultSchema
  );
  console.log('tools:', tools.tools.map((t) => t.name).join(', '));

  const timeline = await client.request(
    { method: 'tools/call', params: { name: 'get_home_timeline', arguments: { limit: 1 } } },
    CallToolResultSchema
  );
  console.log('get_home_timeline:', timeline.content?.[0]?.text ?? timeline);

  await transport.close();
}

main().catch((error) => {
  console.error('test failed:', error?.message ?? error);
  process.exit(1);
});
