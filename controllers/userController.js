const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const prisma = require("../db/prisma");

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

async function register(req, res, next) {
  if (!req.body) {
    req.body = {};
  }

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  let user = null;
  value.hashedPassword = await hashPassword(value.password);
  delete value.password;

  try {
    user = await prisma.user.create({
      data: {
        name: value.name,
        email: value.email,
        hashedPassword: value.hashedPassword,
      },
      select: {
        name: true,
        email: true,
        id: true,
      },
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res.status(400).json({
        message: "Email already registered",
      });
    } else {
      return next(err);
    }
  }

  global.user_id = user.id;

  res.status(201).json({
    name: user.name,
    email: user.email,
  });
}

async function logon(req, res) {
  const email = req.body.email.toLowerCase();
  const password = req.body.password;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  const goodCredentials =
    user && (await comparePassword(password, user.hashedPassword));

  if (!goodCredentials) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  if (user) {
    global.user_id = user.id;
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
