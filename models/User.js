import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    pass: {
        type: String,
        required: true
    }, // hashed password if you use email/pass auth
    name: { type: String },
    role: {
        type: String,
        enum: ["admin", "worker"],
        default: "worker"
    },
    lastLogin: { type: Date },

    googleId: { type: String },
    // other fields...
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
