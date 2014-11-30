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
        var responses = ['Yes', 'No', 'Don\'t Care'];
        getPrefs().forEach(function (desc) {
            var isDorm = (desc.indexOf('would like to live in') != -1);
            var isRoommate = (desc.indexOf('would like to live with') != -1);
            response.forEach(function (response){
                // setOnInsert and upsert makes it so that it only inserts
                // if the preference doesn't exist yet
                Preference.update({description: desc, response: response},
                    {$setOnInsert: {description: desc, 
                        response: response, 
                        isDormPreference: isDorm, 
                        isRoommateNumberPreference: isRoommate}},
                    {upsert: true},
                    function (err) {
                        if (err) return handleError(res, 500, err);
                });
            });
        });
    },

    // modify a preference. requires several more inputs now
    update: function(req, res) {
        var oldPrefId = req.params.id;
        var description = req.body.description;
        var response = req.body.response;
        var userID = req.session.userId;
        
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
        var prefs = getPrefs().map(function (desc) {
            return { description: desc };
        });

        Preference.find(response: 'Don\'t Care', function (err, docs)){
            if (err) return callback(err);
            var prefIDs = docs.map(function (pref) {
                return pref._id;
            });

            user.setPreferences(prefIDs, callback);
        });
    }
};
