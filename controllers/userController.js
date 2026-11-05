const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {

  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {

  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);

  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

async function register(req, res) {
  if (!req.body) {
    req.body = {};
  }

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const name = value.name;
  const email = value.email;
  //const password = value.password;

  const hashedPassword = await hashPassword(value.password);

  const newUser = {
  email: value.email,
  name: value.name,
  hashedPassword,
};

  global.users.push(newUser);
  global.user_id = newUser;

  res.status(201).json({
    name,
    email,
  });
}

async function logon(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const user = global.users.find(
    (user) => user.email === email,
  );
  const goodCredentials =
  user && await comparePassword(password, user.hashedPassword);

  if (!goodCredentials) {
  return res.status(401).json({
    message: "Invalid credentials",
  });
}

  if (user) {
    global.user_id = user;
    res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } else {
    res.sendStatus(401);
  }
}

function logoff(req, res) {
  global.user_id = null;
  res.sendStatus(200);
}

module.exports = {
  register,
  logon,
  logoff,
};
