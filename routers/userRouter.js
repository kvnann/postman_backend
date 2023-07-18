const express = require('express');
const router = express.Router();

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const auth = require('../middleware/jwt');

const userController = require('../controllers/userController');

router.post('/get_one',auth,userController.getOne);

router.post('/get_users',auth,userController.getUsers);

router.post('/update' ,auth, upload.single('image'), userController.update);

router.post('/delete',auth,userController.delete);

module.exports = router;