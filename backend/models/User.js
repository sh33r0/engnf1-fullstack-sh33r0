const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");
const { maximum } = require("firebase/firestore/pipelines");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, "is invalid"],
        maxlength: 254
    },
    passwordHash: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ["USER","ADMIN"],
        default: "USER"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }   
});

module.exports = mongoose.model("User", userSchema);