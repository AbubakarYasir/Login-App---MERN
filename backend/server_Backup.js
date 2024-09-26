require("dotenv").config(); // Add this at the top of your file
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();

// Import User model
const User = require("./models/User");

// Middleware
app.use(cors());
app.use(express.json()); // to parse incoming JSON data

// MongoDB connection using dotenv
mongoose
  .connect(process.env.MONGO_URI)
  // , { useNewUrlParser: true, useUnifiedTopology: true } - Removed as it's not needed anymore I guess
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// JWT authentication middleware
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "Authorization token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Routes and logic go here...

// GET ROUTES

// Test route
app.get("/", authenticateJWT, (req, res) => {
  res.json({ message: `Welcome, ${req.user.name}` });
});

// API route to request user list
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    res.json(users); // Send the list of users as JSON
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve users" });
  }
});

// POST Routes

// API route to create a user
app.post("/api/users", async (req, res) => {
  const { name, email, password } = req.body;

  // Check if the user data is valid
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  try {
    // Example: Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Save new user to the database
    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json(newUser); // Send back the new user data
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// API route to signup a user
app.post("/signup", async (req, res) => {
  const { name, email, password, repeatPassword } = req.body;

  if (!name || !email || !password || !repeatPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password !== repeatPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  // Check password strength
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 6 characters, with 1 uppercase letter, 1 lowercase letter, and 1 digit",
    });
  }

  try {
    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create a new user and hash the password
    const newUser = new User({ name, email, password });
    await newUser.save();

    // Create a token for the new user
    const token = jwt.sign(
      { id: newUser._id, name: newUser.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token, name: newUser.name });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// API route to login a user
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h", // Token valid for 1 hour
      }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// DELETE ROUTES

// DELETE route to delete a user by ID
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params; // Get user ID from the URL parameters

  try {
    const deletedUser = await User.findByIdAndDelete(id); // Find and delete the user by ID

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully", deletedUser });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
