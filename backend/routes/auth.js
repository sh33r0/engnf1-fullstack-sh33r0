const { auth } = require("../middleware/auth");
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require("jsonwebtoken");

const router = express.Router();


router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body; 

        if(typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid input" }
      });
    }
    const n=name.trim();
    const e=email.trim().toLowerCase();
    const p=password.trim();

    if(n.length <2 || n.length > 50) {
        return res.status(400).json({
            error: { code: "VALIDATION_ERROR", message: "Name must be between 2 and 50 characters" }
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 254) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid email address" }
      });
    }

    if(p.length < 8 || p.length > 64 || !/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/[0-9]/.test(p)) {
        return res.status(400).json({
            error: { code: "VALIDATION_ERROR", message: "Password must be between 8 and 64 characters and contain at least one uppercase letter, one lowercase letter, and one number" }
        });
    }
    const exists=await User.findOne({ email: e });
    if(exists) {
        return res.status(400).json({
            error: { code: "VALIDATION_ERROR", message: "Email already exists" }
        });
    }

    const passwordHash = await bcrypt.hash(p, 10);

    const user = await User.create({ name: n, email: e, passwordHash, role:"USER" });
    res.status(201).json({ 
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
     });
    } catch (err) {
    if(err.code === 11000) {
        return res.status(400).json({
            error: { code: "VALIDATION_ERROR", message: "Email already exists" }
        });
    }

    return res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" }
    });
    }
});
 
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Email and password are required" }
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+passwordHash");

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        error: { code: "UNAUTHENTICATED", message: "Invalid email or password" }
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Server error" }
    });
  }
});

router.get("/me", auth, (req, res) => {
    res.status(200).json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

module.exports = router; 