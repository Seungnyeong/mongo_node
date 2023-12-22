const { Router } = require("express");
const commentRouter = Router({ mergeParams: true });
const { Comment, Blog, User } = require("../models");

const { isValidObjectId } = require("mongoose");

commentRouter.post("/", async (req, res) => {
  try {
    const { blogId } = req.params;
    const { content, userId } = req.body;
    if (!isValidObjectId(blogId)) return res.status(400).send({ err: "blogId is invalid" });
    if (!isValidObjectId(userId)) return res.status(400).send({ err: "userId is invalid" });
    if (typeof content !== "string") return res.status(400).send({ err: "content is required" });

    const [blog, user] = await Promise.all([Blog.findById(blogId), User.findById(userId)]);

    if (!blog || !user) return res.status(400).send({ err: "blog or user does not exist" });
    if (!blog.islive) return res.status(400).send({ err: "blog is not avaliable" });
    const comment = new Comment({ content, user, userFullName: `${user.name.first} ${user.name.last}`, blog });
    await Promise.all([comment.save(), Blog.updateOne({ _id: blogId }, { $push: { comments: comment } })]);
    return res.send({ comment });
  } catch (err) {
    return res.status(400).send({ err: err.message });
  }
});

commentRouter.get("/", async (req, res) => {
  const { blogId } = req.params;
  if (!isValidObjectId(blogId)) return res.status(400).send({ err: "blogId is invalid" });

  const comments = await Comment.find({ blog: blogId });
  return res.send({ comments });
});

commentRouter.patch("/:commentId", async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (typeof content !== "string") {
    returnres.status(400).send({ err: "content is required" });
  }

  const [comment] = await Promise.all([
    Comment.findOneAndUpdate(
      {
        _id: commentId,
      },
      {
        content,
      },
      {
        new: true,
      }
    ),
    Blog.findOneAndUpdate({ "comments._id": commentId }, { "comments.$.content": content }),
  ]);
  return res.send({ comment });
});

// $elemMath 두 개 모두 해당되는 것을 pull해줌.
commentRouter.delete("/:commentId", async (req, res) => {
  const { commentId } = req.params;
  const comment = await Comment.findOneAndDelete({ _id: commentId });
  await Blog.updateOne({ "comments._id": commentId }, { $pull: { comments: { _id: commentId } } });
  return res.send({ comment });
});

module.exports = {
  commentRouter,
};
