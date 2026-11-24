const express = require("express");
const Ticket = require("../models/Ticket");
const Booking = require("../models/Booking");
const Resource = require("../models/Resource");
const User = require("../models/User");
const { auth, admin } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, admin, async (req, res) => {
    try {
        const [
            totalTickets,
            ticketStatus,
            ticketCategory,
            ticketPriority,
            reviewedTickets,
            unreviewedTickets,
            overriddenTickets,
            totalBookings,
            bookingStatus,
            totalResources,
            activeResources,
            totalUsers
        ] = await Promise.all([
            Ticket.countDocuments(),
            Ticket.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            Ticket.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ]),
            Ticket.aggregate([
                { $group: { _id: "$priority", count: { $sum: 1 } } }
            ]),
            Ticket.countDocuments({ isReviewed: true }),
            Ticket.countDocuments({ isReviewed: false }),
            Ticket.countDocuments({ isHumanOverride: true }),
            Booking.countDocuments(),
            Booking.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            Resource.countDocuments(),
            Resource.countDocuments({ isActive: true }),
            User.countDocuments()
        ]);

        return res.json({
            tickets: {
                total: totalTickets,
                byStatus: ticketStatus,
                byCategory: ticketCategory,
                byPriority: ticketPriority,
                reviewed: reviewedTickets,
                unreviewed: unreviewedTickets,
                humanOverrides: overriddenTickets
            },
            bookings: {
                total: totalBookings,
                byStatus: bookingStatus
            },
            resources: {
                total: totalResources,
                active: activeResources,
                inactive: totalResources - activeResources
            },
            users: {
                total: totalUsers
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: { code: "SERVER_ERROR", message: "Failed to fetch statistics" }
        });
    }
});

module.exports = router;