const pool = require("../db/pg-pool");
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

  let result = null;
  value.hashed_password = await hashPassword(value.password);

  try {
    result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
     VALUES ($1, $2, $3) RETURNING id, email, name`,
      [value.email, value.name, value.hashed_password],
    );
  } catch (e) {
    if (e.code === "23505") {
      return res.status(400).json({
        message: "Email already registered",
      });
    }
    return next(e);
  }

  const user = result.rows[0];
  global.user_id = user.id;

  res.status(201).json({
    name: user.name,
    email: user.email,
  });
}

async function logon(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  const user = result.rows[0];

  const goodCredentials =
    user && (await comparePassword(password, user.hashed_password));

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
