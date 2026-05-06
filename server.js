const express = require("express");
const cors = require("cors");
require("dotenv").config();

const parksRouter = require("./routes/parks");
const uvRouter = require("./routes/uv");
const coolingRouter = require("./routes/cooling");
const crowdRouter = require("./routes/crowd");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Routes
app.use("/api/parks", parksRouter);
app.use("/api/uv", uvRouter);
app.use("/api/cooling-centres", coolingRouter);
app.use("/api/crowd", crowdRouter);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Urban Shade API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
