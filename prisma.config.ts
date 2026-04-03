import { defineConfig } from "prisma/config";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually since dotenv only reads .env
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^([^=]+)=["']?(.+?)["']?\s*$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    }
  }
}

loadEnvLocal();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
