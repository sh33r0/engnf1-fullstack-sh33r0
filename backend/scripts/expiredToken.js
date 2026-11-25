require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const jwt = require("jsonwebtoken");

const t = jwt.sign(
    { id: "000000000000000000000000" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);

console.log(t);