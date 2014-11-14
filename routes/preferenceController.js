var Preference = require('../models/preference');
var User = require('../models/user');
var getPrefs = require('./utils').getPrefs;
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

    // initialize preferences for the user
    initiliaze: function(userId){
        var prefs = [];
        getPrefs().forEach(function (desc) {
            var pref = new Preference({description: desc, response: 'Don\'t Care'});
            prefs.push(pref._id);
            pref.save(function (err){
                if (err) return handleError(res, 500, err);
            });
        });
        User.update({ _id: userId }, {preferences: prefs}, function (err){
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    }
}
