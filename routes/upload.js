const express = require("express");
const router = express.Router();
const path = require("path"); // used for path
const fs = require("fs");
const fn = require("../functions");
const cf = require("../config/config");
const multer = require("multer");
const myPath = path.join(__dirname, "..");


const environments_storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(myPath, '/environments'))
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const data_storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(myPath, '/datafiles'))
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const tests_storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(myPath, '/featuretests'))
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const Collection_storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(myPath, '/collections'))
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const uploadcollection = multer({
    storage: Collection_storage,
    fileFilter: function (req, file, callback) {
        if (path.extname(file.originalname) !== '.json') {
            return callback(new Error('Only json files are allowed'));
        }
        callback(null, true);
    }
});

router.post('/collections', uploadcollection.array('files'), (req, res) => {
    try {
        // Handle the files here...
        // If everything is OK, send back a success message
        res.redirect('/upload/success');
    } catch (error) {
        // If an error occurred, send back an error message
        console.error('Error:', error);
        res.json({
            error: 'An error occurred while uploading the files.'
        });
    }
});



const uploadenvironments = multer({
    storage: environments_storage,
    fileFilter: function (req, file, callback) {
        if (path.extname(file.originalname) !== '.json') {
            return callback(new Error('Only json files are allowed'));
        }
        callback(null, true);
    }
});

const uploaddata = multer({
    storage: data_storage,
    fileFilter: function (req, file, callback) {
        if (path.extname(file.originalname) !== '.json') {
            return callback(new Error('Only json files are allowed'));
        }
        callback(null, true);
    }
});

const uploadtests = multer({
    storage: tests_storage,
    fileFilter: function (req, file, callback) {
        if (path.extname(file.originalname) !== '.json') {
            return callback(new Error('Only json files are allowed'));
        }
        callback(null, true);
    }
});


router.post('/environments', uploadenvironments.array('files'), (req, res) => {
    try {
        // Handle the files here...
        // If everything is OK, send back a success message
        res.redirect('/upload/success');
    } catch (error) {
        // If an error occurred, send back an error message
        console.error('Error:', error);
        res.json({
            error: 'An error occurred while uploading the files.'
        });
    }
});

router.post('/data', uploaddata.array('files'), (req, res) => {
    try {
        // Handle the files here...
        // If everything is OK, send back a success message
        res.redirect('/upload/success');
    } catch (error) {
        // If an error occurred, send back an error message
        console.error('Error:', error);
        res.json({
            error: 'An error occurred while uploading the files.'
        });
    }

});

router.post('/tests', uploadtests.array('files'), (req, res) => {
    try {
        // Handle the files here...
        // If everything is OK, send back a success message
        res.redirect('/upload/success');
    } catch (error) {
        // If an error occurred, send back an error message
        console.error('Error:', error);
        res.json({
            error: 'An error occurred while uploading the files.'
        });
    }
});

router.get('/', (req, res) => {
    res.sendFile(myPath + '/pages/upload.html');
});

router.get('/success', (req, res) => {
    res.sendFile(myPath + '/pages/uploadsuccess.html');
});

module.exports = router;