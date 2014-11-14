var Preference = require('../models/preference');
var handleError = require('./utils').handleError;

module.exports = {

    // modify a preference
    update: function(req, res) {
        var preferenceId = req.params.id;
        var response = req.body.response;

        // sanitize inputs
        if (!(/^Yes|No|Don\'t Care$/).test(response)) {
            return handleError(res, 400, 'Please enter a valid response');
        }
        
        Preference.update({ _id: preferenceId }, { response: response }, function (err) {
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    }
}
