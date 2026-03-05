import UserPlant from "../models/userPlant.model.js";
import Plant from "../models/plant.model.js";

const addUserPlant = async(req,res)=>{
    try{
        const plant = new UserPlant(req.body);
        const saved = await plant.save();
        return res.status(201).json(saved);
    }catch(err){
        return res.status(400).json({message: `Something went wrong ${err}`});

    }
};

const getUserPlants = async (req,res)=>{
    try{
        const userPlants = await UserPlant
        .find({userId: req.params.userId})
        // .populate('plantId'); // no populate for now as swift reads it as a string 
        return res.status(200).json(userPlants);
    }catch(err){
        return res.status(500).json({message:`Something went wrong ${err}`});

    }
};

const updateCare = async(req,res)=>{
    try{
         const { lastWatered, lastPruned, lastFertilized, lastRepotted } = req.body;
        const updated = await UserPlant.findByIdAndUpdate(
            req.params.id,
            {lastWatered,lastWatered,lastFertilized,lastRepotted},
            {new: true}
        );

        if(!updated){
            return res.status(404).json({message:`Plant not found`});
        }
            return res.status(200).json(updated);
    }catch(err){
        return res.staus(400).json({message:`Something went wrong ${err}`});

    }
};

const removePlant = async (req,res)=>{
    try{
        const deleted = await UserPlant.findByIdAndDelete(req.params.id);

        if(!deleted){
                  return res.status(404).json({ message: 'Plant not found' });

        }
         return res.status(200).json({ message: 'Plant removed from garden' });
    }catch(err){
            return res.status(500).json({ message: `Something went wrong ${err}` });

    }

}

const removeAllPlantsOfType = async (req,res) =>{
    try{
        const {plantId,siteId} = req.params;
        const result = await UserPlant.deleteMany({plantId,siteId});
        return res.status(200).json({message:`${result.deletedCount} plants removed`});
    }catch(err){
        return res.status(500).json({message:`Something went wrong ${err}`});
    }
};

const removeSiteWithPlants = async(req,res) =>{
    try{
        const {siteId} = req.params;
        //delete all the plants in the site
        const plantsResult = await UserPlant.deleteMany({siteId});

        const deletedSite = await Site.findByIdAndDelete(siteId);

          if (!deletedSite) {
      return res.status(404).json({ message: 'Site not found' });
    }

      return res.status(200).json({message:`Site deleted with ${plantsResult.deletedCount} plants removed` });

    }catch(err){
        res.status(500).json({message: `Something went wrong ${err}`});
    }




}

const markTaskDone = async (req, res) => {
  try {
    const { id, taskType } = req.params;

    // mirrors your Swift switch statement exactly
    const fieldMap = {
      watering:    'lastWatered',
      pruning:     'lastPruned',
      fertilizing: 'lastFertilized',
      repotting:   'lastRepotted'
    };

    const field = fieldMap[taskType.toLowerCase()];

    if (!field) {
      return res.status(400).json({ message: `Unknown task type: ${taskType}` });
    }

    const updated = await UserPlant.findByIdAndUpdate(
      id,
      { [field]: new Date() },  // mirrors plants[index].lastWatered = Date()
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    return res.status(200).json(updated);

  } catch (err) {
    return res.status(500).json({ message: `Something went wrong ${err}` });
  }
};

export { addUserPlant, getUserPlants, updateCare,markTaskDone,removePlant,removeAllPlantsOfType,removeSiteWithPlants };
