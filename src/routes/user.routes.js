import { Router } from 'express';
import { createUser, getUserById,getAllUser } from '../controllers/user.controller.js';

const router = Router();

router.get('/', getAllUser);
router.post('/',    createUser);
router.get('/:id',  getUserById);

export default router;