const ddb = require('../vendor/ddb');
const Directories = require('./Directories');
const path = require('path');
const fs = require('fs');

function getDDBPath(req, res, next){
    const { org, ds } = req.params;
        
    req.ddbPath = path.join(Directories.ddbData, org, ds);

    // Path traversal check
    if (req.ddbPath.indexOf(Directories.ddbData) !== 0){
        res.status(400).json({error: "Invalid path"});
        return;
    }

    next();
}

module.exports = {
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
            
            res.json(entry);
        }catch(e){
            res.status(400).json({error: e.message});
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
