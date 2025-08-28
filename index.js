const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectToMongo = require("./db");
const cookieParser = require("cookie-parser");



const labelerRoutes = require("./routes/labelerRoutes");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

connectToMongo();

// Middleware
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "http://127.0.0.1:5500", // Local frontend
  "https://media.adcanvas.com",
  "https://preview.nexd.com",
  "null", // Allow requests from sandboxed iframes
  /^https?:\/\/([a-z0-9-]+\.)*loopme\.me$/, // Allow loopme domains
  /^https?:\/\/([a-z0-9-]+\.)*loopmeedge\.net$/, // Allow loopmeedge.net domains
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Routes
app.use("/api/labeler", labelerRoutes);


// Root route for testing
app.get("/", (req, res) => {
  res.send("Akai Backend Running!");
});

app.listen(3001, () => {
  console.log("Game Backend Running on 3001");
});