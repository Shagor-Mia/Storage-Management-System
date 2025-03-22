const Folder = require("../models/folder");

const createFolder = async (req, res) => {
  try {
    const folder = new Folder({
      ...req.body,
      userId: req.user.id, // Set userId to the logged-in user's ID
    });
    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({
      _id: id,
      userId: req.user.id,
    }).populate("parentId"); // Verify userId
    if (!folder) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }
    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFolder = await Folder.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    ); // Verify userId
    if (!updatedFolder) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }
    res.json(updatedFolder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFolder = await Folder.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    }); // Verify userId
    if (!deletedFolder) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }
    res.json({ message: "Folder deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({ _id: id, userId: req.user.id }); // Verify userId
    if (!folder) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }
    folder.favorite = !folder.favorite;
    await folder.save();
    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllFavoriteFolders = async (req, res) => {
  try {
    const favoriteFolders = await Folder.find({
      userId: req.user.id,
      favorite: true,
    });
    res.json(favoriteFolders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const copyFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({ _id: id, userId: req.user.id }); // Verify userId
    if (!folder) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }
    const newFolder = new Folder({
      userId: req.user.id, // Set userId to the logged-in user's ID
      name: `${folder.name} - Copy`,
      parentId: folder.parentId,
      storageUsed: folder.storageUsed,
    });
    await newFolder.save();
    res.json(newFolder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const renameFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedFolder = await Folder.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { name, updatedAt: Date.now() },
      { new: true }
    ); // Verify userId
    if (!updatedFolder) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }
    res.json(updatedFolder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const duplicateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({ _id: id, userId: req.user.id }); // Verify userId
    if (!folder) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }
    const duplicateFolder = new Folder({
      userId: req.user.id, // Set userId to the logged-in user's ID
      name: `${folder.name} - Duplicate`,
      parentId: folder.parentId,
      storageUsed: folder.storageUsed,
    });
    await duplicateFolder.save();
    res.json(duplicateFolder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user.id });
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTotalNumberFolders = async (req, res) => {
  try {
    const totalFolders = await Folder.countDocuments({ userId: req.user.id });
    res.json({ totalFolders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFoldersByDate = async (req, res) => {
  try {
    const { date } = req.params; // Expected format: YYYY-MM-DD

    // Convert date to a start and end range for the whole day
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Fetch folders within the date range
    const folders = await Folder.find({
      userId: req.user.id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFolderStorageUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({ _id: id, userId: req.user.id }); // Verify userId
    if (!folder) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }
    res.json({ storageUsed: folder.storageUsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createFolder,
  getFolder,
  updateFolder,
  deleteFolder,
  toggleFavorite,
  copyFolder,
  renameFolder,
  duplicateFolder,
  getAllFolders,
  getAllFavoriteFolders,
  getTotalNumberFolders,
  getFoldersByDate,
  getFolderStorageUsage,
};
