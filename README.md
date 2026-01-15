# skills-and-mcps

Repository layout for Codex skills and MCP servers.

## Structure

- `skills/`
  - Codex skill packages (each folder contains a `SKILL.md`)
- `mcps/`
  - MCP servers (Node, Python, etc.)
- `.claude-plugin/marketplace.json`
  - Marketplace manifest for skill discovery via GitHub URL

## MCP Servers Overview

| MCP Server | Description | Configuration |
| :--- | :--- | :--- |
| [project-norms](mcps/project-norms/README.md) | Captures and applies project-wide norms scoped by framework. | [View Config](mcps/project-norms/README.md#configuration) |
| [tencent-qq](mcps/tencent-qq/README.md) | Provides QQ integration via NapCatQQ (messaging, QZone). | [View Config](mcps/tencent-qq/README.md#configuration) |
| [x](mcps/x/README.md) | Integrates with X (Twitter) for timeline reading and posting. | [View Config](mcps/x/README.md#configuration) |
