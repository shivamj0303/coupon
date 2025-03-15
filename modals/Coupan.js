const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true },
    assignedTo: { type: String, default: null },  // Store IP or Cookie
    claimedAt: { type: Date, default: null },
});

module.exports = mongoose.model("Coupon", couponSchema);
