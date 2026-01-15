# Repository Guidelines

## Project Structure & Module Organization
- `skills/` stores Codex skills; each skill lives in its own folder with a `SKILL.md`.
- `mcps/` contains MCP servers. The active server is `mcps/project-norms/` with source in `mcps/project-norms/src/index.js`.
- Root `README.md` explains usage and includes an MCP config example.

## Build, Test, and Development Commands
- `npm --prefix mcps/project-norms install` installs MCP server dependencies.
- `npm --prefix mcps/project-norms run start` runs the MCP server via `node src/index.js`.
- `npm --prefix mcps/project-norms run build` is a no-op placeholder that prints a message.

## Coding Style & Naming Conventions
- Use 2-space indentation in JavaScript and keep lines readable.
- Follow existing ES module style (`import ... from`), double quotes, and trailing commas only where already present.
- Prefer descriptive function names that match existing `normalize*` or `*Store` patterns.
- Keep environment variables in `SCREAMING_SNAKE_CASE` (e.g., `RULES_STORE_PATH`).

## Testing Guidelines
- No test framework or tests are defined yet. If you add tests, document the runner and add a corresponding npm script.
- When adding tests, name files with a `.test.js` suffix and keep them near the feature they exercise.

## Commit & Pull Request Guidelines
- Git history is minimal; no formal convention is enforced. Use concise, imperative commit subjects (e.g., "add rules filter").
- PRs should describe the change, list any configuration updates, and include example usage or logs when behavior changes.
- For MCP changes, include any new env vars or file paths in the PR description.

## Configuration Notes
- The MCP server expects Node.js >= 18.
- `RULES_STORE_PATH` controls where rule data is stored; default is `~/.mcp-data/project-norms/rules.json`.
