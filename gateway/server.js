const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-change-me";
const AUTH_USER = process.env.AUTH_USER || "kgcmina@admin";
const AUTH_PASS = process.env.AUTH_PASS || "kgcmina@admin";
const MEDIA_BASE_URL = process.env.MEDIA_BASE_URL || "http://localhost:8080";

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: false,
  })
);

app.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};

  if (username !== AUTH_USER || password !== AUTH_PASS) {
    return res.status(401).json({ error: "credenciais inválidas" });
  }

  const token = jwt.sign(
    { sub: username, type: "login" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.json({ token });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "token não fornecido" });
  }

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== "login") {
      return res.status(403).json({ error: "token inválido para esta operação" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "token inválido ou expirado" });
  }
}

// { "path": "/images/cam1/frame_123.jpg" }
app.post("/media/sign", authMiddleware, (req, res) => {
  const { path } = req.body || {};

  if (!path) {
    return res.status(400).json({ error: "campo 'path' é obrigatório" });
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `/media${cleanPath}`;

  const token = jwt.sign({ url }, JWT_SECRET, {
    expiresIn: "365d",
  });

  return res.json({
    signed_url: `${MEDIA_BASE_URL}${url}?token=${token}`,
    expires_in_seconds: 31536000,
  });
});

app.get("/media/*", (req, res) => {
  const originalUri = req.headers["x-original-uri"] || req.originalUrl || "";

  let token = req.query.token;
  if (!token) {
    const m = originalUri.match(/token=([^&]+)/);
    if (m) token = m[1];
  }

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (!payload.url) {
      return res.sendStatus(403);
    }

    const pathWithoutQuery = (originalUri.split("?")[0]) || "";
    if (pathWithoutQuery !== payload.url) {
      return res.sendStatus(403);
    }

    // /media/... -> /internal/media/... 
    const internalPath = `/internal${payload.url}`;
    console.log("✅ Liberando via X-Accel-Redirect:", internalPath);

    res.setHeader("X-Accel-Redirect", internalPath);
    return res.status(200).end();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.sendStatus(401);
  }
});

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Gateway ouvindo em http://0.0.0.0:${PORT}`);
});
