const fs = require("fs");
const path = require("path");

const STORAGE_ROOT = "/.storage";

const INTERVAL_MS = parseInt(
  process.env.RETENTION_INTERVAL_MS || "2 * 60 * 60 * 1000",
  10
);

// TTL por pasta: "24h", "7d", "30m"
function parseTTL(str) {
  if (!str) return null;
  
  const m = /^(\d+)\s*([smhd])$/.exec(str.trim());
  if (!m) return null;

  const value = parseInt(m[1], 10);
  const unit = m[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

const RULES = {
  images: parseTTL(process.env.RETENTION_TTL_IMAGES || "365d"),
  videos: parseTTL(process.env.RETENTION_TTL_VIDEOS || "365d"),
};

function cleanDir(relativeDir, maxAgeMs) {
  if (!maxAgeMs || maxAgeMs <= 0) {
    console.log(`[Retention] TTL desativado para ${relativeDir}`);
    return;
  }

  const base = path.join(STORAGE_ROOT, relativeDir);
  if (!fs.existsSync(base)) {
    console.log(`[Retention] Diretório não existe: ${base}`);
    return;
  }

  const now = Date.now();
  const files = fs.readdirSync(base);

  for (const f of files) {
    const fp = path.join(base, f);

    try {
      const stat = fs.statSync(fp);
      if (!stat.isFile()) continue;

      const age = now - stat.mtimeMs;
      if (age > maxAgeMs) {
        console.log(`[Retention] Deletando: ${fp}`);
        fs.unlinkSync(fp);
      }
    } catch (err) {
      console.error(`[Retention] Erro ao processar ${fp}:`, err.message);
    }
  }
}

function runOnce() {
  console.log("[Retention] Rodando ciclo de limpeza...");
  for (const [dir, ttl] of Object.entries(RULES)) {
    cleanDir(dir, ttl);
  }
  console.log("[Retention] Ciclo concluído.");
}

runOnce();
setInterval(runOnce, INTERVAL_MS);