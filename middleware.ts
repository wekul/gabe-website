import { withAuth } from "next-auth/middleware";

const authSecret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development" ? "local-dev-secret-change-me" : undefined);

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: authSecret,
});

export const config = {
  matcher: ["/admin/:path*"],
};
