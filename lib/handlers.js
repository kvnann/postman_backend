// const helpers = require('../lib/helpers')
const handlers = {}

handlers.user = require("./handlers/handlers.user");
handlers.post = require("./handlers/handlers.post");

handlers.search = (req,res)=>{
    const {query,type} = req.body;
    type==="u"? // User
    handlers.user.search(query,(err,data)=>{
        if(err){
            res.status(err.status).send({message:err.message});
        }
        else{
            res.status(200).send(data)
        }
    }):type==="p"? // Post
    handlers.post.search(query,(err,data)=>{
        if(err){
            res.status(err.status).send({message:err.message});
        }
        else{
            res.status(200).send(data)
        }
    }):res.status(400).send({message:"Invalid request"})
}


module.exports = handlers;