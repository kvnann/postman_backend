const express = require('express');
const router = express.Router();

const auth = require('../middleware/jwt');

const postController = require("../controllers/postController");

router.post('/create',auth,postController.create);

router.post('/like',auth,postController.like);

router.post('/get_one',auth,postController.getOne);

router.post('/user_posts', auth, postController.userPosts);

router.post('/liked_posts', auth, postController.likedPosts);

router.post('/get_all', auth, postController.getAll);

router.post('/news', auth, postController.news);

router.post('/get_posts',auth,postController.getPosts);

// route for loading user's feed by request (3 posts being sent for each request)
router.post('/load_posts',auth,postController.loadPosts);



router.post('/delete',auth,postController.delete);

router.post('/delete_many',auth,postController.deleteMany);
module.exports = router;