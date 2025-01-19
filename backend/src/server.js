const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const handlebars = require("handlebars");

const app = express();
const PORT = process.env.PORT||3000;

app.use(cors());
app.use(express.json());

// Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Read layout.hbs and compile
const layoutPath = path.join(__dirname, "../templates/layout.hbs");
const layoutSource = fs.readFileSync(layoutPath, "utf8");
const template = handlebars.compile(layoutSource);

// Register a custom helper to compare equality (for "type")
handlebars.registerHelper("ifEq", function (a, b, options) {
  return a === b ? options.fn(this) : options.inverse(this);
});

// 1. Return the raw layout for client-side preview
app.get("/getEmailLayout", (req, res) => {
  res.json({ layout: layoutSource });
});

// 2. Handle image uploads
app.post("/uploadImage", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  const fileUrl = `https://email-template-maker-frontend.onrender.com/uploads/${req.file.filename}`;
  res.json({ imageUrl: fileUrl });
});

// 3. Save config (demo: just log it)
app.post("/uploadEmailConfig", (req, res) => {
  console.log("Email Config:", req.body);
  res.status(200).json({ message: "Config saved (logged to console)!" });
});

// 4. Render final + download
app.post("/renderAndDownloadTemplate", (req, res) => {
  try {
    const merged = template(req.body);
    res.setHeader("Content-Disposition", "attachment; filename=emailTemplate.html");
    res.setHeader("Content-Type", "text/html");
    res.send(merged);
  } catch (error) {
    console.error("Error rendering:", error);
    res.status(500).send("Render error");
  }
});

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.listen(PORT, () => {
  console.log(`Backend listening on https://email-template-maker-frontend.onrender.com/`);
});
