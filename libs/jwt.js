const jwt = require('jsonwebtoken');
const dbconf = require('./dbconf');
const crypto = require('crypto');

// Generate secret
dbconf.setIfNotExists("jwt_secret", crypto.randomBytes(32).toString('hex'));
const secret = dbconf.get("jwt_secret");

const DEFAULT_EXPIRATION_HOURS = 6;

const readJwt = function(req, res, next){
    req.user = {};
    
    let token = req.headers['Authorization'];
    if (token) token = token.replace(/^Bearer /i, "");

    if (!token){
        // Check cookie
        token = req.cookies['jwtToken'];
    }

    if (token) {
        try{
            const decoded = jwt.verify(token, secret, { algorithms: ["HS256"]});
            req.user = decoded;
        }catch(e){
            // Invalid
        }
    }

    next();
};

module.exports = {
    DEFAULT_EXPIRATION_HOURS,
    readJwt,

    jwtAuth: [readJwt, function(req, res, next){
    	if (!req.user.username) res.status(401).json({error: "Unauthorized"});
 
    	else next();
    }],
    sign: function(data){
        return jwt.sign(data, secret, { expiresIn: DEFAULT_EXPIRATION_HOURS + 'h' });
    }
}
