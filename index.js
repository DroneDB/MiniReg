"use strict";

const fs = require('fs');
const config = require('./config.js');
const packageJson = JSON.parse(fs.readFileSync('./package.json'));
const users = require('./libs/users');
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const hbhelpers = require('./webapp/views/helpers/helpers');

const logger = require('./libs/logger');
const async = require('async');
const authProviders = require('./libs/authProviders');
const Directories = require('./libs/Directories');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const multer = require('multer');
const { jwtAuth, DEFAULT_EXPIRATION_HOURS } = require('./libs/jwt');
const security = require('./libs/security');
const share = require('./libs/share');
const dataset = require('./libs/dataset');
const orgs = require('./libs/orgs');

const hbs = exphbs.create({
    helpers: hbhelpers,
    extname: '.hbs'
});
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', 'webapp/views');
if (process.env.NODE_ENV === 'production') app.enable('view cache');

app.use(express.static('webapp/public'));
app.use(cookieParser());

const formDataParser = [multer().none(), bodyParser.urlencoded({extended: false})];

let server;

app.post('/share/init', jwtAuth, share.assignUUID, formDataParser, share.handleInit);
app.post('/share/upload/:uuid', jwtAuth, share.getUUID, share.preUpload, share.uploadFile, share.handleUpload);
app.post('/share/commit/:uuid', jwtAuth, share.getUUID, share.handleCommit);

app.post('/users/authenticate', formDataParser, async (req, res) => {
    try{
        const token = await users.login(req.body.username, req.body.password);

        res.json({
            token,
            expires: parseInt(((new Date().getTime() + DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000) / 1000).toFixed(0)),    
        });
    }catch(e){
        res.status(401).json({error: e.message});
    }
});

app.post('/users/authenticate/refresh', jwtAuth, (req, res) => {
    try{
        const token = users.refreshToken(req.user);

        res.json({
            token,
            expires: parseInt(((new Date().getTime() + DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000) / 1000).toFixed(0)),    
        });
    }catch(e){
        res.status(401).json({error: e.message});
    }
});

app.get('/orgs/:org/ds', security.allowOrgOwnerOrPublicOrgOnly, orgs.handleListDatasets);

app.post('/orgs/:org/ds/:ds/list', formDataParser, security.allowDatasetRead, dataset.handleList);

app.get('/orgs/:org/ds/:ds/download', formDataParser, security.allowDatasetRead, dataset.handleDownload);
app.post('/orgs/:org/ds/:ds/download', formDataParser, security.allowDatasetRead, dataset.handleDownload);

app.post('/orgs/:org/ds/:ds/rename', formDataParser, security.allowDatasetOwnerOnly, dataset.handleRename);
app.get('/orgs/:org/ds/:ds/thumb', formDataParser, security.allowDatasetRead, dataset.handleThumb);

app.post('/orgs/:org/ds/:ds/chattr', formDataParser, security.allowDatasetOwnerOnly, dataset.handleChattr);


app.get('/orgs/:org/ds/:ds', security.allowDatasetRead, dataset.handleInfo);
app.delete('/orgs/:org/ds/:ds', security.allowDatasetOwnerOnly, dataset.handleDelete);

// Not part of official API
// These are views
app.get('/r/:org/:ds?', (req, res) => {
    res.render('app');
});
app.get('/login', (req, res) => {
    res.render('app');
});
app.get('/', (req, res) => {
    res.redirect(301, '/login');
});

// This is a download entrypoint (not part of spec)
app.get('/download/:uuid', dataset.handleDownloadFile);

app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({error: "Unauthorized"});
    }else{
      logger.error(err.stack);
      res.status(500).json({error: err.message});
    }
});


let gracefulShutdown = done => {
    async.series([
        cb => {
            logger.info("Closing server");
            server.close();
            logger.info("Exiting...");
            process.exit(0);
        }
    ], done);
};

// listen for TERM signal .e.g. kill
process.on('SIGTERM', gracefulShutdown);

// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', gracefulShutdown);

// Startup
if (config.test) {
    logger.info("Running in test mode");
}


logger.info(`${packageJson.name} ${packageJson.version} - ${packageJson.description}`);

let commands = [
    cb => {
        // Assure data dir exists
        if (!fs.existsSync(Directories.data)){
            fs.mkdirSync(Directories.data);
            logger.info(`Created ${Directories.data}`);
        }
        cb();
    },
    cb => {
        authProviders.initialize(config.auth, config.remoteAuth);

        users.createDefaultUsers();

        if (config.ssl){
            const https = require('https');
            const key  = fs.readFileSync(config.sslKey, 'utf8');
            const cert = fs.readFileSync(config.sslCert, 'utf8');
            logger.info("Using SSL");
            server = https.createServer({ key, cert }, app);
        }else{
            const http = require('http');
            server = http.createServer(app);
        }

        server.listen(config.port, err => {
            if (!err) logger.info('Server has started on port ' + String(config.port));
            cb(err);
        });
    }
];

if (config.powercycle) {
    commands.push(cb => {
        logger.info("Power cycling is set, application will shut down...");
        process.exit(0);
    });
}

async.series(commands, err => {
    if (err) {
        logger.error("Error during startup: " + err.message);
        process.exit(1);
    }
});
