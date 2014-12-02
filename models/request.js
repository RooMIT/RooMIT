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
    this.find({ from: userId }).exec(callback);
}

RequestSchema.statics.findTo = function(userId, callback) {
    this.find({ to: userId }).exec(callback);
}

RequestSchema.getRequestFromTo = function(from_id, to_id, callback) {
    var Request = this;
    Request.findFrom(from_id, function(err, requests) {
        if (err) return callback(err);
        var result = requests.filter(function(request) {
            return request.to.equals(to_id);
        });
        if (!result.length) return callback('Request does not exist');
        return result[0];
    })
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