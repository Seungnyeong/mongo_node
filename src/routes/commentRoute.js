const { Router } = require("express");
const commentRouter = Router({ mergeParams: true });
const { Comment, Blog, User } = require("../models");

const { isValidObjectId, startSession } = require("mongoose");

commentRouter.post("/", async (req, res) => {
  const session = await startSession();
  let comment;
  try {
    // api 가 무거워져서 정말 중요할 경우에 쓰는 것이 좋다.
    // await session.withTransaction(async () => {
    const { blogId } = req.params;
    const { content, userId } = req.body;
    if (!isValidObjectId(blogId)) return res.status(400).send({ err: "blogId is invalid" });
    if (!isValidObjectId(userId)) return res.status(400).send({ err: "userId is invalid" });
    if (typeof content !== "string") return res.status(400).send({ err: "content is required" });

    // find에도 session 을 넣어주어야 한다.
    const [blog, user] = await Promise.all([Blog.findById(blogId, {}), User.findById(userId, {})]);

    if (!blog || !user) return res.status(400).send({ err: "blog or user does not exist" });
    if (!blog.islive) return res.status(400).send({ err: "blog is not avaliable" });
    comment = new Comment({ content, user, userFullName: `${user.name.first} ${user.name.last}`, blog: blogId }); // 그냥 블로그 객체를 넣으면 순환참조하여 무한루프 걸린다.

    // 기존에 적용된 것도 취소된다. ( 만약 실패 한다면 )
    // await session.abortTransaction();

    // await Promise.all([comment.save(), Blog.updateOne({ _id: blogId }, { $push: { comments: comment } })]);

    // await Promise.all([comment.save(), Blog.updateOne({ _id: blogId }, { $inc: { commentsCount: 1 } })]);

    // blog.commentsCount++;
    // blog.comments.push(comment);
    // if (blog.commentsCount > 3) blog.comments.shift(); //내장 되는 것들을 옛날 것들을 빼서 내장해준다. 나중에 코멘트 API 를 호출해서 이전의 댓글들은 보여 주면 된다.
    // blog.save()는 find 시에 session 으로 가져왔기 떄문에 , 이미 session 이 내장되어 있다.
    // await Promise.all([comment.save(), blog.save()]);
    // });

    // 몽고 디비에서 처리하게 되면 concurreny 문제가 발생하지 않았다. 하지만, atomicity 는 실패할 수 도 있다.
    // atomicity 발생할 확률이 매우 작고, 되더라도 용납이 되는 상황임.
    // 한 문서 안에서 여러 필드를 바꾸는 것은 atomic 하다. 내장이기 때문이다. (굳이 트랜잭션을 쓰지 않아도 되는 상황이 있다.)
    await Promise.all([comment.save(), Blog.updateOne({ _id: blogId }, { $inc: { commentsCount: 1 }, $push: { comments: { $each: [comment], $slice: -3 } } })]);
    return res.send({ comment });
  } catch (err) {
    return res.status(400).send({ err: err.message });
  } finally {
    // await session.endSession();
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
