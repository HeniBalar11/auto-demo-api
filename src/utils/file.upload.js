const multer = require("multer");
const path = require("path");
const fs = require("fs");

const chatStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const dir = `./uploads/chat`;
    fs.mkdirSync(dir, { recursive: true });
    return cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const chatFileUpload = multer({
  storage: chatStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max limit
  fileFilter(_req, file, cb) {
    if (
      !file.originalname.match(
        /\.(png|jpg|jpeg|gif|webp|pdf|mp3|m4a|aac|wav|ogg|amr)$/i,
      )
    ) {
      return cb(
        new Error(
          "Allowed formats: png, jpg, jpeg, gif, webp, pdf, mp3, m4a, aac, wav, ogg, amr",
        ),
      );
    }
    cb(null, true);
  },
});

exports.uploadChatFiles = chatFileUpload.array("files", 10);

exports.detectFileType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) return "image";
  if ([".pdf"].includes(ext)) return "pdf";
  if ([".mp3", ".m4a", ".aac", ".wav", ".ogg", ".amr"].includes(ext)) return "voice";
  return "text";
};
