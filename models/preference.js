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
    var Preference = this;
    Preference.findOne({description: description, response: response}, callback);
}

PreferenceSchema.createPreference = function()
var Preference = mongoose.model('Preference', PreferenceSchema);
module.exports = Preference;