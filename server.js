const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { analyze } = require("./lib/agent");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const MAX_BODY_SIZE = 2 * 1024 * 1024;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`AI Job Agent is running at http://localhost:${PORT}`);
});

async function handleRequest(req, res) {
  try {
    if (req.method === "POST" && req.url === "/api/analyze") {
      const payload = await readJsonBody(req);
      const report = await analyze(payload);
      sendJson(res, 200, report);
      return;
    }

    if (req.method === "GET") {
      await serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    sendJson(res, statusCode, {
      error: error.publicMessage || "Server error",
      detail: statusCode === 500 ? undefined : error.message
    });
  }
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const decodedPath = decodeURIComponent(requestedPath);
  const filePath = path.normalize(path.join(PUBLIC_DIR, decodedPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
    throw error;
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw) > MAX_BODY_SIZE) {
        const error = new Error("Request body is too large");
        error.statusCode = 413;
        error.publicMessage = "输入内容过长，请缩短简历或 JD 后重试。";
        reject(error);
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        error.statusCode = 400;
        error.publicMessage = "请求 JSON 格式错误。";
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}
