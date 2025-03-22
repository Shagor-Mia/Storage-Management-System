const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Pdf = require("../models/Pdf"); // Import the Pdf model

// Configure Multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/pdfs/"; // Directory to store uploaded PDFs
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).single("pdf"); // Ensure "pdf" matches Postman key

const uploadPdf = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const pdf = new Pdf({
        userId: req.user.id,
        name: req.file.originalname,
        size: req.file.size,
        contentType: req.file.mimetype,
        filePath: `/uploads/pdfs/${req.file.filename}`, // Store the file path
      });

      await pdf.save();
      res.status(201).json(pdf);
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

    const filePath = path.join(__dirname, "../", pdf.filePath);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "Pdf not found on file system" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPdf = await Pdf.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
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

const deletePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);

    if (!pdf) {
      return res.status(404).json({ error: "Pdf not found" });
    }

    const filePath = path.join(__dirname, "../", pdf.filePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Delete the file from the file system
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

    const originalFilePath = path.join(__dirname, "../", pdf.filePath);

    if (!fs.existsSync(originalFilePath)) {
      return res.status(404).json({ error: "Pdf file not found on server." });
    }

    // Generate a new filename for the duplicate
    const fileExt = path.extname(pdf.filePath);
    const newFileName = `${Date.now()}-copy${fileExt}`;
    const newFilePath = path.join(__dirname, "../uploads/pdfs", newFileName);

    // Copy the file
    fs.copyFileSync(originalFilePath, newFilePath);

    // Save duplicated Pdf in DB
    const duplicatedPdf = new Pdf({
      userId: req.user.id,
      name: `${pdf.name} - Copy`,
      size: pdf.size,
      contentType: pdf.contentType,
      filePath: `/uploads/pdfs/${newFileName}`, // Store new file path
    });

    await duplicatedPdf.save();
    res.status(201).json(duplicatedPdf);
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
// Get all favorite PDFs
const getAllFavouritePdf = async (req, res) => {
  try {
    const pdfs = await Pdf.find({ userId: req.user.id, favourite: true });
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Toggle favourite status of a PDF
const toggleFavouritePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);

    if (!pdf) {
      return res.status(404).json({ error: "Pdf not found." });
    }

    pdf.favourite = !pdf.favourite; // Toggle the favourite field
    await pdf.save();

    res.json(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get the size of a PDF (in bytes)
const getSizeOfPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);

    if (!pdf) {
      return res.status(404).json({ error: "Pdf not found." });
    }

    res.json({ size: pdf.size }); // Returns the size of the PDF
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get PDFs by creation date (sorted)
const getPdfByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query; // Assume startDate and endDate are passed as query parameters
    const pdfs = await Pdf.find({
      userId: req.user.id,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
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

module.exports = {
  uploadPdf,
  getPdf,
  getPdfFile,
  updatePdf,
  deletePdf,
  copyPdf,
  duplicatePdf,
  renamePdf,
  getAllPdfs,
  getAllFavouritePdf,
  toggleFavouritePdf,
  getSizeOfPdf,
  getPdfByDate,
  getTotalNumberPdfs,
};
