const helpers = require('../lib/helpers');
const handlers = require('../lib/handlers');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
// const {validationResult} = require("express-validator");

const postController = {};

postController.create = async(req,res)=>{

    // const errors = validationResult(req);
    // if(!errors.isEmpty()){
    //     return res.status(400).send({errors:errors.array()})
    // }

    let {text} = req.body;
    text = typeof(text) == 'string' && text.trim().length >= 0 && text.trim().length <= 20000 ? text.trim() : false;

    if(!text || !req.user.userID){
        return res.status(500).send({message:"Missing field(s)"});
    }
    
    
    let userData = await User.findOne({userID:req.user.userID}).catch(error=>{
        return res.status(401).send({message:`Error occured: ${error}`});
    });
    
    if(!userData){
        return res.status(401).send({message:"User not found"});
    }

    let postID = helpers.randomString(20);

    let existingPostID = await Post.find({postID});

    existingPostID = existingPostID.length > 0

    if(existingPostID){
        while(existingPostID){
            postID = helpers.randomString(20);
            existingPostID = await Post.find({postID});
            existingPostID = existingPostID.length > 0;
        }
    }

    const publishDate = new Date();
    const admin = userData.admin;



    const post = new Post({
        postID,
        user:{userID: userData.userID},
        publishDate,
        text,
        admin
        });

    await post.save().then(postCreated=>{
        userData.posts.unshift(postID);
        userData.posts = helpers.sortByPublishDate(userData.posts)
        // userData.feed.unshift(post);
        handlers.user.update(userData.userID,{posts:userData.posts},(err,updatedUser)=>{
            if(!err && updatedUser){
                return res.status(200).send(postCreated);
            }
            else{
                return res.status(500).send({message:err});
            }
        });
    }).catch(error=>{
        res.status(500).send({
            message:`An error occured while posting ${error}`
        });
    });
}

postController.like = async(req,res)=>{
    try{
        let {postID, state} = req.body;
        let likedBy = req.user.userID
        
        let postData = await Post.findOne({postID});;
        
        if(!postData){
            return res.status(401).send({message:"Post not found"});
        }
    
        postData.password = null;
        delete postData.password
    
        if(state){
            if(postData.likes.indexOf(likedBy)>-1){
                return res.status(400).send({message:"You already liked this post"});
            }
    
            postData.likes.push(likedBy);
        }
        else{
            if(postData.likes.indexOf(likedBy)>-1){
                postData.likes.splice(postData.likes.indexOf(likedBy),1)
            }
            else{
                return res.status(400).send({message:"State didn't change"});
            }
        }
    
        try{
            handlers.post.update(postData.postID,{likes:postData.likes},(err,updatedPost)=>{
                if(!err && updatedPost){
                    return res.status(200).send();
                }
                else{
                    return res.status(500).send({message:err});
                }
            });
    
    
        } catch(e){
            return res.status(500).send({message:e});
        }
    } catch(error){
        res.status(500).send({message:`Error occured: ${error}`});
    }
};

postController.loadPosts = async(req,res)=>{
    // const userID = req.user.userID;
    const postsID = req.body.postsID;
    if(postsID.length < 1){
        return res.status(400).send({message:"Not a valid request"})
    }
    let part = req.body.part;
    try{
        part = parseInt(part,10)
    }
    catch(e){
        return res.status(400).send({message:"Please provide a valid part number"});
    }

    let array3x3 = helpers.convertTo3x3Array(postsID);

    if(part>array3x3.length){
        return res.status(400).send({message:"Can't load more posts"});
    }

    const selectedPosts = array3x3[part-1]

    if(!postsID || postsID?.length < 1){
        return res.status(400).send({message:"Missing required fields"});
    }
    if(selectedPosts?.length < 1){
        return res.status(400).send({message:"Not a valid request"});
    }
    let posts = {}
    let errors = {};
    let allPosts = []
    await selectedPosts.forEach(async(postID) => {
        errors[`${postID}`] = {}
        await Post.findOne({postID}).then(async(postData)=>{
            if(!postData){
                errors[`${postID}`].message = "Post could not be found";
            }

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
                errors[`${postID}`].message = error
            }

            allPosts.push(postData);
            if(allPosts.length === selectedPosts.length){
                allPosts = helpers.sortByPublishDate(allPosts);
                allPosts.forEach(sortedPost=>{
                    posts[`${sortedPost.postID}`] = sortedPost;
                });
                return res.status(200).send({posts,errors});
            }
        }).catch(e=>{
            errors[`${postID}`].message = "Couldn't find post";
        });
    });
};

postController.loadPostsLow = async(req,res)=>{
    // const userID = req.user.userID;
    const postsID = req.body.postsID;
    if(postsID.length < 1){
        return res.status(400).send({message:"Not a valid request"})
    }
    let part = req.body.part;
    try{
        part = parseInt(part,10)
    }
    catch(e){
        return res.status(400).send({message:"Please provide a valid part number"});
    }


    if(part>postsID.length){
        return res.status(400).send({message:"Can't load more posts"});
    }

    const postID = postsID[part-1]

    let error = {};

    if(!postsID || postsID?.length < 1){
        return res.status(400).send({message:"Missing required fields"});
    }
    if(!postID){
        return res.status(400).send({message:"Not a valid request"});
    }
        await Post.findOne({postID}).then(async(postData)=>{
            if(!postData){
                return res.status(500).send({message:"Couldn't find Post"});
            }
            try{
                const userData = await User.findOne({userID:postData.user.userID});
                if(!userData){
                    return res.status(500).send({message:"Couldn't find user"});
                }
                delete userData.password;
                userData.password = null;

                postData.user = {
                    userID:userData.userID,
                    username:userData.username,
                    profilePhoto: userData?.profilePhoto
                }
                return res.status(200).send({postData,error});
            }catch(e){  
                return res.status(500).send({message:e});
            }
        }).catch(e=>{
            return res.status(500).send({message:e});
        });
};

postController.loadComments = async(req,res)=>{
    // const userID = req.user.userID;
    const {postID} = req.body;
    let part = req.body.part;

    let postData;

    try{
        postData = await Post.findOne({postID});
    }
    catch(e){
        return res.status(404).send({message:"Couldn't find post"});
    }


    let commentsID = postData?.comments;



    if(!commentsID || commentsID?.length < 1){
        return res.status(400).send({message:"No comments found"});
    }

    try{
        part = parseInt(part,10)
    }
    catch(e){
        return res.status(400).send({message:"Please provide a valid part number"});
    }

    let commentsData = await Comment.find({commentID:{$in:commentsID}})


    let array3x3 = helpers.convertTo3x3Array(commentsData);

    if(part>array3x3.length){
        return res.status(400).send({message:"Can't load more posts"});
    }

    const selectedComments = array3x3[part-1];

    if(!selectedComments || selectedComments?.length < 1){
        return res.status(400).send({message:"No comments found"});
    }

    res.status(200).send(selectedComments.reverse());
    
};

postController.addComment = async(req,res)=>{
    const {postID, text, userID} = req.body;
    
    if(!postID || !userID || typeof(text) !== "string" || text.trim().length < 1){
        return res.status(400).send({message:"Invalid request. Maybe you didn't provide any text"});
    }
    
    if(userID !== req?.user?.userID){
        return res.status(401).send();
    }

    let userData;

    try{
        userData = await User.findOne({userID});
        if(!userData){
            return res.status(500).send({message:"Error occured while finding user"});
        }
    }catch(err){
        return res.status(500).send({message:"Error occured while finding user" + err});
    }

    let postData;

    try{
        postData = await Post.findOne({postID});
        if(!postData){
            return res.status(500).send({message:"Error occured while finding relevant post"});
        }
    }catch(err){
        return res.status(500).send({message:"Error occured while finding relevant post" + err});
    }

    let commentID = helpers.randomString(20);

    let newComments = [...postData.comments , commentID];

    try{
        handlers.post.update(postData.postID,{comments:newComments},(err,updatedPost)=>{
            if(!err && updatedPost){
                const newComment = new Comment(
                    {
                        commentID,
                        postID,
                        text,
                        publishDate:new Date(),
                        userData:{
                            userID,
                            username:userData.username
                        },
                        profilePhoto:userData.profilePhoto,
                        likes:[]
                    }
                );

                newComment.save().then(commentCreated=>{
                    if(commentCreated){
                        return res.status(200).send(commentCreated);
                    }   
                }).catch(err=>{
                    return res.status(500).send({message:"Couldn't cave comment to database"});
                });
            }
            else{
                return res.status(500).send({message:err});
            }
        });


    } catch(e){
        res.status(500).send({message:e});
    }
}

postController.deleteComment = async(req,res)=>{
    const {commentID} = req.body;
    
    if(!commentID){
        return res.status(400).send({message:"Invalid request. Try again"});
    }

    let commentData;

    try{
        commentData = await Comment.findOne({commentID});
        if(!commentData){
            return res.status(500).send({message:"Error occured while finding user"});
        }
    }catch(err){
        return res.status(500).send({message:"Error occured while finding user" + err});
    }

    let userData;

    try{
        userData = await User.findOne({userID:req.user.userID});
        if(!userData){
            return res.status(500).send({message:"Error occured while finding user"});
        }
    }catch(err){
        return res.status(500).send({message:"Error occured while finding user" + err});
    }

    
    if(commentData.userData.userID !== req?.user?.userID && !userData.admin){
        return res.status(401).send();
    }

    let postData;

    try{
        postData = await Post.findOne({postID:commentData.postID});
        if(!postData){
            return res.status(500).send({message:"Error occured while finding relevant post"});
        }
    }catch(err){
        return res.status(500).send({message:"Error occured while finding relevant post" + err});
    }

    const indexOfComment = postData.comments.indexOf(commentID);
  
    if (indexOfComment !== -1) {
        postData.comments.splice(indexOfComment,1);
    }

    try{
        handlers.post.update(postData.postID,{comments:postData.comments},async(err,updatedPost)=>{
            if(!err && updatedPost){
                await Comment.deleteOne({commentID}).then(deletedComment=>{
                    return res.status(200).send({message:"Comment Deleted Successfully!"});
                }).catch(e=>{
                    return res.status(500).send({message:"An errorr occured while deleting your comment from database " + e});
                });
            }
            else{
                return res.status(500).send({message:err});
            }
        });
    } catch(e){
        res.status(500).send({message:e});
    }
}


postController.userPosts = async(req,res)=>{
    try {
        const userID = req.body.userID;
        const userData = await User.findOne({ userID });
        
        if (!userData) {
            return res.status(400).send({ message: "User could not be found" });
        }
        const posts = helpers.sortByPublishDate(userData.posts);
        return res.status(200).send(posts);
      } catch (e) {
        res.status(400).send({ message: "An error occurred :(" });
    }
}

postController.likedPosts = async(req,res)=>{
    const watchingUserID = req.body.userID;
    const authUserID = req.user.userID;
    try {
        // Find posts where the likedBy array contains the user's userID
        const likedPosts = await Post.find({ likes: { $all: [watchingUserID] } });

        if(likedPosts?.length > 0){
            let postsID = []
            likedPosts.forEach(postData=>{
                postsID.push(postData.postID);
            });
            return res.status(200).send(postsID);
        }
        else{
            return res.status(200).send({message:"No posts Liked"});
        }
    
      } catch (error) {
        res.status(400).send({message:`Error finding liked posts: ${error}`});
    }
}

postController.getAll = async(req,res)=>{
    // i know that it is not a good idea to fetch all data from database and ..
    // .. pass only ID's because we are sending additional request for these postData again in frontend
    // Didn't want to change whole structure for this and write it all again cause im not gonna publish this
  try {
    let allPosts = await Post.find({});
    if (allPosts.length < 1) {
      return res.status(200).send([]);
    }

    allPosts = allPosts.sort((post1, post2) => {
        const t1 = new Date(post1.publishDate);
        const t2 = new Date(post2.publishDate);
        
        return t2.getTime() - t1.getTime(); // Sort in descending order (latest first)
      });
    let postsID = []
    allPosts.forEach(postData=>{
      postsID.push(postData.postID);
    });
    return res.status(200).send(postsID);
  } catch (e) {
    res.status(400).send({ message: "An error occurred" + e });
  }
}

postController.news = async(req,res)=>{
    try {
        let allPosts = await Post.find({});
        if (allPosts.length < 1) {
          return res.status(200).send([]);
        }
    
        allPosts = allPosts.sort((post1, post2) => {
            const t1 = new Date(post1.publishDate);
            const t2 = new Date(post2.publishDate);
            
            return t2.getTime() - t1.getTime(); // Sort in descending order (latest first)
          });
        let postsID = []
        allPosts.forEach(postData=>{
          if(postData.admin){
              postsID.push(postData.postID);
          }
        });
        return res.status(200).send(postsID);
      } catch (e) {
        res.status(400).send({ message: "An error occurred" + e });
    }
}

postController.getOne = async(req,res)=>{
    const postID = req.body.postID;
    if(!postID){
        return res.status(400).send({message:"Missing required fields"});
    }
    await Post.findOne({postID}).then(postData=>{
        if(!postData){
            return res.status(400).send({message:"Post could not be found"});
        }
        return res.status(200).send(postData);
    }).catch(e=>{
        res.status(400).send({message:"An error occured :("});
    });
}

postController.getPosts = async(req,res)=>{
    const postsID = req.body.postsID;
    let posts = {}
    let postCount = 0
    let errors = {};

    if(!postsID || postsID.length < 1){
        return res.status(400).send({message:"Missing required fields"});
    }

    await postsID.forEach(async(postID) => {
        errors[`${postID}`] = {}
        await Post.findOne({postID}).then(async(postData)=>{
            if(!postData){
                errors[`${postID}`].message = "Post could not be found";
            }
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
                errors[`${postID}`].message = error
            }
            posts[`${postID}`] = postData;
            postCount++
            if(postCount === postsID.length){
                return res.status(200).send({posts,errors});
            }
        }).catch(e=>{
            errors[`${postID}`].message = "Couldn't find user";
        });
    });
}

postController.delete = async(req,res)=>{
    const postID = req.body.postID;
    let userData = await User.findOne({userID:req.user.userID});
    if(!postID){
        return res.status(400).send({message:"Missing required fields"});
    }
    await Post.find({postID}).then(async(postData)=>{
        if(postData.length<1){
            return res.status(400).send({message:"Post could not be found"});
        }
        if(!userData.admin){
            if(req.user.userID !== postData[0].user.userID){
                return res.status(401).send("Okay boomer.")
            }
        }
        await Post.deleteOne({postID}).then(()=>{
            userData.posts.splice(userData.posts.indexOf(postID),1);
            if(userData?.posts?.length > 0){
                userData.posts = helpers.sortByPublishDate(userData.posts);
            }
            handlers.user.update(userData.userID,{posts:userData.posts},(err,updatedUser)=>{
                if(!err && updatedUser){
                    return res.status(200).send({message:"Post deleted"});
                }
                else{
                    return res.status(500).send({message:err});
                }
            });
        });
    }).catch(e=>{
        res.status(400).send({message:"Couldn't delete post :("});
    });
}

postController.deleteMany = async(req,res)=>{
    const postsID = req.body.postsID;
    let userData = await User.findOne({userID:req.user.userID});
    if(!postsID?.length ==  0){
        return res.status(400).send({message:"Missing required fields"});
    }
    if(!userData[0].admin){
        return res.status(401).send("Okay boomer.")
    }
    if(postsData.length<1){
        return res.status(400).send({message:"Post could not be found"});
    }
    postsID.forEach(async(postID)=>{
        await Post.deleteOne({postID}).then((res) => {
            return res.status(200).send({message:`${res.deletedCount} items deleted`});
          })
          .catch((error) => {
            return res.status(500).send({message:`Error deleting item. ${error}`});
          });
    });
}

module.exports = postController