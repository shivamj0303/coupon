const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Coupon = mongoose.model("Coupon", new mongoose.Schema({ code: String, assignedTo: String, claimedAt: Date }));

const coupons = ["SAVE10", "DISCOUNT20", "OFFER30", "SALE40"].map(code => ({ code }));

Coupon.insertMany(coupons)
    .then(() => {
        console.log("✅ Coupons Added");
        mongoose.connection.close();
    })
    .catch(err => console.log(err));
