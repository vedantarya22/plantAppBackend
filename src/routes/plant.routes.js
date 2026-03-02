import { Router } from 'express';
import Plant from '../models/plant.model.js';

const router = Router();


router.route("/").get(async(req,res)=>{
    try{
        const plants = await Plant.find();
        return res.status(200).json(plants);
    }catch(err){
        return res.status(500).json({message:`Something went wrong ${err}`});
    }
});

// GET single plant by _id
router.route('/:id').get(async (req, res) => {
    try {
        const plant = await Plant.findById(req.params.id);
        if (!plant) return res.status(404).json({ message: 'Plant not found' });
        return res.status(200).json(plant);
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong ${err}` });
    }
});

export default router;