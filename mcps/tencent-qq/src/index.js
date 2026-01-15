#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import https from "https";

// Helper function to calculate g_tk for QZone
function calculateGTK(p_skey) {
  let hash = 5381;
  for (let i = 0; i < p_skey.length; i++) {
    hash += (hash << 5) + p_skey.charCodeAt(i);
  }
  return hash & 2147483647;
}

// Helper to parse cookies string to object
function parseCookies(cookieStr) {
  const cookies = {};
  if (!cookieStr) return cookies;
  
  cookieStr.split(';').forEach(item => {
    const parts = item.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies[key] = value;
    }
  });
  return cookies;
}

// Helper to extract QQ from cookies
function extractQQFromCookie(cookieStr) {
  try {
    const cookies = parseCookies(cookieStr);
    let uin = cookies['uin'] || '';
    if (!uin) return null;
    
    // Remove leading 'o' if present
    if (uin.startsWith('o')) {
      uin = uin.substring(1);
    }
    
    // Remove leading zeros
    const qq = uin.replace(/^0+/, '');
    return qq || uin;
  } catch (e) {
    console.error("[QQServer] Failed to extract QQ:", e);
    return null;
  }
}

// Helper to extract p_skey from cookies
function extractPSKeyFromCookie(cookieStr) {
  try {
    const cookies = parseCookies(cookieStr);
    const p_skey = cookies['p_skey'];
    return p_skey || null;
  } catch (e) {
    console.error("[QQServer] Failed to extract p_skey:", e);
    return null;
  }
}

class QQServer {
  constructor() {
    this.server = new Server(
      {
        name: "tencent-qq",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "qq.get_recent_contact",
            description: "Get recent messages/contacts",
            inputSchema: {
              type: "object",
              properties: {
                count: {
                  type: "number",
                  description: "Number of recent contacts to retrieve (default 10)",
                  default: 10
                },
                _context: {
                  type: "object",
                  description: "Context containing token and host"
                }
              }
            }
          },
          {
            name: "qq.send_group_msg",
            description: "Send a message to a group",
            inputSchema: {
              type: "object",
              properties: {
                group_id: {
                  type: "string",
                  description: "Target group ID"
                },
                message: {
                  type: "string",
                  description: "Content of the message"
                },
                _context: {
                  type: "object",
                  description: "Context containing token and host"
                }
              },
              required: ["group_id", "message"]
            }
          },
          {
            name: "qq.send_private_msg",
            description: "Send a private message to a user",
            inputSchema: {
              type: "object",
              properties: {
                user_id: {
                  type: "string",
                  description: "Target user ID"
                },
                message: {
                  type: "string",
                  description: "Content of the message"
                },
                _context: {
                  type: "object",
                  description: "Context containing token and host"
                }
              },
              required: ["user_id", "message"]
            }
          },
          {
            name: "qq.publish_qzone",
            description: "Publish a post to QZone",
            inputSchema: {
              type: "object",
              properties: {
                content: {
                  type: "string",
                  description: "Content of the post"
                },
                _context: {
                  type: "object",
                  description: "Context containing token and host"
                }
              },
              required: ["content"]
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // Extract context
      const context = args._context || {};
      const token = context.token || process.env.QQ_BOT_TOKEN;
      const host = context.host || process.env.QQ_API_BASE_URL;

      if (!token || !host) {
        throw new Error("Missing configuration: 'token' or 'host' must be provided in _context or environment variables (QQ_BOT_TOKEN, QQ_API_BASE_URL).");
      }

      // Clean host URL
      const baseUrl = host.replace(/\/$/, '');

      try {
        switch (name) {
          case "qq.get_recent_contact":
            return await this.handleGetRecentContact(baseUrl, token, args);
          case "qq.send_group_msg":
            return await this.handleSendGroupMsg(baseUrl, token, args);
          case "qq.send_private_msg":
            return await this.handleSendPrivateMsg(baseUrl, token, args);
          case "qq.publish_qzone":
            return await this.handlePublishQZone(baseUrl, token, args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async makeRequest(url, method, data, token) {
    const config = {
      method: method,
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: method === 'POST' ? data : undefined,
      params: method === 'GET' ? data : undefined,
      timeout: 30000,
      proxy: false  // Disable proxy to avoid connection issues
    };

    try {
      const response = await axios(config);
      const result = response.data;

      // Handle OneBot v11/v12 format: check retcode (status field is optional)
      if (result && typeof result === 'object' && 'retcode' in result) {
        if (result.retcode === 0) {
          return {
            success: true,
            content: result.data,
            error: null
          };
        } else {
          const errorMsg = result.message || result.wording || "API returned error";
          return {
            success: false,
            content: null,
            error: `API Error: ${errorMsg} (retcode: ${result.retcode})`
          };
        }
      }

      // If HTTP status is 200 but no retcode field, treat as success
      if (response.status === 200) {
        return {
          success: true,
          content: result,
          error: null
        };
      }

      // Otherwise it's an error
      return {
        success: false,
        content: null,
        error: `Unexpected response format`
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`Request failed: ${error.message} (Status: ${error.response.status})`);
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  async handleGetRecentContact(baseUrl, token, args) {
    const count = args.count || 10;
    const result = await this.makeRequest(`${baseUrl}/get_recent_contact`, 'POST', { count }, token);
    
    if (result.success) {
      return {
        content: [{ type: "text", text: JSON.stringify(result.content, null, 2) }]
      };
    } else {
      throw new Error(result.error);
    }
  }

  async handleSendGroupMsg(baseUrl, token, args) {
    const { group_id, message } = args;
    const messageArray = [
      {
        type: "text",
        data: { text: message }
      }
    ];

    const result = await this.makeRequest(`${baseUrl}/send_group_msg`, 'POST', {
      group_id,
      message: messageArray
    }, token);

    if (result.success) {
      return {
        content: [{ type: "text", text: JSON.stringify(result.content, null, 2) }]
      };
    } else {
      throw new Error(result.error);
    }
  }

  async handleSendPrivateMsg(baseUrl, token, args) {
    const { user_id, message } = args;
    const messageArray = [
      {
        type: "text",
        data: { text: message }
      }
    ];

    const result = await this.makeRequest(`${baseUrl}/send_private_msg`, 'POST', {
      user_id,
      message: messageArray
    }, token);

    if (result.success) {
      return {
        content: [{ type: "text", text: JSON.stringify(result.content, null, 2) }]
      };
    } else {
      throw new Error(result.error);
    }
  }

  async handlePublishQZone(baseUrl, token, args) {
    const { content } = args;
    
    // 1. Get cookies
    const cookiesResult = await this.makeRequest(`${baseUrl}/get_cookies`, 'POST', { domain: "qzone.qq.com" }, token);
    if (!cookiesResult.success || !cookiesResult.content || !cookiesResult.content.cookies) {
      throw new Error("Failed to get cookies: " + (cookiesResult.error || "Empty response"));
    }

    const cookiesStr = cookiesResult.content.cookies;
    
    // 2. Extract info
    const hostuin = extractQQFromCookie(cookiesStr);
    const p_skey = extractPSKeyFromCookie(cookiesStr);
    
    if (!hostuin) throw new Error("Failed to extract QQ from cookies");
    if (!p_skey) throw new Error("Failed to extract p_skey from cookies");
    
    const g_tk = calculateGTK(p_skey);
    
    // Debug logging
    console.error(`[QZone Debug] HostUIN: ${hostuin}, g_tk: ${g_tk}`);
    // Mask sensitive parts of cookie for logging
    const maskedCookies = cookiesStr.replace(/(p_skey=)[^;]+/, '$1***');
    console.error(`[QZone Debug] Cookies (masked): ${maskedCookies}`);

    // 3. Publish
    const qzoneUrl = `https://user.qzone.qq.com/proxy/domain/taotao.qzone.qq.com/cgi-bin/emotion_cgi_publish_v6?&g_tk=${g_tk}`;
    
    const formData = new URLSearchParams();
    formData.append('syn_tweet_verson', '1');
    formData.append('paramstr', '1');
    formData.append('pic_template', '');
    formData.append('richtype', '');
    formData.append('richval', '');
    formData.append('special_url', '');
    formData.append('subrichtype', '');
    formData.append('who', '1');
    formData.append('con', content);
    formData.append('feedversion', '1');
    formData.append('ver', '1');
    formData.append('ugc_right', '1');
    formData.append('to_sign', '0');
    formData.append('hostuin', hostuin);
    formData.append('code_version', '1');
    formData.append('format', 'fs');
    formData.append('qzreferrer', `https://user.qzone.qq.com/${hostuin}`);

    const agent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true
    });

    try {
      const response = await axios.post(qzoneUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Cookie': cookiesStr,
          'Referer': `https://user.qzone.qq.com/${hostuin}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        httpsAgent: agent,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        proxy: false  // Disable proxy to avoid connection issues with QZone
      });
      
      // Check status code (API returns 200 on success usually, content might need inspection but Python code just checked status)
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify({ 
            message: "Publish successful", 
            status_code: response.status,
            data: response.data 
          }, null, 2) 
        }]
      };
    } catch (error) {
      console.error(`[QZone Error] ${error.message}`);
      if (error.code) console.error(`[QZone Error Code] ${error.code}`);
      if (error.response) {
         console.error(`[QZone Error Response] Status: ${error.response.status}`);
         console.error(`[QZone Error Response] Data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`QZone Publish failed: ${error.message} (Code: ${error.code || 'unknown'})`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Tencent QQ MCP Server running on stdio");
  }
}

const server = new QQServer();
server.run().catch(console.error);
