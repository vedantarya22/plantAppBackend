
import Site from '../models/site.model.js';

// MARK: mirrors addSite() in SiteStore
const addSite = async (req, res) => {
  try {
    const {name, icon } = req.body;
     const userId = req.userId; 

    // mirrors your duplicate check in SiteStore
    const existingSite = await Site.findOne({
      userId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }  // case-insensitive, mirrors .lowercased()
    });

    if (existingSite) {
      // return the existing site instead of creating a new one
      return res.status(200).json(existingSite);
    }

    const newSite = new Site({ userId, name, icon });
    const saved = await newSite.save();
    return res.status(201).json(saved);

  } catch (err) {
    return res.status(400).json({ message: `Something went wrong ${err}` });
  }
};

// MARK: get all sites for a user with live plantCount
const getUserSites = async (req, res) => {
  try {
    const sites = await Site
      .find({ userId: req.userId })
      .populate('plantCount');    //  live count from UserPlant
    return res.status(200).json(sites);
  } catch (err) {
    return res.status(500).json({ message: `Something went wrong ${err}` });
  }
};

const deleteSite = async (req, res) => {
  try {
    const deleted = await Site.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Site not found' });
    }
    return res.status(200).json({ message: 'Site deleted' });
  } catch (err) {
    return res.status(500).json({ message: `Something went wrong ${err}` });
  }
};

export { addSite, getUserSites, deleteSite };