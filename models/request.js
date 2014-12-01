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

// get requests to and from the user
RequestSchema.statics.getRequests = function(userId, callback) {
    var Request = this;
    Request.findFrom(userId, function(err, from) {
        if (err) return callback(err);
        Request.findTo(userId, function(err, to) {
            callback(err, {requestsFrom: from, requestsTo: to});
        });;
    })
};

var Request = mongoose.model('Request', RequestSchema);
module.exports = Request;