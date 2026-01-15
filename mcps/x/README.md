# X MCP Server

A Model Context Protocol (MCP) server for X (Twitter) integration that provides tools for reading your timeline and engaging with tweets. Designed for use with Claude desktop.

<a href="https://glama.ai/mcp/servers/5nx3qqiunw"><img width="380" height="200" src="https://glama.ai/mcp/servers/5nx3qqiunw/badge" alt="X Server MCP server" /></a>

## Features

- Get tweets from your home timeline
- Create new tweets with optional image attachments
- Reply to tweets with optional image attachments
- Delete tweets
- Image upload support (PNG, JPEG, GIF, WEBP)
- Built-in security validation and file size limits
- Built-in rate limit handling for the free API tier
- TypeScript implementation with full type safety

## Prerequisites

- Node.js (v16 or higher)
- X (Twitter) Developer Account (Free)
- Claude desktop app

## Installation

1. Build the server:
```bash
npm install
npm run build
```

## Configuration

Add this to your MCP settings file (typically `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS).

```json
"x": {
  "command": "node",
  "args": ["/your_path/x/build/index.js"],
  "env": {
    "API_KEY": "your_api_key",
    "API_SECRET": "your_api_secret",
    "ACCESS_TOKEN": "your_access_token",
    "ACCESS_SECRET": "your_access_secret"
  }
}
```

> **Note**: Adjust the paths to match your actual repository location.

## X API Access

X (Twitter) provides a free tier for basic API access. You can access it at: https://developer.x.com/en/portal/products/free
