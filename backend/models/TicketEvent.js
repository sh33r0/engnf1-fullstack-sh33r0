const mongoose = require("mongoose");

const ticketEventSchema = new mongoose.Schema({
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
        required: true
    },
    field: {
        type: String,
        required: true,
        enum: ["category", "priority", "status", "assignedId"]
    },
    oldValue: {
        type:String,
        default: null
    },
    newValue: {
        type: String,
        default: null
    },
    actor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model("TicketEvent", ticketEventSchema);