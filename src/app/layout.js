"use client";

import "./globals.css";
// import Link from "next/link";

import { SessionProvider } from "next-auth/react";


export default function RootLayout({ children }) {
  return (
    <html lang="en" title="Quick Bill">
      <title>Quick Bill</title>
      <link rel="icon" href="/quickbill-icon.png" type="image/png" />
      <body className="bg-gray-50">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
