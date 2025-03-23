const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Image = require("../models/Image");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image");

const uploadImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const result = await cloudinary.uploader
        .upload_stream({ resource_type: "image" }, async (error, result) => {
          if (error) return res.status(500).json({ error: error.message });

          const image = new Image({
            userId: req.user.id,
            name: req.file.originalname,
            size: req.file.size,
            contentType: req.file.mimetype,
            filePath: result.secure_url,
            cloudinaryPublicId: result.public_id,
          });

          await image.save();
          res.status(201).json(image);
        })
        .end(req.file.buffer);
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

const getSizeOfImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ error: "Image not found." });
    }

    res.json({ size: image.size });
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

    // Redirect to Cloudinary URL
    res.redirect(image.filePath);
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

    // Delete from Cloudinary
    if (image.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(image.cloudinaryPublicId);
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
      cloudinaryPublicId: image.cloudinaryPublicId,
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

    const newResult = await cloudinary.uploader.upload(image.filePath, {
      public_id: `${image.cloudinaryPublicId}-copy`,
    });

    const duplicatedImage = new Image({
      userId: req.user.id,
      name: `${image.name} - Copy`,
      size: image.size,
      contentType: image.contentType,
      filePath: newResult.secure_url,
      cloudinaryPublicId: newResult.public_id,
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

const getAllImageByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(date);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const images = await Image.find({
      userId: req.user.id,
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: -1 });

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

const getTotalSizeOfAllImages = async (req, res) => {
  try {
    // Find all images
    const images = await Image.find({ contentType: /^image\// });

    // Sum up the sizes
    const totalSize = images.reduce((acc, img) => acc + img.size, 0);

    res.status(200).json({ totalSize });
  } catch (error) {
    console.error("Error fetching total image size:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { getTotalSizeOfAllImages };

module.exports = {
  uploadImage,
  getImage,
  getSizeOfImage,
  getImageFile,
  updateImage,
  deleteImage,
  toggleFavoriteImage,
  copyImage,
  duplicateImage,
  renameImage,
  getAllImages,
  getAllImageByDate,
  getAllFavoriteImages,
  getTotalNumberImages,
  getTotalSizeOfAllImages,
};
