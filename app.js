import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "uploads");

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(cors());
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set({
    "X-Powered-By": "OpenEyes",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'self'",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  });
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4(); // Generate a unique ID
    // Use only the UUID as the filename
    const newFilename = `${uniqueId}.mp3`;
    cb(null, newFilename);
  },
});

const upload = multer({ storage: storage });

app.post("/v1/files", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded.");
    }
    const fileId = req.file.filename.split(".")[0];
    res.status(200).json({ success: true, id: fileId });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

app.get("/v1/cdn/audio/:id", (req, res) => {
  try {
    const fileId = req.params.id;
    const filePath = path.join(uploadDir, `${fileId}.mp3`);

    if (!fs.existsSync(filePath)) {
      throw new Error("File not found.");
    }

    const fileContent = fs.readFileSync(filePath);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": fileContent.length,
    });

    res.send(fileContent);
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

app.delete("/v1/files/:id", (req, res) => {
  try {
    const fileId = req.params.id;
    const filePath = path.join(uploadDir, `${fileId}.mp3`);

    if (!fs.existsSync(filePath)) {
      throw new Error("File not found.");
    }

    fs.unlinkSync(filePath);

    res
      .status(200)
      .json({ success: true, message: "File deleted successfully." });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
