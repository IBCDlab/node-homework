const os = require("os");
const path = require("path");
const fs = require("fs");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module

console.log("Platform:", os.platform());
console.log("CPU:", os.cpus()[0].model);
console.log("Total Memory:", os.totalmem());

// Path module

const joinedPath = path.join(sampleFilesDir, "folder", "file.txt");

console.log("Joined path:", joinedPath);

// fs.promises API

async function run() {
  try {
    const filePath = path.join(sampleFilesDir, "demo.txt");

    await fs.promises.writeFile(filePath, "Hello from fs.promises!");

    const content = await fs.promises.readFile(filePath, "utf8");

    console.log("fs.promises read:", content);
  } catch (err) {
    console.log("Error:", err.message);
  }
}

run();

// Streams for large files- log first 40 chars of each chunk
