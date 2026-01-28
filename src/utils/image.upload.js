const multer = require("multer");
const path = require("path");
const fs = require('fs')

const imageStorage = multer.diskStorage({
    // Destination to store image
    destination: (_req, file, cb) => {
        const path = `./uploads/${file.fieldname}`
        fs.mkdirSync(path, { recursive: true })
        return cb(null, path)
    },
    filename: (_req, file, cb) => {
        cb(null, `${file.originalname.split(".")[0]}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const imageUpload = multer({
    storage: imageStorage,
    fileFilter(_req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg|gif|pdf|JPG|JPEG|PNG|HEIF|mp4|mov|mkv|webm)$/)) {
            // upload only png and jpg format
            return cb(new Error("Please upload a png|jpg|jpeg|mkv|gif|pdf|heif|mp4|mov|mkv|webm"));
        }
        cb(undefined, true);
    }
});

// upload file to disk
exports.upload = imageUpload.fields([
    // user
    { name: "image", maxCount: 1 },
    //product
    { name: "media", maxCount: 1 },
]);
// Remove file from disk
// exports.removeFile = promisify(fs.unlink)

exports.removeFile = (path) =>
    fs.unlink(path, function (err) {
        if (!err) console.log('File deleted!');
    });


exports.getMediaType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if ([".png", ".jpg", ".jpeg", ".gif"].includes(ext)) return "image";
  if ([".mp4", ".mov", ".mkv", ".webm"].includes(ext)) return "video";

  return null;
};