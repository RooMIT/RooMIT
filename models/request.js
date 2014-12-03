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
    this.find({ from: userId }).populate('to', '_id name').exec(callback);
}

RequestSchema.statics.findTo = function(userId, callback) {
    this.find({ to: userId }).populate('from', '_id name').exec(callback);
}

RequestSchema.statics.getRequestsFromOneToMany = function(from_id, to_ids, callback) {
    var Request = this;
    Request.findFrom(from_id, function(err, requests) {
        if (err) return callback(err);
        var result = requests.filter(function(request) {
            return to_ids.indexOf(request.to.toString()) !== -1;
        });
        if (result.length !== to_ids.length) return callback('Not all requets exist');
        return result;
    })
}

RequestSchema.statics.getRequestFromTo = function(from_id, to_id, callback) {
    return this.getRequestsFromOneToMany(from_id, [to_id], callback);
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