#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_ENV_FILES = new Set(['.env.example', '.env.local.example']);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.pdf', '.zip',
]);

const SECRET_PATTERNS = [
  {
    name: 'Resend API Key (re_...)',
    regex: /\bre_[A-Za-z0-9_]{20,}\b/g,
    ignoreMatch: (m) => m.includes('your_resend_api_key'),
  },
  {
    name: 'Hardcoded JWT / Supabase Key (eyJ...)',
    regex: /\beyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: 'Supabase Personal/Secret Token',
    regex: /\b(?:sbp_[a-f0-9]{30,}|sb_secret_[A-Za-z0-9_-]{20,})\b/g,
  },
  {
    name: 'AWS / S3 Access Key ID',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    name: 'Private Key Block',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/g,
  },
  {
    name: 'Hardcoded Secret Assignment',
    regex: /(?:R2_SECRET_ACCESS_KEY|R2_ACCESS_KEY_ID|R2_TOKEN_VALUE|SUPABASE_SERVICE_ROLE_KEY|ADMIN_SECRET|ALLATYOU_RESEND_API_KEY|secretAccessKey)\s*[:=]\s*['"`]?([A-Za-z0-9/+_=-]{24,})['"`]?/g,
    ignoreMatch: (m) =>
      m.includes('your-') ||
      m.includes('your_') ||
      m.includes('process.env'),
  },
];

function getTrackedFiles() {
  try {
    const out = execSync('git ls-files', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out
      .split(/\r?\n/)
      .map((f) => f.trim())
      .filter(Boolean);
  } catch {
    // Fallback if git is unavailable in the build container (e.g., shallow image without .git)
    const results = [];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', '.next', '.git', 'out', 'dist'].includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          results.push(path.relative(process.cwd(), full).replace(/\\/g, '/'));
        }
      }
    }
    walk(process.cwd());
    return results;
  }
}

const files = getTrackedFiles();
const violations = [];

for (const file of files) {
  const base = path.basename(file);

  // 1. Verify no real .env files are tracked in git
  if (base.startsWith('.env') && !ALLOWED_ENV_FILES.has(base)) {
    // Only flag if tracked by git (in local fallback walk, .env.local exists on disk but is gitignored)
    try {
      execSync(`git ls-files --error-unmatch "${file}"`, { stdio: 'ignore' });
      violations.push(`[Archivo prohibido en Git] ${file}`);
    } catch {
      continue;
    }
  }

  const ext = path.extname(file).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) continue;
  if (!fs.existsSync(file)) continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, idx) => {
    for (const rule of SECRET_PATTERNS) {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(line)) !== null) {
        const fullMatch = match[0];
        if (rule.ignoreMatch && rule.ignoreMatch(fullMatch)) continue;
        const redacted =
          fullMatch.length > 12
            ? `${fullMatch.slice(0, 6)}...${fullMatch.slice(-4)}`
            : '***';
        violations.push(
          `[${rule.name}] en ${file}:${idx + 1} -> Detectado patrón sensible (${redacted})`
        );
      }
    }
  });
}

if (violations.length > 0) {
  console.error('\n🚨 ERROR DE SEGURIDAD: Se detectaron posibles llaves o secretos en el repositorio:\n');
  for (const v of violations) {
    console.error(`  ❌ ${v}`);
  }
  console.error('\nPor seguridad, el build/deploy ha sido bloqueado. Elimina las llaves del código y usa variables de entorno.\n');
  process.exit(1);
}

console.log('✅ Escaneo de seguridad completado: 0 llaves o archivos sensibles expuestos en el repositorio.');
