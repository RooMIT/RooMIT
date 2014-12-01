/** 
 * Author: Rujia
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var RequestSchema = new Schema({
    from: { type: ObjectId, ref: 'User', required: true },
    to: { type: ObjectId, ref: 'User', required: true }
});

RequestSchema.statics.findFrom = function(userId, callback) {
    this.find({ from: userId }).populate('to', '_id name email preferences available group').exec(callback);
}

RequestSchema.statics.findTo = function(userId, callback) {
    this.find({ to: userId }).populate('from', '_id name email preferences available group').exec(callback);
}

var Request = mongoose.model('Preference', RequestSchema);
module.exports = Request;