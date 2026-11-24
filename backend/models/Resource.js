const moongose = require('mongoose');

const resourceSchema = new moongose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,  
        maxlength: 60
    },
    nameLower: {
        type: String,
        unique: true,
        select: false
    },
    type:{
        type:String,
        enum:["ROOM","LAB","EQUIPMENT"],
        required:true
    },
    capacity:{
        type:Number,
        required:true,
        min:1,
        max:500,
        validate:Number.isInteger
    },
    description:{
        type:String,
        trim:true,
        maxlength:300,
        default:""
    },
    bookingVersion: {
    type: Number,
    default: 0,
    select: false
    },      
    isActive:{
        type:Boolean,
        default:true
    }
},{
    timestamps:true
});

resourceSchema.pre('save', function(){
    if(this.name){
        this.nameLower = this.name.toLowerCase();
    }
});

module.exports = moongose.model('Resource', resourceSchema);