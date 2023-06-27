const mongoose = require('mongoose');
const postSchema = mongoose.Schema({
    user:{
        type:Object,
        required:true
    },
    postID:{
        type: String,
        required:true,
        unique:true
    },
    publishDate:{
        type: String,
        required:true
    },
    text:{
        type: String,
        required:true,
    },
    likes:{
        type:Array,
        default:[],
        required:false
    },
    admin:{
        type:Boolean,
        required:false,
        default:false
    },
    comments:{
        type: Array,
        required: false,
        default: []
    }
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;