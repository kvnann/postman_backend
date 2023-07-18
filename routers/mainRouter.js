const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

const {body} = require("express-validator");

const auth = require('../middleware/jwt');

const handlers = require('../lib/handlers');

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/login',
    // [
    //     body("username")
    //         .notEmpty()
    //         .trim()
    //         .escape()
    //         .isLength({max:30}),
    //     body("password")
    //         .notEmpty()
    //         .trim()
    //         .escape()
    //         .isLength({max:100})
    // ]
    // ,
    userController.login);

router.post('/register',
// [
//     body("username")
//         .notEmpty()
//         .trim()
//         .escape()
//         .isAlphanumeric()
//         .isLength({max:30}),
//     body("password")
//         .notEmpty()
//         .trim()
//         .escape(),
//     body("email")
//         .notEmpty()
//         .trim()
//         .escape()
//     ]
//     , 
    upload.single('image'),userController.register);

router.post('/search', auth,  (req,res)=>{
    handlers.search(req,res);
});

router.post('/auth',auth, userController.auth);

module.exports = router;