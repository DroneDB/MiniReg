const db = require('./db');
const logger = require('./logger');
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const jwt = require('./jwt');
const authProviders = require('./authProviders');


function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

module.exports = {
    // api: router,

    createDefaultUsers: function(){
        const r = db.prepare("SELECT * FROM users WHERE username = ?").get('admin');
        if (!r){
            logger.info("Adding default admin user");
            this.addUser('admin', 'password', ['admin', 'standard']);
        }
    },

    addUser: function(username, password, roles){
        const salt = generateSalt();
        const pwd = crypto.createHmac('sha512', salt).update(password).digest("base64");
        db.prepare(`INSERT INTO users (username, salt, password, roles) VALUES (?, ?, ?, ?)`).run(username, salt, pwd, "|" + roles.join("|") + "|");
    },

    login: async function(username, password, impersonate){
        const metadata = await authProviders.get().authenticate(username, password, impersonate);
        const signObj = {
            username, metadata
        };

        return jwt.sign(signObj);
    },

    refreshToken: function(signObj){
        const newObj = Object.assign({}, signObj);
        delete newObj.iat;
        delete newObj.exp;

        return jwt.sign(newObj);
    }
}
