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
    const comment = new Comment({ content, user, userFullName: `${user.name.first} ${user.name.last}`, blog: blogId }); // 그냥 블로그 객체를 넣으면 순환참조하여 무한루프 걸린다.
    // await Promise.all([comment.save(), Blog.updateOne({ _id: blogId }, { $push: { comments: comment } })]);

    // await Promise.all([comment.save(), Blog.updateOne({ _id: blogId }, { $inc: { commentsCount: 1 } })]);

    blog.commentsCount++;
    blog.comments.push(comment);
    if (blog.commentsCount > 3) blog.comments.shift(); //내장 되는 것들을 옛날 것들을 빼서 내장해준다. 나중에 코멘트 API 를 호출해서 이전의 댓글들은 보여 주면 된다.

    await Promise.all([comment.save(), blog.save()]);

    return res.send({ comment });
  } catch (err) {
    return res.status(400).send({ err: err.message });
  }
});

commentRouter.get("/", async (req, res) => {
  let { page = 0 } = req.query;
  page = parseInt(page);
  const { blogId } = req.params;
  if (!isValidObjectId(blogId)) return res.status(400).send({ err: "blogId is invalid" });

  const comments = await Comment.find({ blog: blogId })
    .sort({ createdAt: -1 })
    .skip(page * 3)
    .limit(3);
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
