# skills-and-mcps

Repository layout for Codex skills and MCP servers.

## Structure

- `skills/`
  - Codex skill packages (each folder contains a `SKILL.md`)
- `mcps/`
  - MCP servers (Node, Python, etc.)
- `.claude-plugin/marketplace.json`
  - Marketplace manifest for skill discovery via GitHub URL

## CC Switch / skill discovery

If a tool expects a GitHub URL with a marketplace manifest, point it at this repo. The manifest lives at `.claude-plugin/marketplace.json` and references `skills/` entries.

## MCP configuration example

```json
{
  "mcpServers": {
    "project-norms": {
      "command": "node",
      "args": ["/absolute/path/to/repo/mcps/project-norms/src/index.js"],
      "env": {
        "RULES_STORE_PATH": "/Users/cih1996/.mcp-data/project-norms/rules.json"
      }
    }
  }
}
```
