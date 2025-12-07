const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const fn = require("../functions");
const cf = require("../config/config");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");
const myPath = path.join(__dirname, "..");

/**
 * Factory function to create multer storage configuration
 */
function createMulterStorage(destinationFolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(myPath, destinationFolder)),
    filename: (req, file, cb) => cb(null, file.originalname)
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
const uploadcollection = createUploadMiddleware('/collections');
const uploadenvironments = createUploadMiddleware('/environments');
const uploaddata = createUploadMiddleware('/datafiles');
const uploadtests = createUploadMiddleware('/featuretests');

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