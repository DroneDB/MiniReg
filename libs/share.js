const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config.js');
const rmdir = require('rimraf');
const Directories = require('./Directories');
const mv = require('mv');
const async = require('async');

const removeDirectory = function(dir, cb = () => {}){
    fs.stat(dir, (err, stats) => {
        if (!err && stats.isDirectory()) rmdir(dir, cb); // ignore errors, don't wait
        else cb(err);
    });
};

const assureUniqueFilename = (dstPath, filename, cb) => {
    const dstFile = path.join(dstPath, filename);
    fs.exists(dstFile, exists => {
        if (!exists) cb(null, filename);
        else{
            const parts = filename.split(".");
            if (parts.length > 1){
                assureUniqueFilename(dstPath, 
                    `${parts.slice(0, parts.length - 1).join(".")}_.${parts[parts.length - 1]}`, 
                    cb);
            }else{
                // Filename without extension? Strange..
                assureUniqueFilename(dstPath, filename + "_", cb);
            }
        }
    });
};

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            let dstPath = path.join("tmp", req.id);
            fs.exists(dstPath, exists => {
                if (!exists) {
                    fs.mkdir(dstPath, undefined, () => {
                        cb(null, dstPath);
                    });
                } else {
                    cb(null, dstPath);
                }
            });
        },
        filename: (req, file, cb) => {
            let filename = file.originalname;
            if (filename === "body.json") filename = "_body.json";

            let dstPath = path.join("tmp", req.id);
            assureUniqueFilename(dstPath, filename, cb);
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
        if (!req.id) res.json({error: `Invalid uuid (not set)`});

        const srcPath = path.join("tmp", req.id);
        const bodyFile = path.join(srcPath, "body.json");

        fs.access(bodyFile, fs.F_OK, err => {
            if (err) res.json({error: `Invalid uuid (not found)`});
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

    uploadFile: upload.array("file"),

    handleUpload: (req, res) => {
        // IMPROVEMENT: check files count limits ahead of handleTaskNew
        if (req.files && req.files.length > 0){
            res.json({success: true});
        }else{
            res.json({error: "Need at least 1 file."});
        }
    },

    handleCommit: (req, res, next) => {
        const srcPath = path.join("tmp", req.id);
        const bodyFile = path.join(srcPath, "body.json");

        async.series([
            cb => {
                fs.readFile(bodyFile, 'utf8', (err, data) => {
                    if (err) cb(err);
                    else{
                        try{
                            const body = JSON.parse(data);
                            fs.unlink(bodyFile, err => {
                                if (err) cb(err);
                                else cb(null, body);
                            });
                        }catch(e){
                            cb(new Error("Malformed body.json"));
                        }
                    }
                });
            },
            cb => fs.readdir(srcPath, cb),
        ], (err, [ body, files ]) => {
            if (err) res.json({error: err.message});
            else{
                req.body = body;
                req.files = files;

                if (req.files.length === 0){
                    req.error = "Need at least 1 file.";
                }
                next();
            }
        });
    },

    handleInit: (req, res) => {
        req.body = req.body || {};
        
        const srcPath = path.join("tmp", req.id);
        const bodyFile = path.join(srcPath, "body.json");

        // Print error message and cleanup
        const die = (error) => {
            res.json({error});
            removeDirectory(srcPath);
        };

        async.series([
            cb => {
                // Check for problems before file uploads
                if (req.body && req.body.options){
                    odmInfo.filterOptions(req.body.options, err => {
                        if (err) cb(err);
                        else cb();
                    });
                }else cb();
            },
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
                // ddb init
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
