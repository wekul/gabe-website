import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { ensureDatabase } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/rbac";

function getSessionTimeoutSeconds() {
  const minutes = Number.parseInt(process.env.SESSION_TIMEOUT_MINUTES ?? "", 10);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 480 * 60;
  }

  return minutes * 60;
}

const sessionTimeoutSeconds = getSessionTimeoutSeconds();

export const authSecret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development" ? "local-dev-secret-change-me" : undefined);

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: sessionTimeoutSeconds,
  },
  jwt: {
    maxAge: sessionTimeoutSeconds,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await ensureDatabase();

        const login = credentials?.username?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!login || !password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ username: login }, { email: login }],
          },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            passwordHash: true,
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name ?? user.username,
          email: user.email ?? null,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as { role?: UserRole }).role ?? "viewer";
      }

      if (token.email && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "viewer";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as UserRole | undefined) ?? "viewer";
      }

      return session;
    },
  },
};
