# Tencent QQ MCP

Provides QQ integration via [NapCatQQ](https://github.com/NapNeko/NapCatQQ). This server allows you to send messages and publish QZone posts.

## Prerequisites

- A running instance of NapCatQQ (or compatible OneBot implementation).
- `QQ_BOT_TOKEN` and `QQ_API_BASE_URL` for the NapCat instance.

## Tools

- `qq.get_recent_contact`: Get recent messages/contacts.
- `qq.send_group_msg`: Send a message to a group.
- `qq.send_private_msg`: Send a private message to a user.
- `qq.publish_qzone`: Publish a post to QZone.

## Configuration

Add this to your MCP settings file (typically `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS).

```json
"tencent-qq": {
  "command": "node",
  "args": ["/your_path/tencent-qq/src/index.js"],
  "env": {
    "QQ_BOT_TOKEN": "cih1996aaak990",
    "QQ_API_BASE_URL": "http://127.0.0.1:3000"
  }
}
```

> **Note**: Adjust the paths to match your actual repository location.
