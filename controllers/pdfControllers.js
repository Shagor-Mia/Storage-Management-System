const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Pdf = require("../models/Pdf");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("pdf");

const uploadPdf = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      cloudinary.uploader
        .upload_stream({ resource_type: "raw" }, async (error, result) => {
          if (error) return res.status(500).json({ error: error.message });

          const pdf = new Pdf({
            userId: req.user.id,
            name: req.file.originalname,
            size: req.file.size,
            contentType: req.file.mimetype,
            filePath: result.secure_url,
            cloudinaryPublicId: result.public_id,
          });

          await pdf.save();
          res.status(201).json(pdf);
        })
        .end(req.file.buffer); // Upload the file from the buffer
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

const getPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);
    if (!pdf) {
      return res.status(404).json({ error: "Pdf not found." });
    }
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPdfFile = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);

    if (!pdf || !pdf.filePath) {
      return res.status(404).json({ error: "Pdf file not found" });
    }

    // Redirect to Cloudinary URL
    res.redirect(pdf.filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);

    if (!pdf) {
      return res.status(404).json({ error: "Pdf not found" });
    }

    if (pdf.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(pdf.cloudinaryPublicId, {
        resource_type: "raw",
      });
    }

    await Pdf.findByIdAndDelete(id);
    res.json({ message: "Pdf deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const copyPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);
    if (!pdf) {
      return res.status(404).json({ error: "Pdf not found." });
    }
    const newPdf = new Pdf({
      userId: req.user.id,
      name: `${pdf.name} - Copy`,
      size: pdf.size,
      contentType: pdf.contentType,
      filePath: pdf.filePath,
      cloudinaryPublicId: pdf.cloudinaryPublicId,
    });
    await newPdf.save();
    res.json(newPdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const duplicatePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);

    if (!pdf) {
      return res.status(404).json({ error: "Pdf not found." });
    }

    if (pdf.cloudinaryPublicId) {
      const newResult = await cloudinary.uploader.explicit(
        pdf.cloudinaryPublicId,
        {
          type: "upload",
          resource_type: "raw",
          public_id: `${pdf.cloudinaryPublicId}-duplicate`,
          folder: "pdfs",
          overwrite: true,
        }
      );

      const duplicatedPdf = new Pdf({
        userId: req.user.id,
        name: `${pdf.name} - duplicate`,
        size: pdf.size,
        contentType: pdf.contentType,
        filePath: newResult.secure_url,
        cloudinaryPublicId: newResult.public_id,
      });

      await duplicatedPdf.save();
      res.status(201).json(duplicatedPdf);
    } else {
      const duplicatedPdf = new Pdf({
        userId: req.user.id,
        name: `${pdf.name} - duplicate`,
        size: pdf.size,
        contentType: pdf.contentType,
        filePath: "",
        cloudinaryPublicId: "",
      });
      await duplicatedPdf.save();
      res.status(201).json(duplicatedPdf);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const renamePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedPdf = await Pdf.findByIdAndUpdate(
      id,
      { name, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedPdf) {
      return res.status(404).json({ error: "Pdf not found." });
    }
    res.json(updatedPdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllPdfs = async (req, res) => {
  try {
    const pdfs = await Pdf.find({ userId: req.user.id });
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllFavouritePdf = async (req, res) => {
  try {
    const pdfs = await Pdf.find({ userId: req.user.id, favourite: true }).sort({
      createdAt: -1,
    });

    if (!pdfs.length) {
      return res.status(404).json({ error: "No favourite PDFs found." });
    }

    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleFavouritePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);

    if (!pdf) {
      return res.status(404).json({ error: "Pdf not found." });
    }

    pdf.favourite = !pdf.favourite;
    pdf.updatedAt = Date.now();
    await pdf.save();

    res.json(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSizeOfPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);

    if (!pdf) {
      return res.status(404).json({ error: "Pdf not found." });
    }

    res.json({ size: pdf.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get PDFs by creation date (sorted)
const getAllPdfByDate = async (req, res) => {
  try {
    const { date } = req.params; // Date will come from the route parameter
    const startDate = new Date(date);
    const endDate = new Date(date);

    // Set the time for startDate to midnight (00:00:00)
    startDate.setHours(0, 0, 0, 0);

    // Set the time for endDate to 11:59:59
    endDate.setHours(23, 59, 59, 999);

    // Find PDFs created on the specific date
    const pdfs = await Pdf.find({
      userId: req.user.id,
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: -1 }); // Sort by createdAt in descending order

    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTotalNumberPdfs = async (req, res) => {
  try {
    const count = await Pdf.countDocuments({ userId: req.user.id });
    res.json({ totalPdfs: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getTotalSizeOfAllPdfs = async (req, res) => {
  try {
    // Get all PDFs for the user
    const pdfs = await Pdf.find({ userId: req.user.id });

    if (!pdfs.length) {
      return res.status(404).json({ error: "No PDFs found for the user." });
    }

    // Calculate total size by summing the 'size' field of all PDFs
    const totalSize = pdfs.reduce((acc, pdf) => acc + pdf.size, 0);

    // Return the total size in a readable format (e.g., MB, GB)
    const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2); // Convert size from bytes to MB

    res.json({
      totalSizeInMB: totalSizeInMB + " MB",
      totalSizeInBytes: totalSize,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  uploadPdf,
  getPdf,
  getPdfFile,
  deletePdf,
  copyPdf,
  duplicatePdf,
  renamePdf,
  getAllPdfs,
  getAllFavouritePdf,
  toggleFavouritePdf,
  getSizeOfPdf,
  getAllPdfByDate,
  getTotalNumberPdfs,
  getTotalSizeOfAllPdfs,
};
