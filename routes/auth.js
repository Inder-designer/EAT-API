/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

const router = require("express").Router()
const User = require("../models/User")
const CryptoJS = require("crypto-js")
const jwt = require("jsonwebtoken")
const verify = require("../verifyToken");


/**
 * @swagger
 * /api/auth/save-user:
 *   post:
 *     summary: Register a new user (Only for Admins)
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       403:
 *         description: Forbidden, only administrators are allowed
 *       500:
 *         description: Internal Server Error
 */
// REGISTER
router.post("/save-user", verify, async (req, res) => {
    console.log(req.user.isAdmin);
    if (req.user.isAdmin !== 'ADMIN') {
        return res.status(403).json({
            status: false,
            message: "You don't have permission to perform this action. Admins only.",
        });
    }
    const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: CryptoJS.AES.encrypt(req.body.password, process.env.SECRET_KEY).toString(),
    });
    try {
        const existingEmail = await User.findOne({ email: req.body.email });
        if (existingEmail) {
            return res
            .status(500)
            .json({ message: `Email ${req.body.email} already exists` });
        }
        const user = await newUser.save();
        console.log("New User");
        res.status(201).json({
            user,
            message: "Signup successfully",
            status: 201
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with existing user credentials
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Wrong email or password
 *       500:
 *         description: Internal Server Error
 */
// LOGIN
router.post("/login", async (req, res)=>{
    try{
        const user = await User.findOne({email:req.body.email})
        if (!user) {
            res.status(401).json("Wrong email or password!");
            console.log("Wrong email!"); // Log the message
            return;
        }

        const bytes  = CryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY );
        const orignalPassword = bytes.toString(CryptoJS.enc.Utf8);

        if (orignalPassword !== req.body.password) {
            res.status(401).json("Wrong email or password!");
            console.log("Wrong password!"); // Log the message
            return;
        }

            const accessToken = jwt.sign(
                {id: user._id, isAdmin: user.role },
                process.env.SECRET_KEY,
                {expiresIn: "5h"}
            )

        const {password, ...info } = user._doc;
        
        res.status(200).json({...info, accessToken})    
        console.log("login");
    }catch(err){
        res.status(500).json(err)
    }
})

module.exports = router;
