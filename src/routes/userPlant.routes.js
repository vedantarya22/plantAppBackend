
import { Router } from 'express';
import { addUserPlant, getUserPlants, updateCare,markTaskDone,removePlant,removeAllPlantsOfType,removeSiteWithPlants } from '../controllers/userPlant.controller.js';

const router = Router();

router.route('/').post(addUserPlant);
router.route('/user').get(getUserPlants);
router.route('/:id/care').patch(updateCare);
router.route('/:id/done/:taskType').patch(markTaskDone); // ← swipe to done hits this   


// ✅ 3 delete routes
router.route('/type/:plantId/site/:siteId').delete(removeAllPlantsOfType);   // removeAllPlants(plantId:siteID:)
router.route('/site/:siteId').delete(removeSiteWithPlants);    
router.route('/:id').delete(removePlant);                                    // removePlant(by id)

export default router;