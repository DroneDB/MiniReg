const { v4: uuidv4 } = require('uuid');

const PUBLIC_ORG_NAME = "public";

module.exports = {
    parseOrCreateTag: function(tag){
        if (!tag){
            return {
                organization: PUBLIC_ORG_NAME,
                dataset: uuidv4().replace(/-/g, '')
            };
        }else{
            const parts = tag.split('/');
            // TODO: check for invalid characters?
            if (parts.length === 1){
                return {
                    organization: PUBLIC_ORG_NAME,
                    dataset: parts[0]
                };
            }else{
                return {
                    organization: parts[parts.length - 2],
                    dataset: parts[parts.length - 1]
                };
            }
        }
    }
};