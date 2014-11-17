var Preference = require('../models/preference');
var User = require('../models/user');
var getPrefs = require('./utils').getPrefs;
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
    },

    // initialize preferences for the user
    initialize: function(user, callback){
        var prefs = getPrefs().map(function (desc) {
            return {description: desc, response: 'Don\'t Care'};
        });
        Preference.collection.insert(prefs, function (err, docs){
            if (err){
                callback(err);
            } else {
                var prefIDs = docs.map(function (pref){
                    return pref._id;
                });
                user.setPreferences(prefIDs, callback);
            }
        });
        user.setPreferences(prefs, callback);
    }
};
