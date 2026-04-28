const { analyze } = require("../lib/agent");

const MAX_BODY_SIZE = 2 * 1024 * 1024;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readPayload(req);
    const report = await analyze(payload);
    sendJson(res, 200, report);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    sendJson(res, statusCode, {
      error: error.publicMessage || "Server error",
      detail: statusCode === 500 ? undefined : error.message
    });
  }
};

async function readPayload(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }

  const raw = await readRawBody(req);
  return raw ? JSON.parse(raw) : {};
}

function readRawBody(req) {
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

    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}
