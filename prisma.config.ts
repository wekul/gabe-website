import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  experimental: {
    externalTables: true,
  },
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  tables: {
    external: ["public.sessions", "public.visitors"],
  },
});
