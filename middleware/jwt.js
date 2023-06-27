const jwt = require('jsonwebtoken');

const verifyToken = (req,res,next)=>{
    const token = req.headers.accesstoken.split(' ')[1];
    const refreshToken = req.headers.refreshtoken.split(' ')[1];

    if(!token){
        return res.status(401).send({message:"Token is not provided"});
    }

    try{
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
            "algorithms":['HS256']
        });
        req.user = decodedToken;
        next();
    }catch(e){
        if (e instanceof jwt.TokenExpiredError) {
            if(isRefreshToken(refreshToken,token)){
                const {userID} = jwt.decode(refreshToken);
                const newAccessToken  = generatedAccessToken(userID);
                const newRefreshToken  = generatedRefreshToken(userID);

                req.user = jwt.decode(token);
                req.newAuth = true;
                req.newAccessToken = newAccessToken;
                req.newRefreshToken = newRefreshToken;

                return next();
            }
            else{
                return res.status(403).send({message:"Token is expired"});
            }
        } 
        else if (e instanceof jwt.NotBeforeError) {
            return res.status(403).send({message:"Invalid Token"});
        }
        else if (e instanceof jwt.JsonWebTokenError) {
            return res.status(403).send({message:`jwt error ${e}`});
        }
        else {
            res.status(403).send({message:"An error occured, please try again"});
        }
    }
}

const isRefreshToken = (token,accessToken)=>{
    const decoded = jwt.decode(token);
    const accessTokenDecoded = jwt.decode(accessToken)
    return accessTokenDecoded.userID === decoded.userID && decoded && decoded.refreshToken === true; 
}

const generatedAccessToken = (userID)=>{
    const accessToken = jwt.sign({userID}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    });
    return accessToken;
}
const generatedRefreshToken = (userID)=>{
    const refreshToken = jwt.sign({userID, refreshToken:true}, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '30d'
    });
    return refreshToken;
}

module.exports = verifyToken;