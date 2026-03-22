import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder";

const adapter = new PrismaPg({ connectionString });

declare global {
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}
