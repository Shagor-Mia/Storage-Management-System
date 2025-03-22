const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Note = require("../models/Notes");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/notes/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).single("file");

// Create Note
const createNote = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      const noteData = {
        userId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        favourite: req.body.favourite || false,
      };

      if (req.file) {
        noteData.file = {
          name: req.file.originalname,
          size: req.file.size,
          contentType: req.file.mimetype,
          filePath: `/uploads/notes/${req.file.filename}`, // Store relative path
        };
      }

      const note = new Note(noteData);
      await note.save();
      res.status(201).json(note);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

const getNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getNoteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note || !note.file || !note.file.filePath) {
      return res.status(404).json({ error: "Note file not found" });
    }

    const filePath = path.join(__dirname, "../", note.file.filePath);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "Note file not found on file system" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedNote) {
      return res.status(404).json({ error: "Note not found." });
    }
    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    if (note.file && note.file.filePath) {
      const filePath = path.join(__dirname, "../", note.file.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Delete the file from the file system
      }
    }

    await Note.findByIdAndDelete(id);
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSizeOfNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    if (note.file) {
      res.json({ size: note.file.size }); // Returns the size of the note file
    } else {
      res.json({ size: 0 }); //return zero if there is no file
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const renameNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      { title, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedNote) {
      return res.status(404).json({ error: "Note not found." });
    }
    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const copyNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }
    const newNote = new Note({
      userId: req.user.id,
      title: `${note.title} - Copy`,
      description: note.description,
      file: note.file, // Copy file metadata
      favourite: note.favourite,
    });
    await newNote.save();
    res.json(newNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const duplicateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    if (note.file && note.file.filePath) {
      const originalFilePath = path.join(__dirname, "../", note.file.filePath);

      if (!fs.existsSync(originalFilePath)) {
        return res
          .status(404)
          .json({ error: "Note file not found on server." });
      }

      // Generate a new filename for the duplicate
      const fileExt = path.extname(note.file.filePath);
      const newFileName = `${Date.now()}-duplicate${fileExt}`;
      const newFilePath = path.join(__dirname, "../uploads/notes", newFileName);

      // Copy the file
      fs.copyFileSync(originalFilePath, newFilePath);

      // Save duplicated Note in DB
      const duplicatedNote = new Note({
        userId: req.user.id,
        title: `${note.title} - Copy`,
        description: note.description,
        file: {
          name: note.file.name,
          size: note.file.size,
          contentType: note.file.contentType,
          filePath: `/uploads/notes/${newFileName}`, // Store new file path
        },
        favourite: note.favourite,
      });

      await duplicatedNote.save();
      res.status(201).json(duplicatedNote);
    } else {
      const duplicatedNote = new Note({
        userId: req.user.id,
        title: `${note.title} - Copy`,
        description: note.description,
        favourite: note.favourite,
      });
      await duplicatedNote.save();
      res.status(201).json(duplicatedNote);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllFavouriteNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id, favourite: true });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleFavouriteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    note.favourite = !note.favourite; // Toggle the favourite field
    await note.save();

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllNotesByDate = async (req, res) => {
  try {
    const { date } = req.params; // Date will come from the route parameter
    const startDate = new Date(date);
    const endDate = new Date(date);

    // Set the time for startDate to midnight (00:00:00)
    startDate.setHours(0, 0, 0, 0);

    // Set the time for endDate to 11:59:59
    endDate.setHours(23, 59, 59, 999);

    // Find notes created on the specific date
    const notes = await Note.find({
      userId: req.user.id,
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: -1 }); // Sort by createdAt in descending order

    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTotalNumberNotes = async (req, res) => {
  try {
    const count = await Note.countDocuments({ userId: req.user.id });
    res.json({ totalNotes: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createNote,
  getNote,
  getNoteFile,
  updateNote,
  deleteNote,
  getSizeOfNote,
  renameNote,
  copyNote,
  duplicateNote,
  getAllNotes,
  getAllFavouriteNotes,
  toggleFavouriteNote,
  getAllNotesByDate,
  getTotalNumberNotes,
};
