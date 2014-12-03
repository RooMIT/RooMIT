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

RequestSchema.statics.createRequest = function (fromId, toId, callback){
    User.findOne({_id: toId}, function (err, toUser){
        if (err) return callback(err);
        User.findOne({_id: fromId}, function (err, fromUser){
            if (err) return callback(err);
            this.find({to: toId}, function (err, existingUsers){
                if (err) return callback(err);
                if (fromUser.group){
                    User.find({group: fromUser.group}, function (err, fromUsers){
                        if (err) return callback(err);
                        var insertUsers = fromUsers.filter(function (curr){
                            for (i in existingUsers){
                                if (existingUsers[i]._id === curr._id){
                                    return true;
                                }
                            }
                            return false;
                        });
                        var inserts = insertUsers.map(function (insertUser){
                            return {from: insertUser._id, to: toId};
                        });
                        this.collection.insert(inserts, function (err){
                            callback(err);
                        });
                    });
                } else {
                    this.update({from: fromId, to: toId}, 
                        {$setOnInsert: {from: fromId, to: toId}},
                        {upsert: true}
                    }).exec(function (err){
                        callback(err);
                    });
                }
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

RequestSchme.statics.rejectRequest = function(creator_id, receiver_id, req, res) {
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