const { default: mongoose } = require("mongoose");
const slugify = require("slugify");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxLength: [30, "A tour name must have at most 30 characters"],
      minLength: [10, "A tour name must have at least 10 characters"],
      // validate: [validator.isAlpha,"name must contain only characters"]
    },
    slug: String,
    duration: { type: Number, required: [true, "A tour must have a duration"] },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a max group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "difficulty is either easy,medium or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "rating must be above 1.0"],
      max: [5, "rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, "A tour must have a price"] },
    priceDiscount: {
      type: Number,
      validate: {
        //dont work on update , only on creation new tour
        validator: function (val) {
          // @ts-ignore
          return val < this.price;
        },
        message: "discount ({VALUE}) must be below the actual price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: { type: String, trim: true },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createAt: { type: Date, default: Date.now(), select: false },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

//DOCUMENT MIDDLEWARE runs befire .save() and .create()
tourSchema.pre("save", function (next) {
  // @ts-ignore
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre("save", function (next) {
  console.log("will save document..");
  next();
});

tourSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.populate({
    path: "guides",
    select: "-__v -passwordResetExpires -passwordResetToken",
  });

  next();
});

tourSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.find({ secretTour: { $ne: true } });
  // @ts-ignore
  this.start = Date.now();

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  // @ts-ignore
  console.log(`took: ${Date.now() - this.start} milliseconds`);
  next();
});

// tourSchema.pre("aggregate", function (next) {
//   // @ts-ignore
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
