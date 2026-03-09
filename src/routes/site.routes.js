import { Router } from 'express';
import { addSite, getUserSites, deleteSite } from '../controllers/site.controller.js';

const router = Router();

router.route('/user').get(getUserSites);
router.route('/').post(addSite);
router.route('/:id').delete(deleteSite);

export default router;