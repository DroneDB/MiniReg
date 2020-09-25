"use strict";
let config = require('../config');
let path = require('path');

class Directories{
    static get data(){
        return !config.test ? "data" : path.join("tests", "data");
    }

    static get ddbData(){
        return path.join(this.data, "ddb");
    }
}

module.exports = Directories;