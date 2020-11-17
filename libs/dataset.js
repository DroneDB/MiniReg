const ddb = require('../vendor/ddb');
const Directories = require('./Directories');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('./logger');
const util = require('util');
const archiver = require('archiver');

const fsExists = util.promisify(fs.exists);
const fsUnlink = util.promisify(fs.unlink);
const fsLstat = util.promisify(fs.lstat);
const fsMkdir = util.promisify(fs.mkdir);
const fsReadir = util.promisify(fs.readdir);

async function getDDBPath(req, res, next){
    const { org, ds } = req.params;
        
    req.ddbPath = path.join(Directories.ddbData, org, ds);

    // Path traversal check
    if (req.ddbPath.indexOf(Directories.ddbData) !== 0){
        res.status(400).json({error: "Invalid path"});
        return;
    }

    // Dir check
    if (!(await fsExists(req.ddbPath))){
        res.status(400).json({error: "Invalid path"});
        return;
    }

    next();
}

const downloadTasks = {};

// Cleanup stale tasks
setInterval(async () => {
    const tasksToCleanup = [];

    for (let uuid in downloadTasks){
        const dt = downloadTasks[uuid];

        // Remove tasks two days old 
        if (dt.created + 1000 * 60 * 60 * 24 * 2  < new Date().getTime()){
            tasksToCleanup.push(uuid);
        }
    }

    for (let i = 0; i < tasksToCleanup.length; i++){
        const uuid = tasksToCleanup[i];
        const dt = downloadTasks[uuid];

        // Remove ONLY files in the downloads directory
        if (dt.file.indexOf(Directories.downloads) === 0 && await fsExists(dt.file)){
            await fsUnlink(dt.file);
            logger.info(`Cleaned up ${dt.file}`);
        }

        delete downloadTasks.uuid;
    }
}, 2000);

module.exports = {
    initialize: async () => {
        // Cleanup downloads on startup
        const files = await fsReadir(Directories.downloads);
        for (let i = 0; i < files.length; i++){
            const f = path.join(Directories.downloads, files[i]);
            try{
                await fsUnlink(f);
                logger.info(`Removed orphaned ${f}`);
            }catch(e){
                logger.error(e);
            }
        }
    },

    handleDownloadFile: (req, res) => {
        const { uuid } = req.params;

        const dt = downloadTasks[uuid];
        if (!dt){
            res.status(400).json({error: "Invalid download"});
            return;
        }

        if (dt.completed){
            res.download(path.resolve(dt.file), dt.friendlyName);
        }else if (dt.error){
            res.status(400).json({error: dt.error});
        }else{
            res.json({error: "Not ready for download"});
        }
    },

    handleList: [getDDBPath, async (req, res) => {
        const paths = req.body.path ? [req.body.path.toString()] : ".";

        try{
            res.json(await ddb.list(req.ddbPath, paths));
        }catch(e){
            res.status(400).json({error: e.message});
        }

    }],

    handleInfo: [getDDBPath, async (req, res) => {
        try{
            const entries = await ddb.info(req.ddbPath);
            if (!entries.length) throw new Error("Cannot find dataset");
            
            const entry = entries[0];

            // Override depth and path
            entry.depth = 0;

            // TODO: SSL check
            entry.path = `ddb+unsafe://${req.headers.host}/${req.params.org}/${req.params.ds}`;

            // TODO: entry.size is zero (DDB is a folder), but we should probably
            // include the size of the database (sum all indexes entries)
            
            res.json(entries);
        }catch(e){
            res.status(400).json({error: e.message});
        }
    }],

    handleDownloadCheck: [getDDBPath, async (req, res) => {
        const { uuid } = req.body;
        const dt = downloadTasks[uuid];

        if (!dt){
            res.status(400).json({error: "Invalid UUID"});
            return;
        }

        if (dt.completed){
            res.status(200).json({downloadUrl: `/download/${uuid}`});
        }else if (dt.error){
            res.json({error: dt.error});
        }else{
            res.json({progress: dt.progress});
        }
    }],

    handleDownload: [getDDBPath, async (req, res) => {
        const { org, ds } = req.params;

        // Generate UUID based on dataset+paths
        const hash = crypto.createHash('sha256');
        let paths = req.body.path || [];
        if (typeof paths === "string") paths = [paths];

        // Generate UUID
        const uuid = hash.update(`${Math.random()}/${new Date().getTime()}`).digest("hex");
        const useZip = (paths.length === 0) || (paths.length > 1);

        const die = async (error) => {
            console.log(error);
            const dt = downloadTasks[uuid];
            if (dt) dt.error = error;
            if (!res.headersSent) res.json({error});
        };

        if (!useZip){
            // Download directly, easy
            const file = path.join(req.ddbPath, paths[0]);

            // Path traversal check
            if (file.indexOf(req.ddbPath) !== 0){
                await die("Invalid path");
                return;
            }

            downloadTasks[uuid] = {
                file,
                friendlyName: path.basename(file),
                progress: 100,
                completed: true,
                error: "",
                created: new Date().getTime()
            };

            res.status(200).json({downloadUrl: `/download/${uuid}`});
        }else{
            const zipFile = path.join(Directories.downloads, `${uuid}.zip`);

            try{
                // Basic path checks
                for (let i = 0; i < paths.length; i++){
                    const p = paths[i];
                    const fullP = path.join(req.ddbPath, p);
    
                    // Path traversal check
                    if (fullP.indexOf(req.ddbPath) !== 0){
                        await die(`Invalid path: ${p}`);
                        return;
                    }

                    if (!(await fsExists(fullP))){
                        await die(`Invalid path: ${p}`);
                        return;
                    }
                }

                
                downloadTasks[uuid] = {
                    file: zipFile,
                    friendlyName: `${org}-${ds}.zip`,
                    progress: 0,
                    completed: false,
                    error: "",
                    created: new Date().getTime()
                };
                const dt = downloadTasks[uuid];

                let archive = archiver.create('zip', {
                    zlib: { level: 1 } // Sets the compression level (1 = best speed since most assets are already compressed)
                });

                archive.on('error', err => {
                    die(err.message);
                });

                archive.on('progress', p => {
                    dt.progress = p.fs.processedBytes / p.fs.totalBytes * 90.0;
                });

                // This shouldn't happen, but just in case
                if (await fsExists(zipFile)) await fsUnlink(zipFile);
                
                // Guarantee downloads dir exists
                if (!await fsExists(Directories.downloads)) await fsMkdir(Directories.downloads);

                const fout = fs.createWriteStream(zipFile);
                fout.on('close', () => {
                    dt.progress = 100;
                    dt.completed = true;
                });

                archive.pipe(fout);

                // return this to the client, then start processing
                res.status(200).json({id: uuid, progress: dt.progress});
                
                if (paths.length === 0){
                    // Add everything
                    archive.directory(req.ddbPath, false);
                }else{
                    for (let i = 0; i < paths.length; i++){
                        const p = paths[i];
                        const fullP = path.join(req.ddbPath, p);
                       
                        if ((await fsLstat(fullP)).isDirectory()){
                            archive.directory(fullP, p);
                        }else{
                            archive.file(fullP, {name: p});
                        }
                    }
                }

                archive.finalize();
            }catch(e){
                await die(`Cannot download dataset: ${e.message}`);
            }
        }
    }],

    handleDelete: [getDDBPath, async (req, res) => {
        fs.rmdir(req.ddbPath, { recursive: true, maxRetries: 5}, err => {
            if (!err) res.status(204).send("");
            else{
                res.status(400).json({error: `Could not delete ${req.params.org}/${req.params.ds}`});
            }
        });
    }]
}
