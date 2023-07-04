const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    userID:{
        type:String,
        required:true,
        unique:true
    },
    username:{
        type: String,
        required:true,
        unique:true
    },
    password:{
        type: String,
        required:true
    },
    posts:{
        type:Array,
        default:[],
        required:false
    },
    studentID:{
        type:String,
        default:'',
        required:false
    },
    admin:{
        type:Boolean,
        default:false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    feed: {
        type:Array,
        required:false,
        default:[]
    },
    profilePhoto: {
        type: Buffer,
        required:false
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;