const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
    try {
        const h= req.headers.authorization;

        if (!h || !h.startsWith("Bearer ")) {
            return res.status(401).json({
                error: { code: "AUTH_ERROR", message: "Authorization header missing or malformed" }
            });
        }
        const token = h.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                error: { code: "AUTH_ERROR", message: "User not found" }
            });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            error: { code: "AUTH_ERROR", message: "Invalid token" }
        });
    }
};

const admin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            error: { code: "FORBIDDEN", message: "Access denied" }
        });
    }
    next();
};

module.exports = { auth, admin };