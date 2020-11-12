const ddb = require('../vendor/ddb');
const Directories = require('./Directories');
const path = require('path');
const fs = require('fs');

module.exports = {
    handleListDatasets: async (req, res) => {
        const { org } = req.params;
       
        const orgDir = path.join(Directories.ddbData, org);

        // Path traversal check
        if (orgDir.indexOf(Directories.ddbData) !== 0){
            cb(new Error("Invalid path"));
            return;
        }

        fs.exists(orgDir, exists => {
            if (exists){
                fs.readdir(orgDir, { withFileTypes: true }, (err, files) => {
                    if (err) res.status(400).json({error: err.message});
                    else{
                        res.json(files.filter(f => f.isDirectory()).map(f => {
                            return {
                                slug: f.name
                                // name: path.basename(f)
                                // TODO: more?
                            };
                        }));
                    }
                });
            }else{
                res.json([]);
            }
        });

    }
}
