const express = require("express");
const app = express();
const { userRouter, blogRouter } = require("./routes");
const mongoose = require("mongoose");
const { generateFakeData } = require("../faker2");

const server = async () => {
  try {
    const { MONGO_URL } = process.env;
    if (!MONGO_URL) throw new Error("MONGO_URL Required");
    await mongoose.connect(MONGO_URL), { useCreateIndex: true };
    mongoose.set("debug", true);
    console.log(`Mongo Connceted`);
    app.use(express.json());
    app.use("/user", userRouter);
    app.use("/blog", blogRouter);
    app.listen(3000, async () => {
      // await generateFakeData(10, 2, 10);
    });
  } catch (err) {
    console.log(err);
  }
};

server();
