const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/jwt');
const User = require("../models/User");
const helpers = require('../lib/helpers');
const handlers = require('../lib/handlers');
const userController = require('../controllers/userController');

router.post('/login', userController.login);

router.post('/register',userController.register);

router.post('/search', auth,  (req,res)=>{
    handlers.search(req,res);
});

router.post('/auth',auth, userController.auth);

module.exports = router;