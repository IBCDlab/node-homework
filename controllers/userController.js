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

  value.hashedPassword = await hashPassword(value.password);
  delete value.password;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
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

      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        {
          title: "Add your first task",
          userId: newUser.id,
          priority: "high",
        },
        {
          title: "Explore the app",
          userId: newUser.id,
          priority: "low",
        },
      ];

      await tx.task.createMany({
        data: welcomeTaskData,
      });

      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: {
            in: welcomeTaskData.map((t) => t.title),
          },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return {
        user: newUser,
        welcomeTasks: welcomeTasks,
      };
    });

    global.user_id = result.user.id;

    return res.status(201).json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
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
}

async function logon(req, res) {
  const email = req.body.email.toLowerCase();
  const password = req.body.password;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      hashedPassword: true,
    },
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
