/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       in: header
 *       name: Authorization
 *       description: "JWT Authorization header using the Bearer scheme."
 *
 * security:
 *   - bearerAuth: []
 */

const router = require("express").Router();
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const nodemailer = require("nodemailer");
const verify = require("../verifyToken");
const { sendEmail } = require("../utils/emailUtils");
const { resetToken } = require("../utils/CommanUtils");
const { log } = require("handlebars");

// Generate a random token
const generateToken = () => {
  const token = CryptoJS.lib.WordArray.random(16);
  return CryptoJS.enc.Hex.stringify(token);
};

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user details
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to update
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               username:
 *                 type: string
 *               profilePic:
 *                 type: string
 *     responses:
 *       200:
 *         description: User details updated successfully
 *       403:
 *         description: Forbidden - Unable to update user details
 *       500:
 *         description: Internal Server Error
 */
// UPDATE
router.put("/:id", verify, async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    if (req.user.id === req.params.id || req.user.isAdmin) {
      // Check if a new password is provided
      if (req.body.password) {
        req.body.password = CryptoJS.AES.encrypt(
          req.body.password,
          process.env.SECRET_KEY
        ).toString();
      }

      const updateFields = {};
      Object.keys(req.body).forEach((field) => {
        if (
          field !== "_id" &&
          field !== "createdAt" &&
          req.body[field] !== "" &&
          req.body[field] !== "string"
        ) {
          updateFields[field] = req.body[field];
        }
      });

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: updateFields,
        },
        { new: true }
      );

      // Exclude password from the response
      const { password, ...info } = updatedUser._doc;
      res.status(200).json({ status: true, user: info });
    } else {
      res
        .status(403)
        .json({ status: false, message: "You can update only your account" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized, invalid old password
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
// Change Password
router.post("/change-password", verify, async (req, res) => {
  console.log("change password");
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    // Decrypt the stored password to check against the old password
    const bytes = CryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY);
    const originalPassword = bytes.toString(CryptoJS.enc.Utf8);

    if (originalPassword !== oldPassword) {
      res.status(401).json({ message: "Incorrect old password" });
      return;
    }

    // Encrypt the new password before updating it
    const encryptedNewPassword = CryptoJS.AES.encrypt(
      newPassword,
      process.env.SECRET_KEY
    ).toString();

    // Update the user's password in the database
    user.password = encryptedNewPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
});

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user with the given email exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const Token = await resetToken(user._id, { purpose: "reset" }, "10m");

    const url = `http://localhost:3000/reset-password?token=${Token}`;
    const subject = "Password Reset";

    console.log(email, "email");

    // Send a password reset email
    await sendEmail(email, url, subject);

    console.log("Password reset email sent successfully!");
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error in /forgot-password route:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       401:
 *         description: Unauthorized. Invalid or missing authorization header.
 *       403:
 *         description: Forbidden. Token is not valid.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error
 */
// Route for resetting the password
router.post("/reset-password", verify, async (req, res) => {
  // Now, you can use the decoded token from the verify middleware
  try {
    console.log(req.user, "decoded");
    const decoded = req.user; // Assuming the decoded user information is attached to req.user by the verify middleware

    // Find the user by ID from the decoded token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's password
    user.password = CryptoJS.AES.encrypt(
      req.body.newPassword,
      process.env.SECRET_KEY
    ).toString();
    await user.save();

    // Your additional logic here...

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in /reset-password route:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to delete
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden - Unable to delete user
 *       500:
 *         description: Internal Server Error
 */
// DELETE
router.delete("/:id", verify, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      console.log(User, "user");
      res.status(200).json("Account Deleted");
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json({ message: "You can delete only your account" });
  }
  console.log("User ID in token:", req.user._id);
  console.log("User ID in request parameters:", req.params.id);
  console.log("Is admin?", req.user.isAdmin);
});

/**
 * @swagger
 * /api/users/find/{id}:
 *   get:
 *     summary: Get user details by ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: User ID
 *                 username:
 *                   type: string
 *                   description: User username
 *                 email:
 *                   type: string
 *                   description: User email
 *                 profilePic:
 *                   type: string
 *                   description: URL of the user's profile picture
 *                 isAdmin:
 *                   type: boolean
 *                   description: Indicates whether the user is an admin
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Date and time when the user was created
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
// GET
router.get("/find/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found ");
      res.status(404).json("User not found");
    }
    const { password, ...info } = user._doc;
    res.status(200).json(info);
  } catch (err) {
    if (err.name === "CastError") {
      console.log("Invalid user ID format");
      return res.status(400).json({});
    } else {
      console.error(err);
      res.status(500).json(err);
    }
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
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
// GET ALL
router.get("/", verify, async (req, res) => {
  // Verify user's role
  if (req.user.isAdmin !== "ADMIN") {
    return res.status(403).json({
      status: false,
      message:
        "You don't have permission to access Users. Admins or the user only.",
    });
  }
  const query = req.query.new;
  try {
    const user = query
      ? await User.find().sort({ _id: -1 }).limit(5)
      : await User.find();

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: number
 *                     description: Month (1-12)
 *                   total:
 *                     type: number
 *                     description: Total number of users created in the month
 *       500:
 *         description: Internal Server Error
 */
// GET USER STATS
router.get("/stats", async (req, res) => {
  const today = new Date();
  const lastYear = today.setFullYear(today.setFullYear() - 1);

  const monthsArray = [
    "January",
    "February",
    "March",
    "May",
    "April",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  try {
    const data = await User.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
    console.log("getStats");
    console.log(data);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});

module.exports = router;
