/**
 * H5 名片页后端服务
 * 纯 Node.js 实现，无第三方依赖
 * 功能：接收客户留言、持久化到本地 JSON、支持企微/飞书/通用 Webhook 通知
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// =================== 配置 ===================
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = process.env.SUBMISSIONS_FILE || path.join(DATA_DIR, 'submissions.json');
const NOTIFY_WEBHOOK_URL = process.env.NOTIFY_WEBHOOK_URL || '';
const NOTIFY_WEBHOOK_TYPE = process.env.NOTIFY_WEBHOOK_TYPE || 'generic'; // generic | wecom | feishu
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

// =================== 工具函数 ===================
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSubmissions() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[loadSubmissions] 解析失败，重置为空数组', e.message);
    return [];
  }
}

function saveSubmissions(list) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(String(phone));
}

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
  if (!ALLOWED_ORIGINS.length || ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
  }
  return headers;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, data, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers
  });
  res.end(JSON.stringify(data));
}

function sendStatic(res, filePath, contentType) {
  const data = fs.readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=3600'
  });
  res.end(data);
}

// =================== 通知 ===================
function buildNotifyPayload(type, submission) {
  const text = `【新客户留言】\n姓名：${submission.name}\n手机：${submission.phone}\n留言：${submission.message || '无'}\n时间：${submission.createdAt}\n来源：${submission.source || 'H5 名片页'}`;
  if (type === 'wecom') {
    return { msgtype: 'text', text: { content: text } };
  }
  if (type === 'feishu') {
    return { msg_type: 'text', content: { text } };
  }
  return { ...submission, notificationText: text };
}

function postWebhook(url, payload) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const data = JSON.stringify(payload);
    const options = {
      method: 'POST',
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const mod = parsed.protocol === 'https:' ? require('https') : require('http');
    const req = mod.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ ok: res.statusCode < 400, status: res.statusCode, body }));
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.write(data);
    req.end();
  });
}

async function notify(submission) {
  if (!NOTIFY_WEBHOOK_URL) return;
  const payload = buildNotifyPayload(NOTIFY_WEBHOOK_TYPE, submission);
  const result = await postWebhook(NOTIFY_WEBHOOK_URL, payload);
  if (!result.ok) {
    console.error('[notify] 通知发送失败', result);
  } else {
    console.log('[notify] 通知已发送');
  }
}

// =================== 路由 ===================
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // OPTIONS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(origin));
    res.end();
    return;
  }

  // 健康检查
  if (pathname === '/health' && req.method === 'GET') {
    send(res, 200, { status: 'ok', time: new Date().toISOString() }, corsHeaders(origin));
    return;
  }

  // 提交留言
  if (pathname === '/api/submit' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { name, phone, message, source } = body;

      if (!phone || !isValidPhone(phone)) {
        send(res, 422, { message: '请填写正确的 11 位手机号' }, corsHeaders(origin));
        return;
      }

      const submission = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: String(name || '匿名客户').slice(0, 30),
        phone: String(phone),
        message: String(message || '').slice(0, 500),
        source: String(source || '').slice(0, 500),
        createdAt: new Date().toISOString()
      };

      const list = loadSubmissions();
      list.unshift(submission);
      saveSubmissions(list);

      // 异步通知，不阻塞响应
      notify(submission).catch(err => console.error('[notify]', err));

      send(res, 200, { message: '提交成功', id: submission.id }, corsHeaders(origin));
    } catch (e) {
      console.error('[api/submit]', e);
      send(res, 400, { message: '请求格式错误' }, corsHeaders(origin));
    }
    return;
  }

  // 查看留言（简单保护：仅允许本地/内网访问）
  if (pathname === '/api/leads' && req.method === 'GET') {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.includes('192.168.') || clientIp.includes('10.');
    if (!isLocal) {
      send(res, 403, { message: '禁止访问' }, corsHeaders(origin));
      return;
    }
    const list = loadSubmissions();
    send(res, 200, { count: list.length, data: list }, corsHeaders(origin));
    return;
  }

  // 静态文件服务
  let filePath;
  let contentType = 'text/html; charset=utf-8';
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(__dirname, 'index.html');
  } else if (pathname.startsWith('/assets/')) {
    filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else contentType = 'application/octet-stream';
  } else {
    send(res, 404, { message: 'Not Found' }, corsHeaders(origin));
    return;
  }

  if (!fs.existsSync(filePath)) {
    send(res, 404, { message: '文件不存在' }, corsHeaders(origin));
    return;
  }

  sendStatic(res, filePath, contentType);
});

server.listen(PORT, () => {
  console.log(`[server] H5 名片后端已启动：http://localhost:${PORT}`);
  console.log(`[server] 数据文件：${DATA_FILE}`);
  console.log(`[server] 通知 Webhook：${NOTIFY_WEBHOOK_URL || '未配置'}`);
});
