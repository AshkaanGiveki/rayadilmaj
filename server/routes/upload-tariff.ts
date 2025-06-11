import express from "express";
import multer from "multer";
import path, { dirname } from "path";
import fs from "fs";
import { Request, Response } from "express";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const uploadDir = path.join(process.cwd(), "server/uploads/tariffs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});


router.post("/upload-tariff", upload.single("file"), (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }
  
    res.status(200).json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
    });
  });

export default router;
