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

// get requests to and from the user
RequestSchema.statics.getRequests = function(userId, callback) {
    Request.find({ from: userId }).populate('to', '_id name email preferences available group').exec(function(err, reqFrom) {
        if (err) return callback(err);
        Request.find({ to: userId }).populate('from', '_id name email preferences available group').exec(function(error, reqTo) {
            callback(err, { requestsFrom: reqFrom, requestsTo: reqTo });
        });
    });
};

var Request = mongoose.model('Request', RequestSchema);
module.exports = Request;