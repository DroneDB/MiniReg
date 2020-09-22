"use strict";

let config = require('../config');
let winston = require('winston');
let fs = require('fs');
let path = require('path');

// Set up logging
// Configure custom File transport to write plain text messages
let logPath = ( config.logger.logDirectory ? 
                config.logger.logDirectory : 
                path.join(__dirname, "..") );

// Check that log file directory can be written to
try {
    fs.accessSync(logPath, fs.W_OK);
} catch (e) {
    console.log( "Log directory '" + logPath + "' cannot be written to"  );
    throw e;
}
logPath += path.sep;
logPath += "minireg.log";

let transports = [];
if (!config.deamon){
    transports.push(new winston.transports.Console({ level: config.logger.level, format: winston.format.simple() }));
}

let logger = winston.createLogger({ transports });
logger.add(new winston.transports.File({
        format: winston.format.simple(), 
        filename: logPath, // Write to projectname.log
        json: false, // Write in plain text, not JSON
        maxsize: config.logger.maxFileSize, // Max size of each file
        maxFiles: config.logger.maxFiles, // Max number of files
        level: config.logger.level // Level of log messages
    }));

module.exports = logger;