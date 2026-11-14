const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

exports.create = async (req, res, next) => {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(201).json(task);
  } catch (err) {
    if (next) return next(err);
    throw err;
  }
};

exports.index = async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: {
      userId: global.user_id,
    },
    select: {
      title: true,
      isCompleted: true,
      id: true,
    },
  });

  if (tasks.length === 0) {
    return res.sendStatus(404);
  }

  return res.status(200).json(tasks);
};

exports.show = async (req, res, next) => {
  const taskId = parseInt(req.params?.id);

  if (Number.isNaN(taskId)) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (!task) {
      return res.sendStatus(404);
    }

    return res.status(200).json(task);
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  if (!req.body) req.body = {};

  const { error, value: taskChange } = patchTaskSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const taskId = parseInt(req.params?.id);

  if (Number.isNaN(taskId)) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  if (Object.keys(taskChange).length === 0) {
    return res.status(400).json({
      message: "No fields to update",
    });
  }

  try {
    const updatedTask = await prisma.task.update({
      data: taskChange,
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(200).json(updatedTask);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "The task was not found.",
      });
    }

    return next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  const taskId = parseInt(req.params?.id);

  if (Number.isNaN(taskId)) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  try {
    const deletedTask = await prisma.task.delete({
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(200).json(deletedTask);
  } catch (err) {
    if (err.code === "P2025") {
      return res.sendStatus(404);
    }
    return next(err);
  }
};
