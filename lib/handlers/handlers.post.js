const post = {};
const Post = require('../../models/Post')
const User = require('../../models/User')
const helpers = require("../helpers")

post.update = async(postID, updateData,callback)=>{
    if (!postID) {
        callback({message:"Missing required fields"});
    }
  
    try {
      const postData = await Post.findOneAndUpdate(
        { postID },
        { $set: updateData },
        { new: true }
      );
  
      if (!postData) {
        callback({message:"Post could not be found"});
      }
  
      callback(false,postData)
    } catch (e) {
        callback({message:`Post could not be updated ${e}`});
    }
};

post.search = async(query,callback)=>{
  const regex = new RegExp(query, 'i');
  const queryObject = { text: regex };

  let allPosts = []

  await Post.find(queryObject)
  .exec()
  .then((matchingPosts) => {
    if(!matchingPosts || matchingPosts.length===0){
      callback(false,[]);
    }
    matchingPosts.forEach(async(postData) => {
      try{
        const userData = await User.findOne({userID:postData.user.userID});
        if(!userData){
            errors[`${postID}`].message = "Couldn't find user"
            return;
        }
        delete userData.password;
        userData.password = null;

        postData.user = {
            userID:userData.userID,
            username:userData.username,
            profilePhoto: userData?.profilePhoto
        }
        }catch(error){  
          callback({status:400,message:`Error executing query: ${error}`});
        }

        allPosts.push(postData);
        if(allPosts.length === matchingPosts.length){
            callback(false,helpers.sortByPublishDate(allPosts))
        }
    });
  })
  .catch((error) => {
    callback({status:400,message:`Error executing query: ${error}`});
  });
}

module.exports = post;