const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Resource = require("../models/Resource");
const Ticket = require("../models/Ticket");
const { auth, admin } = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { resourceId, ticketId, startTime, endTime, purpose } = req.body;

        if (
            !mongoose.Types.ObjectId.isValid(resourceId) ||
            !startTime ||
            !endTime ||
            typeof purpose !== "string" ||
            purpose.trim().length < 5 ||
            purpose.trim().length > 200
        ) {
            return res.status(400).json({
                error: { code: "VALIDATION_ERROR", message: "Invalid booking details" }
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime()) ||
            end <= start ||
            start <= new Date()
        ) {
            return res.status(400).json({
                error: { code: "VALIDATION_ERROR", message: "Invalid booking time range" }
            });
        }

        if (ticketId !== undefined && ticketId !== null) {
            if (!mongoose.Types.ObjectId.isValid(ticketId)) {
                return res.status(400).json({
                    error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" }
                });
            }

            const ticket = await Ticket.findById(ticketId);

            if (!ticket) {
                return res.status(404).json({
                    error: { code: "NOT_FOUND", message: "Ticket not found" }
                });
            }
        }

        let booking;
        let result = "";

        await session.withTransaction(async () => {
            const resource = await Resource.findOneAndUpdate(
                { _id: resourceId, isActive: true },
                { $inc: { bookingVersion: 1 } },
                { new: true, session }
            );

            if (!resource) {
                result = "missing";
                return;
            }

            const conflict = await Booking.findOne({
                resourceId,
                status: { $in: ["PENDING", "APPROVED"] },
                startTime: { $lt: end },
                endTime: { $gt: start }
            }).session(session);

            if (conflict) {
                result = "conflict";
                return;
            }

            const docs = await Booking.create([{
                resourceId,
                userId: req.user._id,
                ticketId: ticketId || null,
                startTime: start,
                endTime: end,
                purpose: purpose.trim()
            }], { session });

            booking = docs[0];
            result = "created";
        });

        if (result === "missing") {
            return res.status(404).json({
                error: { code: "NOT_FOUND", message: "Resource not found or inactive" }
            });
        }

        if (result === "conflict") {
            return res.status(409).json({
                error: { code: "BOOKING_CONFLICT", message: "Resource is already booked for this time" }
            });
        }

        return res.status(201).json({ booking });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: { code: "SERVER_ERROR", message: "Failed to create booking" }
        });
    } finally {
        await session.endSession();
    }
});

router.get("/", auth, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const valid = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

        if (status && !valid.includes(status)) {
            return res.status(400).json({
                error: { code: "VALIDATION_ERROR", message: "Invalid booking status" }
            });
        }

        const p = Math.max(1, parseInt(page) || 1);
        const l = Math.min(50, Math.max(1, parseInt(limit) || 10));

        const q = {};

        if (req.user.role !== "ADMIN") {
            q.userId = req.user._id;
        }

        if (status) {
            q.status = status;
        }

        const [bookings, total] = await Promise.all([
            Booking.find(q)
                .populate("resourceId", "name type capacity")
                .populate("userId", "name email")
                .populate("ticketId", "subject externalId")
                .sort({ createdAt: -1 })
                .skip((p - 1) * l)
                .limit(l),
            Booking.countDocuments(q)
        ]);

        return res.json({
            bookings,
            pagination: {
                total,
                page: p,
                limit: l,
                pages: Math.ceil(total / l)
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: { code: "SERVER_ERROR", message: "Failed to fetch bookings" }
        });
    }
});

router.get("/:id", auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                error: { code: "VALIDATION_ERROR", message: "Invalid booking ID" }
            });
        }

        const q = { _id: req.params.id };

        if (req.user.role !== "ADMIN") {
            q.userId = req.user._id;
        }

        const booking = await Booking.findOne(q)
            .populate("resourceId", "name type capacity")
            .populate("userId", "name email")
            .populate("ticketId", "subject externalId");

        if (!booking) {
            return res.status(404).json({
                error: { code: "NOT_FOUND", message: "Booking not found" }
            });
        }

        return res.json({ booking });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: { code: "SERVER_ERROR", message: "Failed to fetch booking" }
        });
    }
});

router.patch("/:id/decision", auth, admin, async (req, res) => {
    try {
        const { status, decisionNote = "" } = req.body;

        if (
            !mongoose.Types.ObjectId.isValid(req.params.id) ||
            !["APPROVED", "REJECTED"].includes(status) ||
            typeof decisionNote !== "string" ||
            decisionNote.trim().length > 300
        ) {
            return res.status(400).json({
                error: { code: "VALIDATION_ERROR", message: "Invalid decision details" }
            });
        }

        const booking = await Booking.findOneAndUpdate(
            { _id: req.params.id, status: "PENDING" },
            {
                $set: {
                    status,
                    decisionNote: decisionNote.trim()
                }
            },
            { returnDocument: "after", runValidators: true }
        )
            .populate("resourceId", "name type capacity")
            .populate("userId", "name email");

        if (!booking) {
            const exists = await Booking.exists({ _id: req.params.id });

            return res.status(exists ? 409 : 404).json({
                error: {
                    code: exists ? "BOOKING_ALREADY_PROCESSED" : "NOT_FOUND",
                    message: exists ? "Booking is no longer pending" : "Booking not found"
                }
            });
        }

        return res.json({ booking });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: { code: "SERVER_ERROR", message: "Failed to process booking" }
        });
    }
});

module.exports = router;