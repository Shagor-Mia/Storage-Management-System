const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/user");
// const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        newUser,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
    });

    // Set session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token and save to database
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Create reset URL
    // Line removed as requested

    // Send email
    const mailOptions = {
      to: email,
      from: process.env.EMAIL,
      subject: "Password Reset Request",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset. Your reset token is: ${resetToken}</p>
          <p>This token will expire in 15 minutes.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #777; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
      resetToken: resetToken, // Added for Postman testing
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send password reset email",
      error: error.message,
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validate input
    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Find user with valid token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update password
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    // Send confirmation email
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL,
      subject: "Password Reset Successful",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">Password Reset Successful</h2>
          <p>Your password has been successfully reset.</p>
          <p>If you did not reset your password, please contact our support team immediately.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #777; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
      error: error.message,
    });
  }
};

// Logout user
const logout = (req, res) => {
  try {
    // Clear cookie
    res.clearCookie("token");

    // Destroy session
    req.session.destroy();

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
  }
};

// Update account for logged-in users
const updateAccount = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { name, email, currentPassword, newPassword, confirmNewPassword } =
      req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create update object
    const updates = {};

    // Update name if provided
    if (name) {
      updates.name = name;
    }

    // Update email if provided
    if (email && email !== user.email) {
      // Check if email is already in use
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updates.email = email;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      // Validate password fields
      if (!confirmNewPassword) {
        return res
          .status(400)
          .json({ message: "Please confirm your new password" });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "New passwords do not match" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters" });
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      // Set new password
      updates.password = newPassword;
    }

    // If no updates provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    // Apply updates
    Object.assign(user, updates);
    await user.save();

    // Update session if name or email changed
    if (updates.name || updates.email) {
      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email,
      };
    }

    res.status(200).json({
      success: true,
      message: "Account updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Update account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update account",
      error: error.message,
    });
  }
};

// Delete account for logged-in users
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { password } = req.body;

    // Validate input
    if (!password) {
      return res
        .status(400)
        .json({ message: "Password is required to delete account" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    // Store email for confirmation message
    const userEmail = user.email;

    // Delete user
    await User.findByIdAndDelete(userId);

    // Clear cookie
    res.clearCookie("token");

    // Destroy session
    req.session.destroy();

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
  updateAccount,
  deleteAccount,
};

// Log the modified code
console.log(
  "Modified forgotPassword function to remove resetLink for Postman testing"
);
