const mongoosec= require('mongoose');

const bookingSchema = new mongoosec.Schema({
    resourceId:{
        type:mongoosec.Schema.Types.ObjectId,
        ref:'Resource',
        required:true
    },
    userId:{
        type:mongoosec.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    ticketId:{
        type:mongoosec.Schema.Types.ObjectId,
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

module.exports = mongoosec.model('Booking', bookingSchema);