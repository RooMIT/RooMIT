/** 
 * Author: Olga
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PreferenceSchema = new Schema({
    description: { type: String, required: true },
    response: { type: String, enum: ['Yes', 'No', 'Don\'t Care'], required: true, default: 'Don\'t Care' },
    isDormPreference: { type: Boolean, required: true, default: false },
    isRoommateNumberPreference: { type: Boolean, required: true, default: false }
});

PreferenceSchema.statics.findPreference = function(description, response, callback) {
    Preference.findOne({ description: description, response: response }, callback);
}

// create all the preference in the database. should only be called once
PreferenceSchema.statics.createPreferences = function(callback) {
    var responses = ['Yes', 'No', 'Don\'t Care'];
    getPrefs().forEach(function (desc) {
        var isDorm = (desc.indexOf('would like to live in') != -1);
        var isRoommate = (desc.indexOf('would like to live with') != -1);
        
        response.forEach(function (response) {
            // setOnInsert and upsert makes it so that it only inserts
            // if the preference doesn't exist yet
            Preference.update({description: desc, response: response},
                {$setOnInsert: {description: desc, 
                    response: response, 
                    isDormPreference: isDorm, 
                    isRoommateNumberPreference: isRoommate}},
                {upsert: true}).exec(callback);
        });
    });
}

// hardcoded statements for preferences
var getPrefs = function() {
    return [
        'I am male and would like to have a male roommate.',
        'I am female and would like to have a male roommate.',
        'I am male and would like to have a female roommate.',
        'I am female and would like to have a female roommate.',
        'I would like to live in Maseeh.',
        'I would like to live in Simmons.',
        'I would like to live in East Campus.',
        'I would like to live in Senior House.',
        'I would like to live in MacGregor.',
        'I would like to live in McCormick.',
        'I would like to live in Baker.',
        'I would like to live in Burton Connor.',
        'I would like to live in New House.',
        'I would like to live in Next House.',
        'I would like to live in Random House.',
        'I am good with noise during the night.',
        'I am a morning person.',
        'I like inviting my friends over.',
        'I sleep before midnight.',
        'I like to keep my room organized.',
        'I care a lot about my personal hygiene.'
    ];
}

//PreferenceSchema.createPreference = function()
var Preference = mongoose.model('Preference', PreferenceSchema);
module.exports = Preference;