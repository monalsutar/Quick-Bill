import mongoose from "mongoose";

const BillSchema = new mongoose.Schema({
  customerName: String,
  items: Array,
  totalAmount: Number,
  date: { type: Date, default: Date.now },
  local_id: String, // optional: for syncing duplicates
},{ timestamps: true });

export default mongoose.models.Bill || mongoose.model("Bill", BillSchema);
