// createAdmin.js
import dotenv from "dotenv";
dotenv.config(); // load .env variables


import bcrypt from "bcryptjs";
// import User from "./src/models/User";
import User from "./models/User.js";
// import connection from "./src/lib/mongo";
import connection from "./lib/mongo.js";

async function createAdmin() {
  await connection();

  const hashedPass = await bcrypt.hash("admin123", 10); // password you want

  // Check if admin already exists
  const existing = await User.findOne({ email: "monal@billdesk.com" });
  if (existing) {
    console.log("Admin already exists!");
    process.exit(0);
  }

  await User.create({
    email: "monal@billdesk.com",
    pass: hashedPass,
    role: "admin",
  });

  console.log("✅ Admin user created!");
  process.exit(0);
}

createAdmin().catch(console.error);
