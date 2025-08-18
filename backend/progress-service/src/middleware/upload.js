// const multer = require("multer");
// module.exports = multer({ storage: multer.memoryStorage() });

const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 5 * 1024 * 1024, // maksimal 5MB
//   },
});

module.exports = upload;