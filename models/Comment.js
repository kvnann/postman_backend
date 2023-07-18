const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    commentID: {
        type:String,
        required:true
    },
    postID: {
        type:String,
        required:true
    },
    userData: {
        type:Object,
        required:true
    },
    profilePhoto: {
        type: Buffer,
        required:false
    },
    likes:{
        type:Array,
        required:false,
        default:[]
    },
    text:{
        type:String,
        required:true
    },
    publishDate:{
        type:String,
        required:true
    }
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;