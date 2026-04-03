import NextAuth, { type User } from "next-auth";
import CredentialsProvider from "@auth/core/providers/credentials";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

const ONE_DAY_IN_SECONDS = 86400;

export const { handlers, signIn, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * ONE_DAY_IN_SECONDS },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        if (!credentials.email || !credentials.password) {
          return null;
        }
        const user = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            password: users.password,
            emailVerified: users.emailVerified,
          })
          .from(users)
          .where(eq(users.email, credentials.email.toString()))
          .limit(1);
        if (user.length === 0) return null;

        const isPasswordValid = await compare(
          credentials.password.toString(),
          user[0].password,
        );
        if (!isPasswordValid) return null;

        if (!user[0].emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
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
