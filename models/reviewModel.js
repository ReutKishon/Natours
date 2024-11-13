// @ts-ignore
const { type } = require("express/lib/response");
const { default: mongoose } = require("mongoose");
// @ts-ignore
const { create } = require("./tourModel");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema({
  review: { type: String, require: [true, "review can not be empty"] },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: { type: Date, default: Date.now() },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    require: [true, "review must belong to a user"],
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: "Tour",
    require: [true, "review must belong to a tour"],
  },
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.populate({
    path: "user",
    select: "name",
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // @ts-ignore
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  // @ts-ignore
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      // @ts-ignore
      ratingsQuantity: stats[0].nRating,
      // @ts-ignore
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post("save", function () {
  // @ts-ignore
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // @ts-ignore
  this.review = await this.clone().findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // @ts-ignore
  if (this.review) {
    // @ts-ignore

    await this.review.constructor.calcAverageRatings(this.review.tour);
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
