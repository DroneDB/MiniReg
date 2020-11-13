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

    handleDelete: [getDDBPath, async (req, res) => {
        fs.rmdir(req.ddbPath, { recursive: true, maxRetries: 5}, err => {
            if (!err) res.status(204).send("");
            else{
                res.status(400).json({error: `Could not delete ${req.params.org}/${req.params.ds}`});
            }
        });
    }]
}
