const ddb = require('../vendor/ddb');
const Directories = require('./Directories');
const path = require('path');

module.exports = {
    handleList: async (req, res) => {
        const { org, ds } = req.params;

        const ddbPath = path.join(Directories.ddbData, org, ds);
        
        // Path traversal check
        if (ddbPath.indexOf(Directories.ddbData) !== 0){
            cb(new Error("Invalid path"));
            return;
        }

        try{
            res.json(await ddb.list(ddbPath, "."));
        }catch(e){
            res.status(400).json({error: e.message});
        }

    }
}
