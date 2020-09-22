const db = require('better-sqlite3')('data/sqlite3.db', {});
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
// const express = require('express');
// const router = express.Router();

const migFile = path.join("data", "migrated.txt");
if (!fs.existsSync(migFile)){
    fs.writeFileSync(migFile, JSON.stringify({currentMigration: -1}), 'utf8');
}
let { currentMigration } = JSON.parse(fs.readFileSync(migFile, 'utf8'));

const migrations = fs.readdirSync("migrations").sort();
migrations.forEach(m => {
    const n = parseInt(m.substr(0, 4));
    if (currentMigration < n){
        logger.info(`Executing ${m}...`);
        db.exec(fs.readFileSync(path.join("migrations", m), 'utf8'));
        currentMigration = n;
        fs.writeFileSync(migFile, JSON.stringify({currentMigration}), 'utf8');
    }
});

module.exports = {
    // api: router,
    db,
    fetchOne: function(query, ...params){
        return db.prepare(query).get(...params);
    }
}
