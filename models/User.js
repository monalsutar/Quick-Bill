import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  
  phone: {
    type: String,
    required: false,   // ✅ make optional
    default: "",
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
  },
  
  pass: {
    type: String,
    required: false,   // ✅ make optional
    default: "",
  },
  
  role: {
    type: String,
    enum: ["admin", "worker"],
    default: "worker",
  },

  lastLogin: { type: Date },
  googleId: { type: String, default: "" },
  image: { type: String, default: "" }, // ✅ add this field
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
