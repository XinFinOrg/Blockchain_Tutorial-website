const mongoose = require("mongoose");

const mongooseSchema = mongoose.Schema(
  {
    isSubmitted: Boolean,
    isKycVerified: Boolean,
    kycStatus: { type: String, default: "pending", enum: ["pending", "rejected", "approved"] },
    name: String,
    email: { type: String, unique: true },
    dob: String,
    kycNo: String,
    address: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    img: {
      selfie: String,
      kycFrontImg: String,
      kycBackImg: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("kycUser", mongooseSchema);
