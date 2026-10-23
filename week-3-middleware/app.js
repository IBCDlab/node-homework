const express = require("express");
const { randomUUID } = require("crypto");
const app = express();

app.use(express.json());

app.use(express.static(__dirname + "/public"));

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);

  next();
});

const dogsRouter = require("./routes/dogs");

// Assignment 3b and 3c ask you to add middleware in this file.

app.use("/", dogsRouter); // Do not remove this line

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    error: "Internal Server Error",
    requestId: req.requestId,
  });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;
