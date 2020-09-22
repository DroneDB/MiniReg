"use strict";
let config = require('../config');
let path = require('path');

class Directories{
    static get data(){
        return !config.test ? "data" : path.join("tests", "data");
    }
}

module.exports = Directories;