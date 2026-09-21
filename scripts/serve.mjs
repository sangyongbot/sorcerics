// Minimal static dev server with HTTP/1.1 keep-alive, correct WebP MIME, and
// long-cache headers for the frame sequence. Python's http.server closes the
// connection per request (HTTP/1.0), which makes many small frame requests slow;
// keep-alive lets the browser reuse one connection.
//
//   node scripts/serve.mjs [port]
import http from "node:http";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2]) || 8123;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

const server = http.createServer(async (req, res) => {
  try {
    let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (rel === "/") rel = "/index.html";
    const filePath = path.join(ROOT, path.normalize(rel));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403).end(); return; }

    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat || !stat.isFile()) { res.writeHead(404).end("Not found"); return; }

    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": stat.size,
      "Connection": "keep-alive",
    };
    // Frames are content-addressed by name and never change -> cache hard.
    headers["Cache-Control"] = rel.startsWith("/frames/")
      ? "public, max-age=31536000, immutable"
      : "no-cache";

    res.writeHead(200, headers);
    if (req.method === "HEAD") { res.end(); return; }
    createReadStream(filePath).pipe(res);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
});

server.keepAliveTimeout = 60000;
server.listen(PORT, "127.0.0.1", () => {
  console.log(`serving ${ROOT} at http://127.0.0.1:${PORT}`);
});
