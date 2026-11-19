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
        priority: value.priority,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(201).json(task);
  } catch (err) {
    if (next) return next(err);
    throw err;
  }
};

const getOrderBy = (query) => {
  const validSortFields = [
    "title",
    "priority",
    "createdAt",
    "id",
    "isCompleted",
  ];
  const sortBy = query.sortBy || "createdAt";
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";

  if (validSortFields.includes(sortBy)) {
    return { [sortBy]: sortDirection };
  }

  return { createdAt: "desc" };
};

exports.index = async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({
      message: "Invalid page",
    });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({
      message: "Invalid limit",
    });
  }

  const skip = (page - 1) * limit;

  if (req.query.find !== undefined && typeof req.query.find !== "string") {
    return res.status(400).json({
      message: "Invalid search parameter",
    });
  }

  const whereClause = { userId: global.user_id };

  if (req.query.find) {
    whereClause.title = {
      contains: req.query.find,
      mode: "insensitive",
    };
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      title: true,
      isCompleted: true,
      id: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    skip: skip,
    take: limit,
    orderBy: getOrderBy(req.query),
  });

  const totalTasks = await prisma.task.count({
    where: whereClause,
  });

  const pagination = {
    page: page,
    limit: limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1,
  };

  return res.status(200).json({
    tasks: tasks,
    pagination: pagination,
  });
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
        priority: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return res.Status(404).json({
        message: "The task was not found",
      });
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
        priority: true,
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
      return res.status(404).json({
        message: "The task was not found.",
      });
    }
    return next(err);
  }
};

exports.bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  const validTasks = [];

  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: global.user_id,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
};
