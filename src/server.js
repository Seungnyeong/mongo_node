const express = require("express");
const app = express();
const { userRouter, blogRouter } = require("./routes");
const mongoose = require("mongoose");
const { generateFakeData } = require("../faker");
const MONGO_URL = "mongodb+srv://workingsnkim:tmdsud258!@mongo-cluster.aahgnml.mongodb.net/BlogService?retryWrites=true&w=majority";

const server = async () => {
  try {
    await mongoose.connect(MONGO_URL), { useCreateIndex: true };
    mongoose.set("debug", true);
    console.log(`Mongo Connceted`);
    // generateFakeData(100, 10, 20);
    app.use(express.json());
    app.use("/user", userRouter);
    app.use("/blog", blogRouter);
    app.listen(3000, async () => {
      console.log("server listening on port 3000");
    });
  } catch (err) {
    console.log(err);
  }
};

server();
