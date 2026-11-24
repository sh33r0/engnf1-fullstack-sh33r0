const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config({path:require("path").join(__dirname,"../.env")});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seed = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);

        const hash = await bcrypt.hash("Admin@123", 10);

            await User.findOneAndUpdate(
                { email: "admin@triagesync.test" },
                {
                    name: "Admin Lead",
                    email: "admin@triagesync.test",
                    passwordHash: hash,
                    role: "ADMIN"
                },
                { upsert: true , new: true , runValidators: true}
            );
            console.log("Admin user seeded successfully");
            await mongoose.disconnect();
    } catch (err) {
        console.error("Error occurred while seeding the database:", err);
        process.exit(1);
    }
};

seed();