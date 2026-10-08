const fs = require("fs");
const path = require("path");

// Write a sample file for demonstration

fs.writeFileSync(
  "./assignment1/sample-files/sample.txt",
  "Hello, async world!",
);

// 1. Callback style

fs.readFile("./assignment1/sample-files/sample.txt", "utf8", (err, content) => {
  if (err) {
    console.log("Cannot read file:", err.message);
    return;
  }

  console.log("Callback style:", content);
});

// Callback hell example (test and leave it in comments):
// When callbacks are nested inside other callbacks, the code becomes difficult to read.

// fs.readFile("file1.txt", "utf8", (err, data1) => {
//   fs.readFile("file2.txt", "utf8", (err, data2) => {
//     fs.readFile("file3.txt", "utf8", (err, data3) => {
//       console.log(data3);
//     });
//   });
// });

// 2. Promise style

fs.promises
  .readFile("./assignment1/sample-files/sample.txt", "utf8")
  .then((content) => {
    console.log("Promise style:", content);
  })
  .catch((err) => {
    console.log("Cannot read file:", err.message);
  });

// 3. Async/Await style
async function run() {
  try {
    const content = await fs.promises.readFile(
      "./assignment1/sample-files/sample.txt",
      "utf8",
    );
    console.log("Async/Await style:", content);
  } catch (err) {
    console.log("Cannot read file:", err.message);
  }
}
run();
