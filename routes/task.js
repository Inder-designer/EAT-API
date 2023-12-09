const express = require("express");
const router = express.Router();
const verify = require("../verifyToken");
const Task = require("../models/Task");
const User = require("../models/User");
const { log } = require("handlebars");

/**
 * @swagger
 * /api/task/assign:
 *   post:
 *     summary: Assign a task to a user (Admin only)
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to assign the task
 *               description:
 *                 type: string
 *                 description: Task description
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Deadline for the task (YYYY-MM-DD)
 *               deadline:
 *                 type: string
 *                 format: date
 *                 description: Deadline for the task (YYYY-MM-DD)
 *     responses:
 *       201:
 *         description: Task assigned successfully
 *       403:
 *         description: Forbidden, only admins are allowed
 *       500:
 *         description: Internal Server Error
 */
router.post("/assign", verify, async (req, res) => {
  try {
    // Verify user's role
    if (req.user.isAdmin !== "ADMIN") {
      return res.status(403).json({
        status: false,
        message: "You don't have permission to assign tasks. Admins only.",
      });
    }

    const { userId, description, date, deadline } = req.body;

    // Check if the specified user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    } 
    // Query for the user's task document
    let userTasks = await Task.findOne({ user: userId });

    // If no task document exists for the user, create a new one
    if (!userTasks) {
      userTasks = new Task({
        user: userId,
        task: [], // Update to match your schema
      });
    }

    // Check if there's an entry for the specified date
    const existingDateIndex = userTasks.task.findIndex(
      (entry) => entry.date === date
    );

    if (existingDateIndex !== -1) {
      // Add a new task to the existing date
      userTasks.task[existingDateIndex].tasks.push({
        description,
        deadline,
        status: "Pending", // Default status for a new task
      });
    } else {
      // Add a new date entry with the task
      userTasks.task.push({
        date,
        tasks: [{
          description,
          deadline,
          status: "Pending", // Default status for a new task
        }],
      });
    }

    // Save the updated task document
    await userTasks.save();

    res.status(201).json({
      status: true,
      message: "Task assigned successfully",
      data: userTasks.task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /api/task/edit-task/{taskId}:
 *   put:
 *     summary: Edit a specific task by admin
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         description: ID of the task to edit
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: The new description for the task
 *               date:
 *                 type: string
 *                 format: date
 *                 description: The new date for the task
 *               deadline:
 *                 type: string
 *                 format: date
 *                 description: The new deadline for the task
 *               status:
 *                 type: string
 *                 enum: [Pending, completed]
 *                 description: The new status for the task (optional, default is 'Pending')
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             example:
 *               status: true
 *               message: Task updated successfully
 */
// Edit a specific task by admin
router.put("/edit-task/:taskId", verify, async (req, res) => {
  try {
    // Verify user's role
    if (req.user.isAdmin !== "ADMIN") {
      return res.status(403).json({
        status: false,
        message: "You don't have permission to edit tasks. Admins only.",
      });
    }

    const { description, date, deadline, status } = req.body;
    const taskId = req.params.taskId;

    // Check if the specified task exists
    const taskToUpdate = await Task.findOne({
      "task.tasks._id": taskId,
    });

    if (!taskToUpdate) {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    // Find the task within the tasks array
    const taskDateIndex = taskToUpdate.task.findIndex(
      (taskDate) =>
        taskDate.tasks.findIndex((t) => t._id.toString() === taskId) !== -1
    );

    // Find the task within the specific date's tasks array
    const taskIndex = taskToUpdate.task[taskDateIndex].tasks.findIndex(
      (t) => t._id.toString() === taskId
    );

    if (taskIndex !== -1) {
      // Update task properties
      taskToUpdate.task[taskDateIndex].tasks[taskIndex].description = description;
      taskToUpdate.task[taskDateIndex].tasks[taskIndex].date = date;  
      taskToUpdate.task[taskDateIndex].tasks[taskIndex].deadline = deadline;
      taskToUpdate.task[taskDateIndex].tasks[taskIndex].status = status || "Pending"; // Default status if not provided

      // Save the updated task document
      await taskToUpdate.save();

      res.status(200).json({
        status: true,
        message: "Task updated successfully",
        data: taskToUpdate.task[taskDateIndex].tasks[taskIndex],
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /api/task/{taskId}:
 *   delete:
 *     summary: Delete a specific task by admin
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         description: ID of the task to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               status: true
 *               message: Task deleted successfully
 *       403:
 *         description: Forbidden, only admins are allowed to delete tasks
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: You don't have permission to delete tasks. Admins only.
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: Task not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: Internal Server Error
 */
router.delete("/:taskId", verify, async (req, res) => {
  try {
    // Verify user's role
    if (req.user.isAdmin !== "ADMIN") {
      return res.status(403).json({
        status: false,
        message: "You don't have permission to delete tasks. Admins only.",
      });
    }

    const taskId = req.params.taskId;

    // Check if the specified task exists
    const task = await Task.findOne({
      "task.tasks._id": taskId,
    });

    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    // Find the task within the tasks array
    const taskDateIndex = task.task.findIndex(
      (taskDate) =>
        taskDate.tasks.findIndex((t) => t._id.toString() === taskId) !== -1
    );

    // Find the task within the specific date's tasks array
    const taskIndex = task.task[taskDateIndex].tasks.findIndex(
      (t) => t._id.toString() === taskId
    );

    // Remove the task from the tasks array
    task.task[taskDateIndex].tasks.splice(taskIndex, 1);

    // If the date's tasks array is empty, remove the entire date array
    if (task.task[taskDateIndex].tasks.length === 0) {
      task.task.splice(taskDateIndex, 1);
    }

    await task.save(); // Save the updated task

    res.status(200).json({
      status: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
});

  /**
 * @swagger
 * /api/task/get-task:
 *   get:
 *     summary: Get tasks by user ID (accessible by both users and admins)
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               status: true
 *               message: Tasks retrieved successfully
 *               data: [{ _id: "task_id", description: "Task 1", date: "2023-12-01", deadline: "2023-12-10", status: "Pending" }, ...]
 *       403:
 *         description: Forbidden, only admins and the specified user are allowed to get tasks
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: You don't have permission to get tasks. Admins or the specified user only.
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: User not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: Internal Server Error
 */
router.get("/get-task", verify, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if the specified user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Fetch tasks for the specified user
    const tasks = await Task.findOne({ user: userId });

    res.status(200).json({
      status: true,
      message: "Tasks retrieved successfully",
      data: tasks ? tasks.task : [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /api/task/update-status/{taskId}:
 *   put:
 *     summary: Update the status of a task by a user
 *     description: Allows a user to update the status of their task.
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the task to update.
 *       - in: body
 *         name: body
 *         description: Request body containing the status to update.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [Pending, Completed]
 *               description: The new status of the task.
 *     responses:
 *       200:
 *         description: Task status updated successfully.
 *       400:
 *         description: Bad request. Invalid parameters provided.
 *       403:
 *         description: Forbidden. User does not have permission to update the task.
 *       404:
 *         description: Not Found. Task not found.
 *       500:
 *         description: Internal Server Error.
 */
router.put("/update-status/:taskId", verify, async (req, res) => {
  try {

    const { status } = req.body;
    const taskId = req.params.taskId;
    // Check if the specified task exists
    const taskToUpdate = await Task.findOne({
      "task.tasks._id": taskId,
    });
    console.log('taskId:', taskId);
    console.log('taskToUpdate:', taskToUpdate);
    if (!taskToUpdate) {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    console.log('Request Body:', status);
    // Find the task within the tasks array
    const taskDateIndex = taskToUpdate.task.findIndex(
      (taskDate) =>
        taskDate.tasks.findIndex((t) => t._id.toString() === taskId) !== -1
    );

    // Find the task within the specific date's tasks array
    const taskIndex = taskToUpdate.task[taskDateIndex].tasks.findIndex(
      (t) => t._id.toString() === taskId
    );

    if (taskIndex !== -1) {
      // Update task status
      taskToUpdate.task[taskDateIndex].tasks[taskIndex].status = "Completed"; // Default status if not provided

      // Save the updated task document
      await taskToUpdate.save();

      res.status(200).json({
        status: true,
        message: "Task status updated successfully",
        data: taskToUpdate.task[taskDateIndex].tasks[taskIndex],
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
});

module.exports = router;
