const mongoose = require("mongoose");
require("dotenv").config();

// Cache the database connection
let cachedConnection = null;

const connectDB = async () => {
  // If the connection is already established, reuse it
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");
    cachedConnection = connection;
    return connection;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};

module.exports = connectDB;
