const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const Directories = require('./Directories');
// const express = require('express');
// const router = express.Router();

module.exports = {
    // api: router,
    initialize: function(){
        // init
        this.db = require('better-sqlite3')(path.join(Directories.data, 'sqlite3.db'), {});
        
        const migFile = path.join(Directories.data, "migrated.txt");
        if (!fs.existsSync(migFile)){
            fs.writeFileSync(migFile, JSON.stringify({currentMigration: -1}), 'utf8');
        }
        let { currentMigration } = JSON.parse(fs.readFileSync(migFile, 'utf8'));

        const migrations = fs.readdirSync("migrations").sort();
        migrations.forEach(m => {
            const n = parseInt(m.substr(0, 4));
            if (currentMigration < n){
                logger.info(`Executing ${m}...`);
                this.db.exec(fs.readFileSync(path.join("migrations", m), 'utf8'));
                currentMigration = n;
                fs.writeFileSync(migFile, JSON.stringify({currentMigration}), 'utf8');
            }
        });
    },
    fetchOne: function(query, ...params){
        return this.db.prepare(query).get(...params);
    },
    prepare: function(...params){
        return this.db.prepare(...params);
    }
}
