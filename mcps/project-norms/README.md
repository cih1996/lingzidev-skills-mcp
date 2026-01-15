# Project Norms MCP

Captures and applies project-wide norms scoped by framework (e.g., Vue, React). This server helps maintain consistency across different projects by recording user preferences and rules.

## Tools

- `record_rule`: Record a new global or feature-specific rule.
- `list_rules`: Retrieve applicable rules for a given framework and scope.

## Configuration

Add this to your MCP settings file (typically `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS).

```json
"project-norms": {
  "command": "node",
  "args": ["/your_path/project-norms/src/index.js"],
  "env": {
    "RULES_STORE_PATH": "/your_path/.mcp-data/project-norms/rules.json"
  }
}
```

> **Note**: Adjust the paths to match your actual repository location.
