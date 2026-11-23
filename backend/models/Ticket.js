const moongose = require('mongoose');

const ticketSchema = new moongose.Schema({
    externalId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,  
        maxlength: 150
    },
    body: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 2000
    },
    autoCategory: {
        type: String,
        required: true,
        immutable: true,
        enum: ["BILLING","BUG","FEATURE_REQUEST","LOGIN","DELIVERY"]
    },
    category: {
        type: String,
        enum: ["BILLING","BUG","FEATURE_REQUEST","LOGIN","DELIVERY"],
        default: false
    },
    isHumanOverride: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ["LOW","MEDIUM","HIGH","URGENT"],
        required: true
    },
    status: {
        type: String,
        enum: ["OPEN","IN_PROGRESS","RESOLVED","CLOSED"],
        default: "OPEN"
    },
    assignedId: {
        type: moongose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    isReviewed: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true
});

module.exports = moongose.model("Ticket", ticketSchema);