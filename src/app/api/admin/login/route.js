// src/app/api/admin/login/route.js
import connection from "../../../../../lib/mongo";
import User from "../../../../../models/User";

import bcrypt from "bcryptjs";

export async function POST(req) {
    try {
        const { email, pass } = await req.json();
        await connection();


        const ADMIN_EMAIL = "monal@billdesk.com";
        const ADMIN_PASS = "admin123";

        const user = await User.findOne({ email });
        if (!user || user.role !== "admin") {
            return new Response(JSON.stringify({ success: false, message: "Not an admin" }), { status: 401 });
        }

        const valid = await bcrypt.compare(pass, user.pass);
        if (!valid) {
            return new Response(JSON.stringify({ success: false, message: "Invalid credentials" }), { status: 401 });
        }

        return new Response(JSON.stringify({ success: true, message: "Admin logged in" }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500 });
    }
}
