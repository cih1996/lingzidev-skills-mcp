import axios from 'axios';
import https from 'https';

// --- Configuration ---
const config = {
  baseUrl: "http://129.204.22.176:3055",
  token: "cih1996aaak990"
};

// --- Helpers ---
function calculateGTK(p_skey) {
  let hash = 5381;
  for (let i = 0; i < p_skey.length; i++) {
    hash += (hash << 5) + p_skey.charCodeAt(i);
  }
  return hash & 2147483647;
}

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

function extractQQFromCookie(cookieStr) {
  try {
    const cookies = parseCookies(cookieStr);
    let uin = cookies['uin'] || '';
    if (!uin) return null;
    if (uin.startsWith('o')) uin = uin.substring(1);
    const qq = uin.replace(/^0+/, '');
    return qq || uin;
  } catch (e) {
    return null;
  }
}

function extractPSKeyFromCookie(cookieStr) {
  try {
    const cookies = parseCookies(cookieStr);
    return cookies['p_skey'] || null;
  } catch (e) {
    return null;
  }
}

// --- Test Content ---
const contentToPublish = `🚀 开源项目分享：lingzidev-skills-mcp

一个为 Claude Code 打造的技能和 
MCP 服务器集合，让 AI 助手能力更强大！

✨ 核心功能：
• 项目规范管理：自动记录和应用开发规范（支持 Vue/React 等框架）
• QQ 集成：通过 NapCatQQ 实现消息发送和 QZone 发布
• X (Twitter) 集成：读取时间线、发推文、互动回复
• 视频转 GIF：自动化媒体处理工具

🔧 技术栈：Node.js + MCP (Model Context Protocol)

项目地址： https://github.com/cih1996/lingzidev-skills-mcp`;

// --- Test Logic ---
async function testRepro() {
  console.log("Starting Repro Test...");
  
  const agent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
  });

  try {
    // 1. Get Cookies
    const cookiesRes = await axios.post(`${config.baseUrl}/get_cookies`, {
      domain: "qzone.qq.com"
    }, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (cookiesRes.data.retcode !== 0) throw new Error("Failed to get cookies");
    const cookiesStr = cookiesRes.data.data.cookies;
    
    // 2. Extract Info
    const hostuin = extractQQFromCookie(cookiesStr);
    const p_skey = extractPSKeyFromCookie(cookiesStr);
    const g_tk = calculateGTK(p_skey);
    
    console.log(`Info extracted - HostUIN: ${hostuin}, g_tk: ${g_tk}`);

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
    formData.append('con', contentToPublish);
    formData.append('feedversion', '1');
    formData.append('ver', '1');
    formData.append('ugc_right', '1');
    formData.append('to_sign', '0');
    formData.append('hostuin', hostuin);
    formData.append('code_version', '1');
    formData.append('format', 'fs');
    formData.append('qzreferrer', `https://user.qzone.qq.com/${hostuin}`);

    console.log("Publishing content...");
    const publishRes = await axios.post(qzoneUrl, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Cookie': cookiesStr,
        'Referer': `https://user.qzone.qq.com/${hostuin}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      httpsAgent: agent
    });

    console.log("Status:", publishRes.status);
    console.log("Data:", JSON.stringify(publishRes.data, null, 2));

  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRepro();
