const { faker } = require("@faker-js/faker");
const { User, Blog, Comment } = require("./src/models");
const { default: axios } = require("axios");
const URI = "http://localhost:3000";

generateFakeData = async (userCount, blogsPerUser, commentsPerUser) => {
  if (typeof userCount !== "number" || userCount < 1) throw new Error("userCount must be a positive integer");
  if (typeof blogsPerUser !== "number" || blogsPerUser < 1) throw new Error("blogPerUser must be a positive integer");
  if (typeof commentsPerUser !== "number" || commentsPerUser < 1) throw new Error("commentsPerUser must be a positive integer");

  const users = [];
  const blogs = [];
  const comments = [];
  console.log("Preparing fake data.");

  for (let i = 0; i < userCount; i++) {
    users.push(
      new User({
        username: faker.internet.userName() + parseInt(Math.random() * 100),
        name: {
          first: faker.name.firstName(),
          last: faker.name.lastName(),
        },
        age: 10 + parseInt(Math.random() * 50),
        email: faker.internet.email(),
      })
    );
  }
  console.log("fake data inserting to database...");
  await User.insertMany(users);

  users.map((user) => {
    for (let i = 0; i < blogsPerUser; i++) {
      blogs.push(
        axios.post(`${URI}/blog`, {
          title: faker.lorem.words(),
          content: faker.lorem.paragraphs(),
          islive: true,
          userId: user.id,
        })
      );
    }
  });
  let newBlogs = await Promise.all(blogs);
  console.log(`${newBlogs.length} fake blogs generated`);
  users.map((user) => {
    for (let i = 0; i < commentsPerUser; i++) {
      let index = Math.floor(Math.random() * blogs.length);
      comments.push(
        axios.post(`${URI}/blog/${newBlogs[index].data.blog._id}/comment`, {
          content: faker.lorem.sentence(),
          userId: user.id,
        })
      );
    }
  });

  await Promise.all(comments);

  console.log("fake data inserting to database");

  console.log(`${users.length} fake users generated!`);
};

module.exports = { generateFakeData };
