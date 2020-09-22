const { db } = require('./db');
const logger = require('./logger');
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const jwt = require('./jwt');


function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

module.exports = {
    // api: router,

    createDefaultUsers: function(){
        const r = db.prepare("SELECT * FROM users WHERE username = ?").get('admin');
        if (!r){
            logger.info("Adding default admin user");
            this.addUser('admin', 'password');
        }
    },

    addUser: function(username, password){
        const salt = generateSalt();
        const pwd = crypto.createHmac('sha512', salt).update(password).digest("base64");
        db.prepare(`INSERT INTO users (username, salt, password) VALUES (?, ?, ?)`).run(username, salt, pwd);
    },

    login: function(username, password){
        let r = db.prepare("SELECT salt FROM users WHERE username = ?").get(username);
        if (!r) throw new Error("Unauthorized");

        r = db.prepare("SELECT username FROM users WHERE username = ? AND password = ?").get(username, crypto.createHmac('sha512', r.salt).update(password).digest("base64"));
        if (!r) throw new Error("Unauthorized");

        return jwt.sign(r);
    }
}
