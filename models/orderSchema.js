const mongoose = require("mongoose");
const { Schema } = mongoose;

// Counter schema to manage sequential order IDs
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

const orderSchema = new Schema({
  orderId: {
    type: String,
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  OrderedItems: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      size: {
        type: String,
        required: true,
        enum: ["S", "M", "L", "XL", "XXL"],
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  finalAmount: {
    type: Number,
    required: true,
  },
  address: {
    type: Schema.Types.ObjectId,
    ref: "Address",
    required: true,
  },
  invoiceDate: {
    type: Date,
  },
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned"],
  },
  createdOn: {
    type: Date,
    default: Date.now(),
    required: true,
  },
  couponApplied: {
    type: Boolean,
    default: false,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending",
  },
});

// Pre-save hook to generate sequential orderId
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "orderId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.orderId = `ORD${String(counter.seq).padStart(4, "0")}`; // e.g., ORD0001
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;