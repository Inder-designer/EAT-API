const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: false, minLength: 4, maxLength: 20},
        lastName: { type: String, required: false, minLength: 4, maxLength: 20},
        email:{type:String, require:true, unique:[true, "Email must be unique"]},
        password:{type:String, require:true},
        profilePic:{type:String, default:""},
        role: { type: String, enum: ["ADMIN", "USER"], default: "USER" },
    },
    {timestamps: true}
);  

module.exports = mongoose.model("User", UserSchema)