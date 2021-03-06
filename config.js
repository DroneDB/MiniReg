'use strict';

let fs = require('fs');
let argv = require('minimist')(process.argv.slice(2));
let utils = require('./libs/utils');

if (argv.help){
	console.log(`
Usage: node index.js [options]

Options:
	--config <path>	Path to the configuration file (default: config-default.json)	
	-p, --port <number> 	Port to bind the server to (default: 3000)
	--log-level <logLevel>	Set log level verbosity (default: info)
	-a, --auth <provider>	Authentication provider to use. [local|remote] (default: local)
	--remote-auth <url>	Remote authentication URL. (default: https://dronedb.app)
	--ssl-cert	Path to cert for SSL. (default: none)
	--ssl-key	Path to key for SSL. (default: none)
	--cleanup-uploads-after <number> Number of minutes that elapse before deleting unfinished uploads. Set this value to the maximum time you expect a dataset to be uploaded. (default: 2880) 
	--test Enable test mode. This can be useful during development or testing (default: false)
	--test-drop-uploads	If test mode is enabled, drop /task/new/upload requests with 50% probability. (default: false)
	--powercycle	When set, the application exits immediately after powering up. Useful for testing launch and compilation issues.
Log Levels: 
error | debug | info | verbose | debug | silly 
`);
	process.exit(0);
}

let config = {};

// Read configuration from file
let configFilePath = argv.config || "config-default.json";
let configFile = {};

if (/\.json$/i.test(configFilePath)){
	try{
		let data = fs.readFileSync(configFilePath);
		configFile = JSON.parse(data.toString());
	}catch(e){
		console.log(`Invalid configuration file ${configFilePath}`);
		process.exit(1);
	}
}

// Gets a property that might not exist from configuration file
// example: fromConfigFile("logger.maxFileSize", 1000);
function fromConfigFile(prop, defaultValue){
	return utils.get(configFile, prop, defaultValue);
}

// Logging configuration
config.logger = {};
config.logger.level = argv.log_level || fromConfigFile("logger.level", 'info'); // What level to log at; info, verbose or debug are most useful. Levels are (npm defaults): silly, debug, verbose, info, warn, error.
config.logger.maxFileSize = fromConfigFile("logger.maxFileSize", 1024 * 1024 * 100); // Max file size in bytes of each log file; default 100MB
config.logger.maxFiles = fromConfigFile("logger.maxFiles", 10); // Max number of log files kept
config.logger.logDirectory = fromConfigFile("logger.logDirectory", ''); // Set this to a full path to a directory - if not set logs will be written to the application directory.

config.port = parseInt(argv.port || argv.p || fromConfigFile("port", process.env.PORT || 5000));
config.cleanupUploadsAfter = parseInt(argv['cleanup-uploads-after'] || fromConfigFile("cleanupUploadsAfter", 2880));
config.test = argv.test || fromConfigFile("test", false);
config.auth = argv.auth || argv.a || fromConfigFile("auth", "local");
config.remoteAuth = argv['remote-auth'] || fromConfigFile("remote-auth", "https://dronedb.app");
config.sslCert = argv['ssl-cert'] || fromConfigFile("ssl-cert", "");
config.sslKey = argv['ssl-key'] || fromConfigFile("ssl-key", "");
config.ssl = config.sslCert && config.sslKey;
config.testDropUploads = argv['test-drop-uploads'] || fromConfigFile("testDropUploads", false);
config.powercycle = argv.powercycle || fromConfigFile("powercycle", false);

module.exports = config;
