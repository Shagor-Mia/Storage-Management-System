const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Image = require("../models/Image");

// Configure Multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).single("image"); // Ensure "image" matches Postman key

const uploadImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    console.log("Req File:", req.file); // Debugging
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const image = new Image({
        userId: req.user.id,
        name: req.file.originalname,
        size: req.file.size,
        contentType: req.file.mimetype,
        filePath: `/uploads/${req.file.filename}`, // Store the file path
      });

      await image.save();
      res.status(201).json(image);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

const getImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ error: "Image not found." });
    }
    res.json(image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getImageFile = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

    if (!image || !image.filePath) {
      return res.status(404).json({ error: "Image file not found" });
    }

    const filePath = path.join(__dirname, "../", image.filePath);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "Image not found on file system" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedImage = await Image.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedImage) {
      return res.status(404).json({ error: "Image not found." });
    }
    res.json(updatedImage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    const filePath = path.join(__dirname, "../", image.filePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Delete the file from the file system
    }

    await Image.findByIdAndDelete(id);
    res.json({ message: "Image deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleFavoriteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ error: "Image not found." });
    }
    image.favorite = !image.favorite;
    await image.save();
    res.json(image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const copyImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ error: "Image not found." });
    }
    const newImage = new Image({
      userId: req.user.id,
      name: `${image.name} - Copy`,
      size: image.size,
      contentType: image.contentType,
      filePath: image.filePath,
    });
    await newImage.save();
    res.json(newImage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const duplicateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ error: "Image not found." });
    }

    const originalFilePath = path.join(__dirname, "../", image.filePath);

    if (!fs.existsSync(originalFilePath)) {
      return res.status(404).json({ error: "Image file not found on server." });
    }

    // Generate a new filename for the duplicate
    const fileExt = path.extname(image.filePath);
    const newFileName = `${Date.now()}-copy${fileExt}`;
    const newFilePath = path.join(__dirname, "../uploads", newFileName);

    // Copy the file
    fs.copyFileSync(originalFilePath, newFilePath);

    // Save duplicated image in DB
    const duplicatedImage = new Image({
      userId: req.user.id,
      name: `${image.name} - Copy`,
      size: image.size,
      contentType: image.contentType,
      filePath: `/uploads/${newFileName}`, // Store new file path
    });

    await duplicatedImage.save();
    res.status(201).json(duplicatedImage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const renameImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedImage = await Image.findByIdAndUpdate(
      id,
      { name, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedImage) {
      return res.status(404).json({ error: "Image not found." });
    }
    res.json(updatedImage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllImages = async (req, res) => {
  try {
    const images = await Image.find({ userId: req.user.id });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllFavoriteImages = async (req, res) => {
  try {
    const images = await Image.find({ favorite: true, userId: req.user.id });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTotalNumberImages = async (req, res) => {
  try {
    const count = await Image.countDocuments({ userId: req.user.id });
    res.json({ totalImages: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  uploadImage,
  getImage,
  getImageFile,
  updateImage,
  deleteImage,
  toggleFavoriteImage,
  copyImage,
  duplicateImage,
  renameImage,
  getAllImages,
  getAllFavoriteImages,
  getTotalNumberImages,
};
