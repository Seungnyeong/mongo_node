const { Schema, model, Types } = require("mongoose");
const { CommentSchema } = require("./Comment");
const BlogSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    islive: { type: Boolean, required: true, defualt: false },
    user: {
      _id: { type: Types.ObjectId, required: true, ref: "user" },
      username: { type: String, required: true },
      name: {
        first: { type: String, required: true },
        last: { type: String, required: true },
      },
    },
    comments: [CommentSchema],
  },
  { timestamps: true }
);
// BlogSchema.virtual("comments", {
//   ref: "comment",
//   localField: "_id",
//   foreignField: "blog",
// });
// BlogSchema.set("toObject", { virtuals: true });
// BlogSchema.set("toJSON", { virtuals: true });
const Blog = model("blog", BlogSchema);

module.exports = { Blog };
