const dotenv = require("dotenv");
dotenv.config();

process.on("uncaughtException", (err) => {
  // console.log(err.name, err.message);
  console.log(err)
  process.exit(1);
});

const app = require("./app");
const { default: mongoose } = require("mongoose");
// @ts-ignore
const DB = process.env.DATABASE.replace(
  "<db_password>",
  // @ts-ignore
  process.env.DATABASE_PASSWORD
);

// @ts-ignore
mongoose.connect(DB).then((con) => {
  console.log("connection successful!");
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port} ...`);
});

process.on("unhandledRejection", (err) => {
  // @ts-ignore
  console.log(err.name, err.message);
  server.close(() => {
    console.log("Server closed due to unhandled rejection");
    process.exit(1);
  });
});
