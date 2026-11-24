const mongoose= require('mongoose');

const bookingSchema = new mongoose.Schema({
    resourceId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Resource',
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    ticketId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Ticket',
        default:null
    },
    startTime:{
        type:Date,
        required:true
    },
    endTime:{
        type:Date,
        required:true
    },
    purpose:{
        type:String,
        trim:true,
        required:true,
        minlength:5,
        maxlength:200
    },
    status:{
        type:String,
        enum:["PENDING","APPROVED","REJECTED","CANCELLED"],
        default:"PENDING"
    },
    decisionNote:{
        type:String,
        trim:true,
        maxlength:300,
        default:""
    }
},{
    timestamps:true
});

bookingSchema.pre("validate", function () {
    if (this.startTime && this.endTime && this.endTime <= this.startTime) {
        this.invalidate("endTime", "End time must be after start time");
    }
});

bookingSchema.index({ resourceId: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);