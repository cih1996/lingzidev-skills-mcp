import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "project-norms",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

const DEFAULT_STORE_PATH = process.env.RULES_STORE_PATH
  ? path.resolve(process.env.RULES_STORE_PATH)
  : path.resolve(os.homedir(), ".mcp-data", "project-norms", "rules.json");

const MAX_RULES = Number(process.env.RULES_MAX ?? "2000");

function normalizeFramework(framework) {
  const value = (framework ?? "generic").trim().toLowerCase();
  return value.length > 0 ? value : "generic";
}

function normalizeScope(scope) {
  const value = (scope ?? "project").trim().toLowerCase();
  if (value === "project" || value === "feature") {
    return value;
  }
  return "project";
}

function normalizeStrength(strength) {
  const value = (strength ?? "forbid").trim().toLowerCase();
  if (value === "forbid" || value === "avoid" || value === "prefer") {
    return value;
  }
  return "forbid";
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter((tag) => tag.length > 0);
}

async function ensureStorePath(storePath) {
  const dir = path.dirname(storePath);
  await fs.mkdir(dir, { recursive: true });
}

async function loadStore(storePath = DEFAULT_STORE_PATH) {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || !Array.isArray(data.rules)) {
      return { version: 1, rules: [] };
    }
    return {
      version: Number(data.version ?? 1),
      rules: data.rules
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return { version: 1, rules: [] };
    }
    throw error;
  }
}

async function saveStore(store, storePath = DEFAULT_STORE_PATH) {
  await ensureStorePath(storePath);
  const payload = JSON.stringify(store, null, 2);
  await fs.writeFile(storePath, payload, "utf8");
}

function filterRules(rules, filters) {
  const frameworks = Array.isArray(filters.frameworks)
    ? filters.frameworks.map(normalizeFramework)
    : [];
  const includeGeneric = filters.include_generic !== false;
  const scope = filters.scope ? normalizeScope(filters.scope) : null;
  const strength = filters.strength ? normalizeStrength(filters.strength) : null;
  const query = filters.text_query ? String(filters.text_query).toLowerCase() : null;

  return rules.filter((rule) => {
    const frameworkMatch = frameworks.length === 0
      ? true
      : frameworks.includes(rule.framework) || (includeGeneric && rule.framework === "generic");
    if (!frameworkMatch) {
      return false;
    }
    if (scope && rule.scope !== scope) {
      return false;
    }
    if (strength && rule.strength !== strength) {
      return false;
    }
    if (query && !rule.text.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "record_rule",
      description: "Record a project-wide rule or preference scoped to a framework.",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "The rule text (e.g. 'Do not use font icons')." },
          framework: { type: "string", description: "Framework name, e.g. 'vue', 'react'." },
          scope: {
            type: "string",
            enum: ["project", "feature"],
            description: "Scope of the rule. Use 'project' for global rules."
          },
          strength: {
            type: "string",
            enum: ["forbid", "avoid", "prefer"],
            description: "How strong the rule is. Use 'forbid' for strict prohibitions."
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Optional tags for grouping rules."
          },
          source: {
            type: "string",
            description: "Optional note about who or where the rule came from."
          }
        },
        required: ["text"]
      }
    },
    {
      name: "list_rules",
      description: "List recorded rules with optional filters.",
      inputSchema: {
        type: "object",
        properties: {
          frameworks: {
            type: "array",
            items: { type: "string" },
            description: "Frameworks to include (e.g. ['vue'])."
          },
          include_generic: {
            type: "boolean",
            description: "Include rules with framework 'generic'. Default true."
          },
          scope: {
            type: "string",
            enum: ["project", "feature"],
            description: "Filter by rule scope."
          },
          strength: {
            type: "string",
            enum: ["forbid", "avoid", "prefer"],
            description: "Filter by rule strength."
          },
          text_query: {
            type: "string",
            description: "Filter by substring match in rule text."
          },
          limit: {
            type: "number",
            description: "Maximum number of rules to return (default 100)."
          }
        }
      }
    },
    {
      name: "remove_rule",
      description: "Remove a rule by id.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Rule id." }
        },
        required: ["id"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params ?? {};
  if (!name) {
    throw new Error("Missing tool name");
  }

  if (name === "record_rule") {
    if (!args || typeof args.text !== "string" || args.text.trim().length === 0) {
      throw new Error("record_rule requires non-empty text");
    }
    const store = await loadStore();
    const framework = normalizeFramework(args.framework);
    const scope = normalizeScope(args.scope);
    const strength = normalizeStrength(args.strength);
    const tags = normalizeTags(args.tags);
    const now = new Date().toISOString();

    const normalizedText = args.text.trim();
    const existing = store.rules.find((rule) =>
      rule.text === normalizedText &&
      rule.framework === framework &&
      rule.scope === scope &&
      rule.strength === strength
    );

    if (existing) {
      existing.updatedAt = now;
      existing.tags = tags.length > 0 ? tags : existing.tags;
      existing.source = args.source ?? existing.source;
      await saveStore(store);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "exists",
              rule: existing
            })
          }
        ]
      };
    }

    if (store.rules.length >= MAX_RULES) {
      throw new Error(`Rule limit reached (${MAX_RULES}). Remove old rules first.`);
    }

    const rule = {
      id: crypto.randomUUID(),
      text: normalizedText,
      framework,
      scope,
      strength,
      tags,
      source: args.source ?? null,
      createdAt: now,
      updatedAt: now
    };

    store.rules.push(rule);
    await saveStore(store);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "created",
            rule
          })
        }
      ]
    };
  }

  if (name === "list_rules") {
    const store = await loadStore();
    const filtered = filterRules(store.rules, args ?? {});
    const limit = typeof args?.limit === "number" && args.limit > 0
      ? Math.floor(args.limit)
      : 100;
    const trimmed = filtered.slice(0, limit);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            count: trimmed.length,
            rules: trimmed
          })
        }
      ]
    };
  }

  if (name === "remove_rule") {
    if (!args || typeof args.id !== "string" || args.id.trim().length === 0) {
      throw new Error("remove_rule requires id");
    }
    const store = await loadStore();
    const before = store.rules.length;
    store.rules = store.rules.filter((rule) => rule.id !== args.id);
    const removed = before - store.rules.length;
    if (removed > 0) {
      await saveStore(store);
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            removed
          })
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
