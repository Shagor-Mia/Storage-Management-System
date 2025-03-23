const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Note = require("../models/Notes");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for in-memory storage
const storage = multer.memoryStorage();
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
        // Convert buffer to a base64-encoded string with proper formatting
        const base64File = `data:${
          req.file.mimetype
        };base64,${req.file.buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(base64File, {
          resource_type: "auto", // Automatically detect file type
          folder: "notes", // Store in a 'notes' folder
        });

        noteData.file = {
          name: req.file.originalname,
          size: req.file.size,
          contentType: req.file.mimetype,
          filePath: result.secure_url, // Store Cloudinary URL
          cloudinaryPublicId: result.public_id, // Store Cloudinary public ID
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

    // Redirect to Cloudinary URL
    res.redirect(note.file.filePath);
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

    if (note.file && note.file.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(note.file.cloudinaryPublicId);
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

    if (note.file && note.file.cloudinaryPublicId && note.file.filePath) {
      // Check if file.filePath exists
      const newResult = await cloudinary.uploader.explicit(
        note.file.cloudinaryPublicId,
        {
          type: "upload",
          public_id: `${note.file.cloudinaryPublicId}-copy`,
          folder: "notes",
          overwrite: true,
        }
      );

      const duplicatedNote = new Note({
        userId: req.user.id,
        title: `${note.title} - Copy`,
        description: note.description,
        file: {
          name: note.file.name,
          size: note.file.size,
          contentType: note.file.contentType,
          filePath: newResult.secure_url,
          cloudinaryPublicId: newResult.public_id,
        },
        favourite: note.favourite,
      });

      await duplicatedNote.save();
      res.status(201).json(duplicatedNote);
    } else {
      // Ensure file.filePath is provided, even if it's an empty string or null
      const duplicatedNote = new Note({
        userId: req.user.id,
        title: `${note.title} - Copy`,
        description: note.description,
        favourite: note.favourite,
        file: {
          name: "No File",
          size: 0,
          contentType: "text/plain",
          filePath: "", // Provide an empty string
          cloudinaryPublicId: "",
        },
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

const getTotalSizeOfAllNotes = async (req, res) => {
  try {
    // Fetch all notes belonging to the user
    const notes = await Note.find({ userId: req.user.id });

    // Calculate total size of all files
    const totalSize = notes.reduce((sum, note) => {
      return sum + (note.file?.size || 0); // Ensure to handle cases where file might not exist
    }, 0);

    res.json({ totalSize }); // Return total size in bytes
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
  getTotalSizeOfAllNotes,
};
