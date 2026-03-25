// routes/post.routes.js
import express from 'express';
import {
    createPost, getFeed, getPost, getPostsByUser, deletePost,
    toggleLike,
    addComment, getComments, deleteComment,
    toggleSave, getSavedPosts,
} from '../controllers/post.controller.js';
import  protect from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(protect);  // all routes require JWT

// Posts
router.post('/',                    createPost);
router.get('/feed',                 getFeed);
router.get('/saved',                getSavedPosts);
router.get('/user/:userId',         getPostsByUser);
router.get('/:id',                  getPost);
router.delete('/:id',               deletePost);

// Likes
router.post('/:id/like',            toggleLike);

// Comments
router.post('/:id/comments',        addComment);
router.get('/:id/comments',         getComments);
router.delete('/:id/comments/:commentId', deleteComment);

// Save
router.post('/:id/save',            toggleSave);

export default router;