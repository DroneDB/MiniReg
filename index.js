"use strict";

const fs = require('fs');
const config = require('./config.js');
const packageJson = JSON.parse(fs.readFileSync('./package.json'));
const db = require('./libs/db');
const users = require('./libs/users');

const logger = require('./libs/logger');
const async = require('async');
const mime = require('mime');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const multer = require('multer');
const { jwtAuth } = require('./libs/jwt');

const share = require('./libs/share');

app.use(express.static('webapp/public'));

const formDataParser = [multer().none(), bodyParser.urlencoded({extended: false})];

let server;

app.post('/share/init', jwtAuth, share.assignUUID, formDataParser, share.handleInit);
app.post('/share/upload/:uuid', jwtAuth, share.getUUID, share.preUpload, share.uploadFile, share.handleUpload);
app.post('/share/commit/:uuid', share.getUUID, share.handleCommit);

app.post('/users/authenticate', formDataParser, (req, res) => {
    try{
        res.json({token: users.login(req.body.username, req.body.password)});
    }catch(e){
        res.status(401).json({error: e.message});
    }
});

// Not part of official API
// just a convenience, redirect /r/ requests to Vue #/r/ router path
app.get('/r/:org/:ds?', (req, res) => {
    if (req.params.ds){
        res.redirect(301, `/#/r/${req.params.org}/${req.params.ds}`);
    }else{
        res.redirect(301, `/#/r/${req.params.org}`);
    }
});

app.use((err, req, res, next) => {
    logger.error(err.stack);
    if (err.name === 'UnauthorizedError') {
      res.status(401).json({error: "Unauthorized"});
    }else{
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
        users.createDefaultUsers();
        server = app.listen(config.port, err => {
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
