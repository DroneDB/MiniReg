'use strict';
let Handlebars = require('handlebars');

exports.setParams = function (params) {
    if (!params) return;
    
    return new Handlebars.SafeString(`<script>
    window._params = ${JSON.stringify(params)};
    </script>`);
};