const express = require("express");
const router = express.Router();
const verify = require("../verifyToken");
const User = require("../models/User");
const Leave = require("../models/Leave");

/**
 * @swagger
 * /api/leave/apply-leave:
 *   post:
 *     summary: Apply for leave
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leaves:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     compensatory:
 *                       type: boolean
 *                       default: false
 *                     date:
 *                       type: string
 *                       format: date
 *                       description: The date of leave (YYYY-MM-DD)
 *                     category:
 *                       type: string
 *                       description: The category of leave
 *                     reason:
 *                       type: string
 *                       description: The reason for leave
 *                     upto:
 *                       type: string
 *                       format: date
 *                       description: The end date of leave (optional)
 *     responses:
 *       201:
 *         description: Leave applied successfully
 *         content:
 *           application/json:
 *             example:
 *               status: true
 *               message: Leave applied successfully
 *               data:
 *                 - {}  # You can include additional data if needed
 */
// API endpoint for applying leave
router.post("/apply-leave", verify, async (req, res) => {
  try {
    const { leaves } = req.body;

    // Query for the user's leave document
    let userLeave = await Leave.findOne({ user: req.user.id });

    // If no leave exists, create a new one
    if (!userLeave) {
      userLeave = new Leave({
        user: req.user.id,
        leaves: [],
      });
    }

    // Add new leave entries to the user's leave document
    leaves.forEach((leave) => {
      userLeave.leaves.push({
        user: req.user.id,
        ...leave,
      });
    });

    // Save the updated leave document
    await userLeave.save();

    res.status(201).json({
      status: true,
      message: "Leave applied successfully",
      data: userLeave.leaves,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/leave/get-leave:
 *   get:
 *     summary: Get leave information
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave information retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               status: true
 *               message: Leave retrieved successfully
 *               data: []  # Provide leave information as an array
 */
router.get("/get-leave", verify, async (req, res) => {
  try {
    // If the user is not an admin, retrieve leave information for the specific user
    const userLeave = await Leave.findOne({ user: req.user.id });
    res.status(200).json({
      status: true,
      message: "Leave retrieved successfully",
      data: userLeave ? [userLeave] : [], // Return an array or an empty array
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/leave:
 *   get:
 *     summary: Get all user leaves
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave information retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               status: true
 *               message: Leave retrieved successfully
 *               data: []  # Provide leave information as an array
 */
router.get("/", verify, async (req, res) => {
  try {
    if (req.user.isAdmin !== "ADMIN") {
      return res.status(403).json({
        status: false,
        message: "You don't have access to get Leaves. Admins only.",
      });
    }
    
    const userLeave = await Leave.find();
    res.status(200).json({
      status: true,
      message: "Leave retrieved successfully",
      data: userLeave, // Return an array or an empty array
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});


/**
 * @swagger
 * /api/leave/{id}:
 *   patch:
 *     summary: Change Leave Status
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the leave entry to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newStatus:
 *                 type: string
 *                 description: The new status for the leave entry
 *     responses:
 *       200:
 *         description: Leave status updated successfully
 *         content:
 *           application/json:
 *             example:
 *               status: true
 *               message: Leave status updated successfully
 *               data: {}  # Provide updated leave information
 */
router.patch("/:id", verify, async (req, res) => {
  try {
    if (req.user.isAdmin !== "ADMIN") {
      return res.status(403).json({
        status: false,
        message: "You don't have access to update leave status. Admins only.",
      });
    }

    const leaveId = req.params.id;
    const { newStatus } = req.body;

    // Find the leave entry by ID and update its status
    const updatedLeave = await Leave.findOneAndUpdate(
      { "leaves._id": leaveId },
      { $set: { "leaves.$.status": newStatus } },
      { new: true }
    );

    if (!updatedLeave) {
      return res.status(404).json({
        status: false,
        message: "Leave entry not found.",
      });
    }

    res.status(200).json({
      status: true,
      message: "Leave status updated successfully",
      data: updatedLeave,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});


module.exports = router;
