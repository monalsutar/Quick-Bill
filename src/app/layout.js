import "./globals.css";
// import Link from "next/link";
import Head from "next/head";

export default function RootLayout({ children }) {
  return (
    <html lang="en" title="Bill Desk">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}
