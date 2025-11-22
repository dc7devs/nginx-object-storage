const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

const MEDIA_ROOT = process.env.MEDIA_ROOT || "/mnt/nfs";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const AUTH_USER = process.env.AUTH_USER || "kgcmina@admin";
const AUTH_PASS = process.env.AUTH_PASS || "kgcmina@admin";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(express.json());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: false,
  })
);

// Auth JWT
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};

  if (username !== AUTH_USER || password !== AUTH_PASS) {
    return res.status(401).json({ error: "credenciais inválidas" });
  }

  const token = jwt.sign({ sub: username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.json({ token });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "token não fornecido" });
  }

  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(401).json({ error: "token inválido ou expirado" });
  }
}

// serve arquivos do NFS
// /media/images/frame_0001.jpg -> /mnt/nfs/images/frame_0001.jpg
app.use("/media", authMiddleware, express.static(MEDIA_ROOT));

app.get("/", (req, res) => {
  res.send("OK");
});

const fs = require("fs");
app.get("/files", authMiddleware, (req, res) => {
  const dir = req.query.dir || ""; // ex: ?dir=cam1
  const target = path.join(MEDIA_ROOT, dir);

  fs.readdir(target, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "erro ao listar arquivos" });
    }

    res.json({
      directory: dir,
      files,
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend ouvindo em http://0.0.0.0:${PORT}`);
  console.log(`Servindo mídia de: ${MEDIA_ROOT}`);
});
