// src/auth.js
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Untuk user biasa yang terdaftar di DB
        const userFound = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.email, credentials.username),
        });

        if (userFound && userFound.password) {
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            userFound.password
          );

          if (passwordMatch) {
            return {
              id: userFound.id,
              name: userFound.name,
              email: userFound.email,
              role: userFound.role || "user",
            };
          }
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET,
});
