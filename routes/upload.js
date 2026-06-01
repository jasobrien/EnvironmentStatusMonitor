const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const fn = require("../functions");
const cf = require("../config/config");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");
const myPath = path.join(__dirname, "..");

// Allowed filename characters: alphanumeric, hyphen, underscore, dot — must end in .json
const SAFE_FILENAME_RE = /^[A-Za-z0-9_.-]+\.json$/;

/**
 * Factory function to create multer storage configuration
 */
function createMulterStorage(destinationFolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(myPath, destinationFolder)),
    filename: (req, file, cb) => {
      const name = file.originalname;
      if (!SAFE_FILENAME_RE.test(name)) {
        return cb(new Error(`Unsafe filename rejected: "${name}". Only alphanumeric characters, hyphens, underscores, and dots are allowed.`));
      }
      cb(null, name);
    }
  });
}

/**
 * Factory function to create JSON file filter
 */
function createJsonFileFilter() {
  return function (req, file, callback) {
    if (path.extname(file.originalname) !== '.json') {
      return callback(new Error('Only json files are allowed'));
    }
    callback(null, true);
  };
}

/**
 * Factory function to create upload middleware
 */
function createUploadMiddleware(destinationFolder) {
  return multer({
    storage: createMulterStorage(destinationFolder),
    fileFilter: createJsonFileFilter()
  });
}

/**
 * Generic upload handler
 */
function createUploadHandler(uploadMiddleware) {
  return [
    requireAuth,
    uploadMiddleware.array('files'),
    (req, res) => {
      try {
        res.redirect('/upload/success');
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
          error: 'An error occurred while uploading the files.'
        });
      }
    }
  ];
}

// Create upload middleware for each destination
const uploadcollection = createUploadMiddleware('/tests/postman/collections');
const uploadenvironments = createUploadMiddleware('/tests/postman/environments');
const uploaddata = createUploadMiddleware('/tests/postman/datafiles');
const uploadtests = createUploadMiddleware('/schedules');

// Upload routes with consolidated handlers
router.post('/collections', ...createUploadHandler(uploadcollection));
router.post('/environments', ...createUploadHandler(uploadenvironments));
router.post('/data', ...createUploadHandler(uploaddata));
router.post('/tests', ...createUploadHandler(uploadtests));

router.get('/', requireAuth, (req, res) => {
    res.sendFile(myPath + '/pages/upload.html');
});

router.get('/success', (req, res) => {
    res.sendFile(myPath + '/pages/uploadsuccess.html');
});

module.exports = router;