/** 
 * Author: Rujia
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var User = require('../models/user');

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

RequestSchema.statics.createRequest = function (creator_id, receiver_id, callback){
    var Request = this;
    User.getUser(creator_id, function(err, creator) {
        //Check if other user has roommates
        User.getRoommates(receiver_id, function(err, other_roommates) {
            //If both users have roommates, disallow request
            if (other_roommates.length && creator.group) {
                return callback('Cannot create request between two users with groups');
            }
            var recipients= other_roommates.map(function(roommate) {
                return roommate._id;
            });
            recipients.push(receiver_id);
            Request.getRequestsFromOneToMany(creator_id, recipients, function(err, requests) {
                //If creator has any outstanding requests to roommates of receiver, disallow request
                if (requests.length) {
                    return callback('User has already requested to join a member of this group');
                }
                var new_requests = recipients.map(function(user_id) {
                    return {from: creator_id, to: user_id};
                });
                this.collection.insert(new_requests, callback);
            });
        });
    });
}

RequestSchema.statics.getRequestsFromOneToMany = function(from_id, to_ids, callback) {
    var Request = this;
    Request.findFrom(from_id, function(err, requests) {
        if (err) return callback(err);
        var result = requests.filter(function(request) {
            return to_ids.indexOf(request.to.toString()) !== -1;
        });
        callback(undefined, result);
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

RequestSchema.statics.rejectRequest = function(creator_id, receiver_id, req, res) {
    //delete all requests from creator to receiver as well as to roommates of receiver
    User.getRoommates(receiver_id, function(err, roommates) {
        var recipients = roommates.map(function(roommate) {
            return roommate._id.toString();
        });
        recipients.push(receiver_id);
        Request.remove({from: creator_id, to: {$in: recipients}}, function(err) {
            if (err) return handleError(res, 500, err);
            res.json({success: true});
        });
    });
}

var Request = mongoose.model('Request', RequestSchema);
module.exports = Request;