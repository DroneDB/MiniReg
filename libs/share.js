const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config.js');
const rmdir = require('rimraf');
const Directories = require('./Directories');
const mv = require('mv');
const async = require('async');
const tag = require('./tag');
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
        const bodyFile = path.join(srcPath, "__body.json");

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

    uploadFile: [upload.single("file"), (req, res, next) => {
        if (!req.tmpUploadFilePath){
            cb(new Error("Missing tmp upload file path"));
            return;
        }
        if (!req.body.path){
            cb(new Error("path field missing"));
            return;
        }

        if (!req.body.path === "__body.json"){
            cb(new Error("invalid path"));
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

            cb => mv(req.tmpUploadFilePath, filePath, cb),
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
        const bodyFile = path.join(srcPath, "__body.json");
        
        let body = {};
        let tagComp = null;
        let destDir = null;

        async.series([
            cb => {
                fs.readFile(bodyFile, 'utf8', (err, data) => {
                    if (err) cb(err);
                    else{
                        try{
                            body = JSON.parse(data);
                            fs.unlink(bodyFile, err => {
                                if (err) cb(err);
                                else cb(null, body);
                            });
                        }catch(e){
                            cb(new Error("Malformed __body.json"));
                        }
                    }
                });
            },

            cb => {
                tagComp = tag.parseOrCreateTag(body.tag);
                destDir = path.join(Directories.ddbData, tagComp.organization, tagComp.dataset)

                fs.stat(destDir, (err, stat) => {
                    if (err && err.code === 'ENOENT') fs.mkdir(destDir, {recursive: true}, cb);
                    else{
                        // Dir already exist, remove it
                        rmdir(destDir, err => {
                            if (err) cb(err);
                            else fs.mkdir(destDir, {recursive: true}, cb);
                        });
                    }
                });
            }
        ], (err) => {
            if (err){
                res.status(400).json({error: err.message});
                return;
            }

            mv(srcPath, destDir, err => {
                if (err) res.status(400).json({error: err.message});
                else res.json({url: `/r/${tagComp.organization}/${tagComp.dataset}`, tag: tag.dump(tagComp)});
            });
        });
    },

    handleInit: (req, res) => {
        req.body = req.body || {};
        
        const srcPath = path.join("tmp", req.id);
        const bodyFile = path.join(srcPath, "__body.json");

        // Print error message and cleanup
        const die = (error) => {
            res.json({error});
            removeDirectory(srcPath);
        };

        const t = tag.parseOrCreateTag(req.body.tag);

        // Fill organization if missing
        if (t.organization.trim() === ""){
            t.organization = req.user.username;
        }

        // Check that we can create a dataset under the requested org
        if (t.organization !== req.user.username && t.organization !== t.PUBLIC_ORG_NAME){
            res.status(401).json({error: `You're not authorized to upload to this organization.`});
            return;
        }

        async.series([
            cb => {
                fs.stat(srcPath, (err, stat) => {
                    if (err && err.code === 'ENOENT') fs.mkdir(srcPath, undefined, cb);
                    else cb(); // Dir already exists
                });
            },
            cb => {
                // Update body tag
                req.body.tag = tag.dump(t);

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
    }
}
