/**
 * @swagger
 * tags:
 *   name: Admin Authentication
 *   description: Admin authentication endpoints
 */

const router = require("express").Router()
// const User = require("../models/User")
const Admin = require('../../models/admin/admin')
const CryptoJS = require("crypto-js")
const jwt = require("jsonwebtoken")


/**
 * @swagger
 * /api/admin/register:
 *   post:
 *     summary: Register a new Admin
 *     tags: [Admin Authentication]
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
 *       500:
 *         description: Internal Server Error
 */
// REGISTER
router.post("/register", async (req, res) => {
    console.log("sd");
    const newAdmin = new Admin({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: CryptoJS.AES.encrypt(req.body.password, process.env.SECRET_KEY ).toString(),
    });
    try{
        const existingEmail = await Admin.findOne({ email: req.body.email });
        if (existingEmail) {
            return res
              .status(500)
              .json({ message: `Email ${req.body.email} already exists` });
        }
        const adminInfo = await newAdmin.save();
        res.status(201).json({
            adminInfo,
            message: "Signup successfully",
            status: 201
        })
        console.log("New User",adminInfo);
    }catch(err){
        res.status(500).json(err)
    }
})

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Login with existing Admin credentials
 *     tags: [Admin Authentication]
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
        const user = await Admin.findOne({email:req.body.email})
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
