// routes/post.routes.js
import { Router } from 'express';
import {
    createPost,
    getFeed,
    getPostsByUser,
    deletePost,
    toggleLike,
    addComment,
    deleteComment,
    getComments,
    toggleSave,
    getSavedPosts,
} from '../controllers/post.controller.js';

const router = Router();

// ── Feed ──────────────────────────────────────
router.get('/feed', getFeed);

// ── Saved posts ───────────────────────────────
router.get('/saved', getSavedPosts);

// ── Posts by user ─────────────────────────────
router.get('/user/:userId', getPostsByUser);

// ── Create / Delete a post ────────────────────
router.post('/', createPost);
router.delete('/:id', deletePost);

// ── Like toggle ───────────────────────────────
router.post('/:id/like', toggleLike);

// ── Comment add / delete / get ───────────────
router.get('/:id/comments', getComments);
router.post('/:id/comment', addComment);
router.delete('/:id/comment/:commentId', deleteComment);

// ── Save toggle ───────────────────────────────
router.post('/:id/save', toggleSave);

export default router;
