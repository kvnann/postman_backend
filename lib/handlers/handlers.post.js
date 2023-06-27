const post = {};
const Post = require('../../models/Post')

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

post.search = (query,callback)=>{
  const regex = new RegExp(query, 'i');
  const queryObject = { text: regex };

  Post.find(queryObject)
  .exec()
  .then((matchingPosts) => {
    callback(false,matchingPosts);
  })
  .catch((error) => {
    callback({status:400,message:`Error executing query: ${error}`});
  });
}

module.exports = post;