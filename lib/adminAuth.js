// lib/adminAuth.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../path/to/nextauth/options"; // if you export it, else import handler

export async function requireAdmin(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return session;
}
