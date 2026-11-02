import type { NextConfig } from "next";

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_SECRET",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
  "ALLATYOU_RESEND_API_KEY",
] as const;

const missingEnvVars = REQUIRED_ENV_VARS.filter(
  (key) => !process.env[key] || process.env[key]?.trim() === ""
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `\n❌ Error de despliegue: Faltan las siguientes variables de entorno obligatorias:\n` +
      missingEnvVars.map((key) => `   - ${key}`).join("\n") +
      `\n\nConfigúralas en Vercel (Settings -> Environment Variables) o en tu archivo .env.local antes de continuar.\n`
  );
}

let r2Hostname: string | undefined;
try {
  if (process.env.R2_PUBLIC_URL) {
    r2Hostname = new URL(process.env.R2_PUBLIC_URL).hostname;
  }
} catch {
  // Ignorar si R2_PUBLIC_URL no es una URL válida
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(r2Hostname
        ? [
            {
              protocol: "https" as const,
              hostname: r2Hostname,
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
    ],
  },
};

export default nextConfig;

