const fs = require("fs");
const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const Review = require("../models/reviewModel");

const dotenv = require("dotenv");
dotenv.config();

const { default: mongoose } = require("mongoose");
// @ts-ignore
const DB = process.env.DATABASE.replace(
  "<db_password>",
  // @ts-ignore
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then((con) => {
  console.log("connection successful!");
});
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/data/tours.json`, "utf-8")
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/data/users.json`, "utf-8")
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/data/reviews.json`, "utf-8")
);
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log("Data imported successfully!");
  } catch (err) {
    console.error("Error importing data", err);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await Review.deleteMany();
    await User.deleteMany();

    console.log("Data deleted successfully!");
  } catch (err) {
    console.error("Error deleting data", err);
  }
  process.exit();
};

if (process.argv[2] == "--import") {
  importData();
} else if (process.argv[2] == "--delete") {
  deleteData();
}
