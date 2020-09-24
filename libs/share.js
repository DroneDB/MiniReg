const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config.js');
const rmdir = require('rimraf');
const Directories = require('./Directories');
const mv = require('mv');
const async = require('async');
const ddb = require('ddb');

const removeDirectory = function(dir, cb = () => {}){
    fs.stat(dir, (err, stats) => {
        if (!err && stats.isDirectory()) rmdir(dir, cb); // ignore errors, don't wait
        else cb(err);
    });
};

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const folderPath = path.join("tmp", req.id);

            fs.exists(folderPath, exists => {
                if (!exists) {
                    fs.mkdir(folderPath, undefined, () => {
                        cb(null, folderPath);
                    });
                } else {
                    cb(null, folderPath);
                }
            });
        },
        filename: (req, file, cb) => {
            const filename = uuidv4();
            req.tmpUploadFilePath = path.join("tmp", req.id, filename);

            cb(null, filename);
        }
    })
});

module.exports = {
    assignUUID: (req, res, next) => {
        req.id = uuidv4().replace(/-/g, '');
        next();
    },

    getUUID: (req, res, next) => {
        req.id = req.params.uuid;
        if (!req.id) res.status(400).json({error: `Invalid uuid (not set)`});

        const srcPath = path.join("tmp", req.id);

        fs.access(srcPath, fs.F_OK, err => {
            if (err) res.status(400).json({error: `Invalid uuid (not found)`});
            else next();
        });
    },

    preUpload: (req, res, next) => {
        // Testing stuff
        if (!config.test) next();
        else{
            if (config.testDropUploads){
                if (Math.random() < 0.5) res.sendStatus(500);
                else next();
            }else{
                next();
            }
        }
    },

    uploadFile: [upload.single("file"), (req, res, next) => {
        if (!req.tmpUploadFilePath){
            cb(new Error("Missing tmp upload file path"));
            return;
        }
        if (!req.body.path){
            cb(new Error("path field missing"));
            return;
        }

        const ddbPath = path.join("tmp", req.id);
        const filePath = path.join(ddbPath, req.body.path);
        
        // Path traversal check
        if (filePath.indexOf(ddbPath) !== 0){
            cb(new Error("Invalid path"));
            return;
        }
        
        const folderPath = path.dirname(filePath);

        async.series([
            cb => {
                // Create dir
                fs.exists(folderPath, exists => {
                    if (!exists) {
                        fs.mkdir(folderPath, {recursive: true}, () => {
                            cb(null, folderPath);
                        });
                    } else {
                        cb(null, folderPath);
                    }
                });
            },

            // TODO: remove from ddb index (allows re-uploads)

            cb => fs.rename(req.tmpUploadFilePath, filePath, cb),
            cb => {
                req.filePath = filePath;
                cb();
            }
        ], (err, _) => {
            if (err) res.status(400).json({error: err.message});
            else next();
        });
    }],

    handleUpload: (req, res) => {
        const ddbPath = path.join("tmp", req.id);

        if (req.file){
            ddb.add(ddbPath, req.filePath)
                .then(entries => {
                    const e = entries.find(e => !ddb.entry.isDirectory(e));
                    if (e){
                        res.json({
                            hash: e.hash,
                            size: e.size,
                            path: e.path
                        });
                    }else{
                        res.status(400).json({error: "Cannot add file (already added?)"});
                    }
                })
                .catch(e => {
                    res.status(400).json({error: e.message});
                });
        }else{
            res.status(400).json({error: "Need to upload 1 file."});
        }
    },

    handleCommit: (req, res) => {
        const srcPath = path.join("tmp", req.id);

        
    },

    handleInit: (req, res) => {
        req.body = req.body || {};
        
        const srcPath = path.join("tmp", req.id);

        // Print error message and cleanup
        const die = (error) => {
            res.json({error});
            removeDirectory(srcPath);
        };

        async.series([
            cb => {
                fs.stat(srcPath, (err, stat) => {
                    if (err && err.code === 'ENOENT') fs.mkdir(srcPath, undefined, cb);
                    else cb(); // Dir already exists
                });
            },
            cb => {
                fs.writeFile(bodyFile, JSON.stringify(req.body), {encoding: 'utf8'}, cb);
            },
            cb => {
                ddb.init(srcPath).then(() => cb())
                                 .catch(e => cb(e));
            },
            cb => {
                res.json({token: req.id});
                cb();
            }
        ],  err => {
            if (err) die(err.message);
        });
    },

    createTask: (req, res) => {
        // IMPROVEMENT: consider doing the file moving in the background
        // and return a response more quickly instead of a long timeout.
        req.setTimeout(1000 * 60 * 20);

        const srcPath = path.join("tmp", req.id);

        // Print error message and cleanup
        const die = (error) => {
            res.json({error});
            removeDirectory(srcPath);
        };

        if (req.error !== undefined){
            die(req.error);
        }else{
            let destPath = path.join(Directories.data, req.id);

            async.series([
                // Check if dest directory already exists
                cb => {
                    if (req.files && req.files.length > 0) {
                        fs.stat(destPath, (err, stat) => {
                            if (err && err.code === 'ENOENT') cb();
                            else{
                                // Directory already exists, try to remove it
                                removeDirectory(destPath, err => {
                                    if (err) cb(new Error(`Directory exists and we couldn't remove it.`));
                                    else cb();
                                });
                            } 
                        });
                    } else {
                        cb();
                    }
                },


                // Move all uploads to data/<uuid>/images dir (if any)
                cb => mv(srcPath, destPath, cb),
                

                // Create task
                cb => {
                    // console.log(req.body);

                    // TODO: ddb init

                }
            ], err => {
                if (err) die(err.message);
            });
        }
    }
}
