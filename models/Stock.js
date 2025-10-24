import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  quantityAvailable: { type: Number, required: true },
  gstRate: { type: Number, default: 0 },
  dateAdded: { type: Date, default: Date.now },
});

export default mongoose.models.Stock || mongoose.model("Stock", stockSchema);
