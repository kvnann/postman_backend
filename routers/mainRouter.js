const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

const auth = require('../middleware/jwt');

const handlers = require('../lib/handlers');

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/login', userController.login);

router.post('/register', upload.single('image'),userController.register);

router.post('/search', auth,  (req,res)=>{
    handlers.search(req,res);
});

router.post('/auth',auth, userController.auth);

module.exports = router;