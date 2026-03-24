import { Router } from 'express';
import { createUser, getUserById,getAllUser,updateUser,deleteUser } from '../controllers/user.controller.js';

const router = Router();

router.get('/', getAllUser);
router.post('/',   createUser);
router.get('/:id',  getUserById);
router.patch('/:id',updateUser); 

router.delete('/:id',deleteUser);

export default router;