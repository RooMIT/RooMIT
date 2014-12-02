/**
 * Author: Peinan
 */

var Preference = require('../models/preference');
var User = require('../models/user');
var getPrefs = require('./utils').getPrefs;
var handleError = require('./utils').handleError;

module.exports = {

    // create all preferences. should only be called once.
    create: function(req, res) {
        Preference.createPreferences(function(err) {
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    },

    // modify a preference
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

        Preference.findOne({response: response, description: description}, function (err, pref){
            User.update({_id: userID}, 
                {$pull: {"preferences" : oldPrefId}, 
                $push: {"preferences" : pref._id}}, 
                function (err){
                    if (err) return handleError(res, 500, err);
                    res.json({ success:true });
                }
            );
        });
    },

    // initialize preferences for the user
    initialize: function(user, callback){
        // initially user only has don't cares
        Preference.find({response: 'Don\'t Care'}, function (err, docs){
            if (err) return callback(err);
            var prefIDs = docs.map(function (pref) {
                return pref._id;
            });

            user.setPreferences(prefIDs, callback);
        });
    }
};
