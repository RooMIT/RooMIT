/**
 * Author: Peinan
 */

var Preference = require('../models/preference');
var User = require('../models/user');
var getPrefs = require('./utils').getPrefs;
var handleError = require('./utils').handleError;

module.exports = {

    // modify a preference of the logged in user
    update: function(req, res) {
        var oldPrefId = req.params.id;
        var description = req.body.description;
        var response = req.body.response;
        var userID = req.session.userId;

        if (!userID) return handleError(res, 400, 'Please login first');
        
        // sanitize inputs
        if (!(/^Yes|No|Don\'t Care$/).test(response)) {
            return handleError(res, 400, 'Please enter a valid response');
        }

        Preference.findOne({response: response, description: description}, function (err, pref) {
            if (err) return handleError(res, 500, err);

            // take out the old pref
            User.findOneAndUpdate({_id: userID},{$pull: {"preferences" : oldPrefId}}, function (error) {
                if (error) return handleError(res, 500, error);

                // add in the new pref
                User.findOneAndUpdate({_id: userID}, {$addToSet: {"preferences" : pref._id}}, function (error2) {
                    if (error2) return handleError(res, 500, error2);
                    res.json({ success:true });
                });

            });

        });
    },

    // initialize preferences for the user
    initialize: function(user, callback){
        // Creates preferences if they don't exist
        Preference.createPreferences(function (err) {
            if (err) return handleError(res, 500, err);

            // initially user only has don't cares
            Preference.find({response: 'Don\'t Care'}, function (error, docs){
                if (error) return callback(error);
                var prefIDs = docs.map(function (pref) {
                    return pref._id;
                });

                user.setPreferences(prefIDs, callback);
            });
        });
    }
};
