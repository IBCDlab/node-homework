# Node.js Fundamentals

## What is Node.js?

Node.js is a runtime environment that allows JavaScript code to run outside of a browser.

## How does Node.js differ from running JavaScript in the browser?

JavaScript runs in the browser on the client side and can work with web pages and the DOM. Node.js allows JavaScript to run outside the browser and work with the file system and servers.

## What is the V8 engine, and how does Node use it?

V8 is a JavaScript engine that runs JavaScript code. Node.js uses V8 to run JavaScript outside the browser.

## What are some key use cases for Node.js?

Node.js is used to build server applications and APIs that process requests and send responses. It is also used to build command-line tools and real-time applications, such as chats. Node.js can efficiently handle many input/output operations.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**

```js
// message.js

const message = "Hello";
module.exports = message;

// app.js

const message = require("./message");
```

**ES Modules (supported in modern Node.js):**

```js
// message.js

export const message = "Hello";

// app.js

import { message } from "./message.js";
```
