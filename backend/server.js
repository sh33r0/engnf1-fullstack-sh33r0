const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tickets", require("./routes/tickets"));
app.use("/api/resources", require("./routes/resources"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/stats", require("./routes/stats"));

app.get("/", (req, res) => {
    res.json({message: "TriageSync API is running"});
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");

        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server is running`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });