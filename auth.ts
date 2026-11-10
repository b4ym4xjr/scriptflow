import NextAuth, { type User } from "next-auth";
import CredentialsProvider from "@auth/core/providers/credentials";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { compare } from "bcryptjs";
import { ipFromHeaders, rateLimit } from "@/lib/rate-limit";

const ONE_DAY_IN_SECONDS = 86400;

const TEN_MINUTES = 10 * 60 * 1000;
const MAX_FIELD_LENGTH = 1024;

/**
 * A real bcrypt hash of a random string. Compared against when the account
 * doesn't exist so "unknown email" costs the same as "wrong password" and
 * response time can't be used to discover which emails are registered.
 */
const DUMMY_HASH =
  "$2b$12$zCzHR2ubuyY/tEjfAfAGwuMmxcu7hk6pkAhQSaSe7y/0poBUQzAre";

export const { handlers, signIn, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * ONE_DAY_IN_SECONDS },
  providers: [
    CredentialsProvider({
      async authorize(credentials, request) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (
          !email ||
          !password ||
          email.length > MAX_FIELD_LENGTH ||
          password.length > MAX_FIELD_LENGTH
        ) {
          return null;
        }

        // This is also reachable directly via POST /api/auth/callback/credentials,
        // so throttling has to live here and not only in the sign-in server action.
        const ip = request ? ipFromHeaders(request.headers) : "unknown";
        const byIp = rateLimit(`signin:ip:${ip}`, 30, TEN_MINUTES);
        const byEmail = rateLimit(`signin:email:${email}`, 8, TEN_MINUTES);
        if (!byIp.ok || !byEmail.ok) {
          throw new Error("RATE_LIMITED");
        }

        const found = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            password: users.password,
            emailVerified: users.emailVerified,
          })
          .from(users)
          .where(sql`lower(${users.email}) = ${email}`)
          .limit(1);

        const user = found[0];
        // Always run exactly one bcrypt comparison.
        const isPasswordValid = await compare(
          password,
          user ? user.password : DUMMY_HASH,
        );
        if (!user || !isPasswordValid) return null;

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        } as User;
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
});
