import { Router } from 'express';
import { addSite, getUserSites, deleteSite } from '../controllers/site.controller.js';

const router = Router();

router.route('/').post(addSite);
router.route('/user/:userId').get(getUserSites);
router.route('/:id').delete(deleteSite);

export default router;