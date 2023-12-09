const mongoose = require("mongoose")

const AdminSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: false, minLength: 4, maxLength: 20},
        lastName: { type: String, required: false, minLength: 4, maxLength: 20},
        email:{type:String, require:true, unique:[true, "Email must be unique"]},
        password:{type:String, require:true},
        profilePic:{type:String, default:""},
        role: { type: String, enum: ["ADMIN", "USER"], default: "ADMIN" },
    },
    {timestamps: true, versionKey: false}
);  

module.exports = mongoose.model("Admin", AdminSchema)