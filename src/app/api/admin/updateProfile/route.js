import nc from "next-connect";
import multer from "multer";
// import User from "@/models/User";
// import connection from "@/lib/mongo";

import User from "../../../../../models/User";
import connection from "../../../../../lib/mongo";

import bcrypt from "bcrypt";
import { getServerSession } from "next-auth/next";

import { authOptions } from "../../auth/[...nextauth]/route";
// import { authOptions } from "../../../auth/[...nextauth]/route"; // adjusted path

const upload = multer({ storage: multer.memoryStorage() });

const handler = nc();

handler.put(async (req, res) => {
  await connection();

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const admin = await User.findOne({ email: session.user.email });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const name = req.body.name?.toString();
    const email = req.body.email?.toString();
    const password = req.body.password?.toString();

    const updateData = { name, email };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedAdmin = await User.findByIdAndUpdate(admin._id, updateData, { new: true });

    res.status(200).json({ success: true, admin: updatedAdmin });
  } catch (err) {
    console.error("UpdateProfile Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export const config = {
  api: {
    bodyParser: true, // now standard body parser is fine since no multer
  },
};

export default handler;