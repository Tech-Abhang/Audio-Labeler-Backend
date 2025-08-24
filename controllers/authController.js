const Labeler = require("../models/labeler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register a New Labeler
const register = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    // Check if labeler already exists
    const existingLabeler = await Labeler.findOne({
      $or: [{ username }, { email }],
    });

    if (existingLabeler) {
      return res.status(400).json({
        message: "Username or email already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new labeler
    const newLabeler = new Labeler({
      username,
      name,
      email,
      password: hashedPassword,
      dp_list: [],
      rating: 0,
      dailyLimit:25,
    });

    await newLabeler.save();

    res.status(201).json({
      message: "Labeler registered successfully.",
      labeler: {
        id: newLabeler._id,
        username: newLabeler.username,
        name: newLabeler.name,
        email: newLabeler.email,
      },
    });
  } catch (error) {
    console.error("Error occurred during registration:", error);
    res.status(500).json({
      message: "Error occurred while registering.",
      error: error.message,
    });
  }
};

// Login Labeler
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find labeler by email
    const labeler = await Labeler.findOne({ email });

    if (!labeler) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, labeler.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    // Generate access token
    const accessToken = jwt.sign(
      {
        id: labeler._id,
        username: labeler.username,
        email: labeler.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: labeler._id },
      process.env.REFRESH_SECRET,
      { expiresIn: "15d" }
    );

    // Set refresh token in HTTP-only cookie
    res.cookie("labelerRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    });

    // Set access token in HTTP-only cookie
    res.cookie("labelerAccessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.status(200).json({
      message: "Login successful",
      labeler: {
        id: labeler._id,
        username: labeler.username,
        name: labeler.name,
        email: labeler.email,
        rating: labeler.rating,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Error occurred during login:", error);
    res.status(500).json({
      message: "Error occurred during login.",
      error: error.message,
    });
  }
};

const getUserData = async (req, res) => {
  try {
    const labelerId = req.labeler.id;
    const labeler = await Labeler.findById(labelerId).select("-password");;
    if (!labeler) {
      return res
        .status(404)
        .json({ success: false, message: "Labeler not found" });
    }

    res.status(200).json({ success: true, labeler });
  } catch (error) {
    res.status(500).json({
      message: "Error occurred during fetching user data.",
      error: error.message,
    });
  }
};

// Logout Labeler
const logout = async (req, res) => {
  try {
    // Clear cookies
    res.clearCookie("labelerRefreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.clearCookie("labelerAccessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Error occurred while logging out.",
      error: error.message,
    });
  }
};

const checkAuthStatus = (req, res) => {
  const accessToken = req.cookies.labelerAccessToken;
  const refreshToken = req.cookies.labelerRefreshToken;

  if (!accessToken && !refreshToken) {
    return res.status(200).json({ status: false }); // No tokens, deny access
  }

  jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
    if (!err) {
      return res.status(200).json({ status: true }); // Valid access token, allow access
    }

    // Access token expired or invalid, check refresh token
    jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET,
      (refreshErr, refreshDecoded) => {
        if (refreshErr) {
          return res.status(200).json({ status: false }); // Both tokens invalid, deny access
        }

        // Refresh token is valid, generate a new access token
        const newAccessToken = jwt.sign(
          { id: refreshDecoded.id },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        // Set the new access token as a cookie
        res.cookie("labelerAccessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
          domain:
            process.env.NODE_ENV === "production" ? "akaispace.xyz" : undefined,
          maxAge: 60 * 60 * 1000, // 1 hour
        });
        return res.status(200).json({ status: true }); // Allow access with refreshed token
      }
    );
  });
};

module.exports = {
  register,
  login,
  logout,
  checkAuthStatus,
  getUserData,
};