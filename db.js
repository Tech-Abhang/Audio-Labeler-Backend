require("dotenv").config();
const mongoose = require("mongoose");
const {
  initializeLabelerList,
} = require("./utils/lib");
const mongoURI = process.env.MONGO_URI;

const connectToMongo = async () => {
  await mongoose
    .connect(mongoURI)
    .then(async () => {
      console.log("MongoDB connected!");
      await initializeLabelerList();
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = connectToMongo;