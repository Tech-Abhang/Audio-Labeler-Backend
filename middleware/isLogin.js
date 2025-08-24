const jwt = require("jsonwebtoken");
const Labeler = require("../models/labeler");

const isLogin = async (req, res, next) => {
  try {
    const accessToken = req.cookies.labelerAccessToken;
    const refreshToken = req.cookies.labelerRefreshToken;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        req.labeler = decoded;
        return next(); // Access token is valid, proceed to the next middleware or route
      } catch (err) {
        // If access token is expired, attempt to refresh it
        if (err.name !== "TokenExpiredError") {
          return res.status(403).json({ message: "Invalid access token." });
        }
      }
    }

    // Refresh the access token using the refresh token
    jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET,
      async (err, decoded) => {
        if (err) {
          return res
            .status(403)
            .json({ message: "Session expired. Please login again." });
        }

        const labeler = await Labeler.findById(decoded.id);
        if (!labeler) {
          return res
            .status(403)
            .json({ message: "Invalid refresh token. Please login again." });
        }

        // Generate a new access token
        const newAccessToken = jwt.sign(
          {
            id: labeler._id,
            username: labeler.username,
            email: labeler.email,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.cookie("labelerAccessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
          domain:
            process.env.NODE_ENV === "production" ? "akaispace.xyz" : undefined,
          maxAge: 60 * 60 * 1000, // 1 hour
        });

        req.labeler = {
          id: labeler._id,
          username: labeler.username,
          email: labeler.email,
        };
        next(); // Proceed to the next middleware or route
      }
    );
  } catch (error) {
    console.error("Error in isLogin middleware:", error);
    res.status(500).json({ message: "Middleware: Internal server error." });
  }
};

module.exports = { isLogin };