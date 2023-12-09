// routes/attendanceRoute.js

const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const verify = require("../verifyToken");
/**
 * @swagger
 * /api/attendance/mark-attendance:
 *   post:
 *     summary: Mark attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: The date of attendance (YYYY-MM-DD)
 *               attendance:
 *                 type: string
 *                 enum: [absent, present]
 *                 description: The attendance status (absent or present)
 *               inTime:
 *                 type: string
 *                 format: date-time
 *                 description: The in-time for attendance (optional)
 *               outTime:
 *                 type: string
 *                 format: date-time
 *                 description: The out-time for attendance (optional)
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *         content:
 *           application/json:
 *             example:
 *               status: true
 *               message: Attendance marked successfully
 *       403:
 *         description: Forbidden, only users are allowed
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: You don't have permission to mark attendance. Users only.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: Internal Server Error
 */
// API endpoint for marking attendance
router.post("/mark-attendance", verify, async (req, res) => {
  try {
    // Verify user's role
    if (req.user.isAdmin !== "USER") {
      return res.status(403).json({
        status: false,
        message: "You don't have permission to mark attendance. Users only.",
      });
    }

    const { date, attendance, inTime, outTime } = req.body;

    // Query for the user's attendance document
    let userAttendance = await Attendance.findOne({ user: req.user.id });

    // If no attendance document exists, create a new one
    if (!userAttendance) {
      userAttendance = new Attendance({
        user: req.user.id,
        attendance: [],
      });
    }

    // Check if the user has an entry for the specified date
    const existingEntryIndex = userAttendance.attendance.findIndex(
      (entry) => entry.date === date
    );

    if (existingEntryIndex !== -1) {
      // Update existing entry
      userAttendance.attendance[existingEntryIndex].status = attendance;
      userAttendance.attendance[existingEntryIndex].inTime = inTime;
      userAttendance.attendance[existingEntryIndex].outTime = outTime;
    } else {
      // Add a new entry for the specified date
      userAttendance.attendance.push({
        user: req.user.id,
        date,
        status: attendance,
        inTime,
        outTime,
      });
    }

    // Save the updated attendance document
    await userAttendance.save();

    res.status(201).json({
      status: true,
      message: "Attendance marked successfully",
      data: userAttendance.attendance,
    });
  } catch (error) {
    console.error(error);

    // Provide more details about the error in the response
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/attendance/{id}:
 *   put:
 *     summary: Edit attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user whose attendance is to be edited
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: The date of attendance (YYYY-MM-DD)
 *               status:
 *                 type: string
 *                 enum: [absent, present]
 *                 description: The updated attendance status (absent or present)
 *               inTime:
 *                 type: string
 *                 format: date-time
 *                 description: The updated in-time for attendance (optional)
 *               outTime:
 *                 type: string
 *                 format: date-time
 *                 description: The updated out-time for attendance (optional)
 *     responses:
 *       200:
 *         description: Attendance updated successfully
 *         content:
 *           application/json:
 *             example:
 *               status: true
 *               message: Attendance updated successfully
 *               data:
 *                 _id: "65707b7000d484c7710a66f0"
 *                 date: "2023-12-06"
 *                 status: "present"
 *                 inTime: "2023-12-06T14:05:06.692Z"
 *                 outTime: "2023-12-06T14:05:06.692Z"
 *       403:
 *         description: Forbidden, only admins are allowed
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: You don't have permission to edit attendance. Admins only.
 *       404:
 *         description: Attendance record not found for the specified user and date
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: Attendance record not found for the specified user and date
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: Internal Server Error
 */
router.put("/:id", verify, async (req, res) => {
  try {
    // Verify user's role
    if (req.user.isAdmin !== "ADMIN") {
      return res.status(403).json({
        status: false,
        message: "You don't have permission to edit attendance. Admins only.",
      });
    }

    const { id } = req.params;
    const { date, status, inTime, outTime } = req.body;

    // Query for the user's attendance document
    let userAttendance = await Attendance.findOne({ user: id });

    // If no attendance document exists, return 404
    if (!userAttendance) {
      return res.status(404).json({
        status: false,
        message: "Attendance record not found for the specified user and date",
      });
    }

    // Check if the user has an entry for the specified date
    const existingEntryIndex = userAttendance.attendance.findIndex(
      (entry) => entry.date === date
    );

    if (existingEntryIndex !== -1) {
      // Update existing entry
      userAttendance.attendance[existingEntryIndex].status = status;
      userAttendance.attendance[existingEntryIndex].inTime = inTime;
      userAttendance.attendance[existingEntryIndex].outTime = outTime;

      // Save the updated attendance document
      await userAttendance.save();

      res.status(200).json({
        status: true,
        message: "Attendance updated successfully",
        data: userAttendance.attendance[existingEntryIndex],
      });
    } else {
      // Return 404 if the entry for the specified date is not found
      return res.status(404).json({
        status: false,
        message: "Attendance record not found for the specified user and date",
      });
    }
  } catch (error) {
    console.error(error);

    // Provide more details about the error in the response
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/attendance/get-attendance:
 *   get:
 *     summary: Get attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: true
 *               message: Attendance fetched successfully
 *               data:
 *                 user: "user_id"
 *                 attendance: [
 *                   {
 *                     _id: "entry_id",
 *                     date: "2023-12-06",
 *                     status: "present",
 *                     inTime: "2023-12-06T14:05:06.692Z",
 *                     outTime: "2023-12-06T14:05:06.692Z"
 *                   },
 *                   // ... (more entries)
 *                 ]
 *       403:
 *         description: Forbidden, only admins or the user can access attendance
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: You don't have permission to access attendance. Admins or the user only.
 *       404:
 *         description: Attendance record not found for the specified user
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: Attendance record not found for the specified user
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: Internal Server Error
 */
router.get("/get-attendance", verify, async (req, res) => {
  try {
    // Query for the user's attendance document
    let userAttendance = await Attendance.findOne({ user: req.user.id });

    // If no attendance document exists, return 404
    if (!userAttendance) {
      return res.status(404).json({
        status: false,
        message: "Attendance record not found for the specified user",
      });
    }

    res.status(200).json({
      status: true,
      message: "Attendance fetched successfully",
      data: {
        user: req.user.id,
        attendance: userAttendance.attendance,
      },
    });
  } catch (error) {
    console.error(error);

    // Provide more details about the error in the response
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});
/**
 * @swagger
 * /api/attendance/{id}:
 *   get:
 *     summary: Get attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user whose attendance is to be fetched
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: true
 *               message: Attendance fetched successfully
 *               data:
 *                 user: "user_id"
 *                 attendance: [
 *                   {
 *                     _id: "entry_id",
 *                     date: "2023-12-06",
 *                     status: "present",
 *                     inTime: "2023-12-06T14:05:06.692Z",
 *                     outTime: "2023-12-06T14:05:06.692Z"
 *                   },
 *                   // ... (more entries)
 *                 ]
 *       403:
 *         description: Forbidden, only admins or the user can access attendance
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: You don't have permission to access attendance. Admins or the user only.
 *       404:
 *         description: Attendance record not found for the specified user
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: Attendance record not found for the specified user
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               status: false
 *               message: Internal Server Error
 */
router.get("/:id", verify, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user's role
    if (req.user.isAdmin !== "ADMIN") {
      return res.status(403).json({
        status: false,
        message:
          "You don't have permission to access attendance. Admins or the user only.",
      });
    }

    // Query for the user's attendance document
    let userAttendance = await Attendance.findOne({ user: id });

    // If no attendance document exists, return 404
    if (!userAttendance) {
      return res.status(404).json({
        status: false,
        message: "Attendance record not found for the specified user",
      });
    }

    res.status(200).json({
      status: true,
      message: "Attendance fetched successfully",
      data: {
        user: id,
        attendance: userAttendance.attendance,
      },
    });
  } catch (error) {
    console.error(error);

    // Provide more details about the error in the response
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Get all users attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: The date of attendance (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: User ID
 *                   username:
 *                     type: string
 *                     description: User username
 *                   email:
 *                     type: string
 *                     description: User email
 *                   profilePic:
 *                     type: string
 *                     description: URL of the user's profile picture
 *                   isAdmin:
 *                     type: boolean
 *                     description: Indicates whether the user is an admin
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Date and time when the user was created
 *       403:
 *         description: Forbidden - You are not allowed to view all users
 *       500:
 *         description: Internal Server Error
 */
router.get("/", verify, async (req, res) => {
    try {
      // Verify user's role
      if (req.user.isAdmin !== "ADMIN") {
        return res.status(403).json({
          status: false,
          message:
            "You don't have permission to access attendance. Admins or the user only.",
        });
      }
  
      const { date } = req.query;
  
      if (!date) {
        let allUserAttendance = await Attendance.find();
        return res.status(200).json({
          status: true,
          message: "Attendance fetched successfully",
          data: {
            attendance: allUserAttendance,
          },
        });
      }
      // Query for the user's attendance document
      let allUserAttendance = await Attendance.find();
  
      // Create an array to store today's attendance for all users
      const todayAttendanceData = [];
  
      // Each user's attendance and filter for today's entry
      allUserAttendance.forEach((userData) => {
        const todayAttendance = userData.attendance.find(
          (entry) => entry.date.split("T")[0] === date
        );
  
        if (todayAttendance) {
          todayAttendanceData.push({
            userId: userData.user,
            attendanceId: todayAttendance._id,
            status: todayAttendance.status,
            inTime: todayAttendance.inTime,
            outTime: todayAttendance.outTime,
          });
        }
      });
  
      return res.status(200).json({
        status: true,
        message: "Attendance fetched successfully",
        data: {
          attendance: todayAttendanceData,
        },
      });
    } catch (error) {
      console.error(error);
  
      // Provide more details about the error in the response
      return res.status(500).json({
        status: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  });

module.exports = router;
