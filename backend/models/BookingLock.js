const mongoose = require("mongoose");

const bookingLockSchema = new mongoose.Schema({
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource",
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true
    }
}, {
    timestamps: true
});

bookingLockSchema.index({ resourceId: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model("BookingLock", bookingLockSchema);