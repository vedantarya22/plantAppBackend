// routes/auth.routes.js
import { Router } from 'express';
import { signup, login, appleAuth } from '../controllers/auth.controller.js';

const router = Router();

router.post('/signup', signup);
router.post('/login',  login);
// router.post('/apple',  appleAuth);

export default router;