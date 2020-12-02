const db = require('./db');

module.exports = {
    get: function(key){
        return (db.fetchOne('SELECT value FROM config WHERE key = ?', key) || {}).value;
    },

    set: function(key, value){
    	db.prepare(`INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)`).run(key, value);
    },

    setIfNotExists(key, value){
    	if (this.get(key) === undefined){
    		this.set(key, value);
    	}
    }
}
