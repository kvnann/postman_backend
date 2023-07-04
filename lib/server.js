const express = require('express');
const app = express();
const server = {};
const userRouter = require('../routers/userRouter');
const postRouter = require('../routers/postRouter');
const mainRouter = require('../routers/mainRouter');
const bodyParser = require('body-parser');
const cors = require('cors')


const whiteList = ['http://localhost:3000', 'https://cselgun.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    if (whiteList.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get('/',(req,res)=>{
    res.send('Success!');
});

app.use('/user', userRouter);
app.use('/post', postRouter);

app.use('/', mainRouter);



server.startHttpServer = ()=>{
    app.listen(process.env.PORT);
    console.log(`HTTP server started on port ${process.env.PORT}`);
};

module.exports = server;