const { readJwt } = require('./jwt');
const { PUBLIC_ORG_NAME } = require('./tag');

module.exports = {
    allowDatasetOwnerOrPasswordOnly: [readJwt, function(req, res, next){
        const { org, ds } = req.params;

        if (!org) res.status(400).json({error: "Missing organization param"});
        if (!ds) res.status(400).json({error: "Missing dataset param"});
        
        if (req.user.username && req.user.username == org){
            next(); // Grant
            return;
        }

        if (org === PUBLIC_ORG_NAME){ // && !password (TODO)
            next(); // Grant
            return;
        }

        res.status(401).json({error: "Unauthorized"});

        // Check password
        // TODO!
    }]
}
