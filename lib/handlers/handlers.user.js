const user = {};
const User = require('../../models/User')

user.getOne = async(userID) => {
    if(!userID){
        return {status:400,message:"Missing required fields"};
    }
    await User.find({userID}).then(userData=>{
        if(userData.length<1){
            return {status:401,message:"User could not be found"};
        }
        userData[0].password = null
        // delete userData[0].password;
        return {status:200, userData:userData[0]};
    }).catch(e=>{
        return {status:401,message:"Couldn't get user :("};
    });
};

user.getUsers = async(usersID) => {
    if(!usersID){
        if(usersID.length < 1){
            return {status:400,message:"Missing required fields"};
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
            users[`${userID}`] = userData[0];
            userCount++
            if(userCount === usersID.length){
                return {status:200,users,errors};
            }
        }).catch(e=>{
            errors[`${userID}`].message = "Couldn't find user";
        });
    });
};

user.update = async (userID, updateData,callback) => {
    if (!userID) {
        callback({message:"Missing required fields"});
    }
  
    try {
      const userData = await User.findOneAndUpdate(
        { userID },
        { $set: updateData },
        { new: true }
      );
  
      if (!userData) {
        callback({message:"User could not be found"});
      }
  
      userData.password = null;
  
      callback(false,userData)
    } catch (e) {
        callback({message:`User could not be updated ${e}`});
    }
  };


user.delete = async(userID,callback)=>{
    if(!userID){
        return {status:400,message:"Missing required fields"};
    }
    await User.find({userID}).then(async(userData)=>{
        if(userData.length<1){
            callback({message:"User could not be found"});
        }
        await User.deleteOne({userID}).then(()=>{
            callback(false);
        });
    }).catch(e=>{
        callback({message:"User could not be deleted"});
    });
};

user.search = (query,callback)=>{
    const regex = new RegExp(query, 'i');
    const queryObject = { username: regex };
  
    User.find(queryObject)
    .exec()
    .then((matchingUsers) => {
      callback(false,matchingUsers);
    })
    .catch((error) => {
      console.log(error);
      callback({status:400,message:`Error executing query: ${error}`});
    });
  }

module.exports = user;