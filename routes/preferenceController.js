var Preference = require('../models/preference');
var handleError = require('./utils').handleError;

module.exports = {

    // modify a preference
    modify: function(req, res) {
        var preferenceId = req.params.id;
        var response = req.body.response;

        // sanitize inputs
        if (typeof response === 'object') {
            response = JSON.stringify(response);
        }
        
        Preference.update({ _id: preferenceId }, { response: response }, function (err) {
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    }
}
