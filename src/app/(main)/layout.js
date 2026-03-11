"use client";
import { SessionProvider } from "next-auth/react";

export default function MainLayout({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
