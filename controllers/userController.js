const userController = {}
const helpers = require('../lib/helpers');
const handlers = require('../lib/handlers');
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const {validationResult} = require("express-validator");

userController.login = async(req,res)=>{

    // const errors = validationResult(req);
    // if(!errors.isEmpty()){
    //     return res.status(400).send({errors:errors.array()})
    // }

    const {username,password} = req.body;

    if(!username || !password){
        return res.status(400).send({message:"Missing required fields"});
    }

    const userData = await User.findOne({username}).exec();

    if(!userData){
        return res.status(400).send({message:"User with this username doesn't exist"})
    }

    if(userData.password !== helpers.hash(password)){
        return res.status(401).send({message:"Wrong Password"});
    }

    const token = jwt.sign({userID:userData.userID}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn:"15m"
    });

    const refreshToken = jwt.sign({userID:userData.userID,refreshToken:true}, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn:"30d"
    });


    res.send({accessToken:token, refreshToken:refreshToken});
}

userController.register = async(req,res)=>{

    // const errors = validationResult(req);
    // if(!errors.isEmpty()){
    //     return res.status(400).send({errors:errors.array()})
    // }

    let {username,email,password} = req.body;
    let imageBuffer = req?.file?.buffer;

    
    username = typeof(username) == 'string' && username.length >= 3 ? username : false;
    password = typeof(password) == 'string' && password.length >= 4 ? password : false;
    email = helpers.isValidEmail(email) ? email : false; 
    
    if(!username || !password || !email){
        return res.status(500).send({message:"Missing field(s)"});
    }

    if(!imageBuffer){
        imageBuffer = ""
    }
    
    const userID = helpers.randomString(20);

    let existingUserId = await User.find({userID});

    existingUserId = existingUserId.length > 0

    if(existingUserId){
        while(existingUserId){
            userID = helpers.randomString(20);
            existingUserId = await User.find({userID});
            existingUserId = existingUserId.length > 0
        }
    }


    let existingUsername = await User.find({username});

    existingUsername = existingUsername.length > 0

    if(existingUsername){
        return res.status(400).send({message:"This username is already taken"});
    }

    let existingEmail = await User.find({email});

    existingEmail = existingEmail.length > 0
    
    if(existingEmail){
        return res.status(400).send({message:"This email is already in use"});
    }

    const hashedPass = helpers.hash(password);

    const user = new User({userID,username,email,password:hashedPass, profilePhoto:imageBuffer});

    await user.save().then(userCreated=>{
        const accessToken = jwt.sign({userID}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn:"15m"
        });
    
        const refreshToken = jwt.sign({userID,refreshToken:true}, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn:"30d"
        });
        return res.status(200).send({accessToken, refreshToken});
    }).catch(e=>{
        res.status(500).send({
            message:`An error occured: ${e}`
        });
    });
}

userController.auth = async(req,res)=>{
    const userData = await User.findOne({userID:req.user.userID}).exec();
    if(!userData){
        return res.status(500).send({message:"User not found"});
    }
    userData.password = null;
    // delete userData.password;
    // const profilePhoto = userData?.profilePhoto.toString('base64');
    // const convertedData = `/${Buffer.from(userData.profilePhoto, 'base64').toString('base64')}`;
    // userData.profilePhoto = convertedData;
    res.status(200).send({
        userData:userData,
        newAccessToken: req.newAuth?req.newAccessToken:false,
        newRefreshToken: req.newAuth?req.newRefreshToken:false
    });
}

userController.getOne = async(req,res)=>{
    const watchingUserID = req.body?.userID;
    const userID = req.user.userID
    const username = req.body?.username;

    let authUser;


    await User.findOne({userID}).then(userData=>{
        if(userData.length<1){
            return res.status(400).send({message:"User could not be found"});
        }
        userData.password = null;
        delete userData.password;
        authUser = userData;
    }).catch(e=>{
        res.status(400).send({message:"Couldn't find user"});
    });

    if(watchingUserID){
        await User.findOne({watchingUserID}).then(watchingUserData=>{
            if(watchingUserData.length<1){
                return res.status(400).send({message:"User could not be found"});
            }
            watchingUserData.password = null;
            delete watchingUserData.password;
            return res.status(200).send({
                watchingUserData,
                userData:authUser,
                newAccessToken: req.newAuth?req.newAccessToken:false,
                newRefreshToken: req.newAuth?req.newRefreshToken:false
            });
        }).catch(e=>{
            res.status(400).send({message:"Couldn't find user"});
        });
    }
    else if(username){
        await User.findOne({username}).then(watchingUserData=>{
            if(watchingUserData.length<1){
                return res.status(400).send({message:"User could not be found"});
            }
            watchingUserData.password = null;
            delete watchingUserData.password;
            return res.status(200).send({
                watchingUserData,
                userData:authUser,
                newAccessToken: req.newAuth?req.newAccessToken:false,
                newRefreshToken: req.newAuth?req.newRefreshToken:false
            });
        }).catch(e=>{
            res.status(400).send({message:"Couldn't find user"});
        });
    }
    else{
        return res.status(400).send({message:"Missing required fields"});
    }
}

userController.getUsers = async(req,res)=>{
    const usersID = req.body.usersID;
    if(!usersID){
        if(usersID.length < 1){
            return res.status(400).send({message:"Missing required fields"});
        }
    }
    let users = {}
    let userCount = 0
    let errors = {};
    await usersID.forEach(async(userID) => {
        await User.find({userID}).then(userData=>{
            if(userData.length<1){
                errors[`${userID}`].message = "User could not be found";
            }
            userData.password = null;
            // delete userData.password;
            if(userData.profilePhoto){
                userData.profilePhoto = userData.profilePhoto.toString('base64');
            }
            users[`${userID}`] = userData[0];
            userCount++
            if(userCount === usersID.length){
                return res.status(200).send({users,errors});
            }
        }).catch(e=>{
            errors[`${userID}`].message = "Couldn't find user" + e;
        });
    });
}

userController.update = async(req,res)=>{
    const userID = req.body.userID;
    const {username, email} = req.body;

    let updateData = {}

    if(username){
        if(username.length >= 3){
            updateData.username = username;
        }
        else{
            return res.status(400).send({message:"Username length should be minimum 3"});
        }
    }

    if(email){
        if(helpers.isValidEmail(email)){
            updateData.email = email;
        }
        else{
            return res.status(400).send({message:"Please provide a valid email"});
        }
    }
    
    if(req?.file?.buffer){
        updateData.profilePhoto = req?.file?.buffer
    }

    if (!userID) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    let existingUsername = await User.findOne({username});

    if(existingUsername){
        return res.status(400).send({message:"This username is already taken"});
    }

    let existingEmail = await User.findOne({email});

    if(existingEmail){
        return res.status(400).send({message:"This email is already in use"});
    }
  
    try {

      if(req.user.userID !== req.body.userID){
        return res.status(401).send({});
      }
      
      if(updateData.username && updateData.username.length < 3){
        return res.status(400).send({message:""});
      }
      if(updateData.password && updateData.password.length < 4){
        return res.status(400).send({message:""});
      }
        
      const userData = await User.findOneAndUpdate(
        { userID },
        { $set: updateData },
        { new: true }
      );
  
      if (!userData) {
        return res.status(400).send({ message: "User could not be found" });
      }
  
      userData.password = null;
  
      return res.status(200).send(userData);
    } catch (e) {
      res.status(400).send({ message: "Couldn't update user :(" });
    }
}

userController.delete = async(req,res)=>{
    const userID = req.body.userID;
    if(!userID){
        return res.status(400).send({message:"Missing required fields"});
    }
    await User.find({userID}).then(async(userData)=>{
        if(userData.length<1){
            return res.status(400).send({message:"User could not be found"});
        }
        await User.deleteOne({userID}).then(()=>{
            return res.status(200).send({message:"User Deleted!"});
        });
    }).catch(e=>{
        res.status(400).send({message:"Couldn't find user :("});
    });
}

module.exports = userController