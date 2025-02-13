const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: "Tour",
    required: [true, "Booking must belong to a tour!"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Booking must belong to a user!"],
  },
  price: {
    type: Number,
    required: [true, "Booking must have a price!"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paid: {
    type: Boolean,
    default: false,
    select: false,
  },
});

bookingSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.populate({
    path: "tour",
    select: "name duration",
  }).populate("user");
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
