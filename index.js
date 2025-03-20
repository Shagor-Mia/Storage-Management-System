const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const connectDB = require("./db");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
connectDB();

const PORT = process.env.PORT || 5000;
app.use("/api/auth", authRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
