// src/auth.js
import NextAuth from "next-auth"; // Impor dari 'next-auth'
import { DrizzleAdapter } from "@auth/drizzle-adapter"; // Impor dari '@next-auth/drizzle-adapter'
import { db } from "@/db/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import CredentialsProvider from "next-auth/providers/credentials"; // Perhatikan nama CredentialsProvider
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// Fungsi auth, signIn, signOut akan diekspor dari handler di route.js
// Untuk next-auth v4, kita tidak langsung mendestrukturisasi handlers di sini
// melainkan mengekspor handler dari file [...nextauth].
export const authOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    CredentialsProvider({
      // Gunakan CredentialsProvider
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Logika autentikasi untuk admin123
        if (
          credentials.username === "admin123" &&
          credentials.password === "123456"
        ) {
          return {
            id: "b67fcb00-62e8-11f0-b5ee-448763b8acc4",
            name: "Administrator",
            email: "admin@example.com",
            role: "admin", // Tetapkan peran 'admin'
          };
        }

        // Untuk user biasa yang terdaftar di DB
        const userFound = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.email, credentials.username),
        });

        if (userFound) {
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
  cookies: {
    name: "next-auth.session-token",
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      // Setting 'expires: false' makes it a session cookie,
      // which browsers typically clear when the browser window is closed.
      expires: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now in milliseconds
    },
  },
  callbacks: {
    // Untuk next-auth v4, 'user' adalah objek yang dikembalikan dari authorize()
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    // Untuk next-auth v4, 'session' adalah objek sesi, 'token' adalah dari callback jwt
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.id;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET,
};

// Di Next.js App Router, Anda perlu mengekspor handler dari file [...nextauth]/route.js
// Jadi, file ini hanya mengekspor authOptions.
// Fungsi auth, signIn, signOut akan diimpor dari 'next-auth' atau 'next-auth/react' di tempat lain.
