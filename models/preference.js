/** 
 * Author: Olga
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PreferenceSchema = new Schema({
    description: { type: String, required: true },
    response: { type: String, enum: ['Yes', 'No', 'Don\'t Care'], required: true }
});

var Preference = mongoose.model('Preference', PreferenceSchema);
module.exports = Preference;