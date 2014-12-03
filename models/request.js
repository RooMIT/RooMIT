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

// find all requests to userId
RequestSchema.statics.findTo = function(userId, callback) {
    this.find({}).populate('from', '_id name').exec(function(err, result) {
        result = result.filter(function(request) {
            return request.to.equals(userId);
        });
        callback(err, result)
    });
}

//Remove all requests from creator_id to any of the ids in receiver_ids
RequestSchema.statics.removeFromTos = function(creator_id, receiver_ids, callback) {
    var Request = this;
    Request.findFrom(creator_id, function(err, requests) {
        if (err) return callback(err);
        var result = requests.filter(function(request) {
            return receiver_ids.filter(function(id) {
                return request.to._id.equals(id);
            }).length > 0;
        });
        result.forEach(function(request) {
            request.remove();
        })
        callback();
    });
}

// find all requests from userId 
RequestSchema.statics.findFrom = function(userId, callback) {
    this.find({}).populate('to', '_id name').exec(function(err, result) {
        result = result.filter(function(request) {
            return request.from.equals(userId);
        });
        callback(err, result)
    });
}

//Create a request from creator_id to receiver_id
//If receiver is part of a group, send requests to all group members
//If both users are part of a group, don't allow the request
RequestSchema.statics.createRequest = function (creator_id, receiver_id, include_receiver, callback){
    var Request = this;
    User.getUser(creator_id, function(err, creator) {
        //Check if other user has roommates
        if (err) return callback(err);
        if (!creator) return callback('Creator does not exist');
        User.getRoommates(receiver_id, function(err, other_roommates) {
            if (err) return callback(err);
            //If both users have roommates, disallow request
            if (other_roommates.length && creator.group) {
                return callback('Cannot create request between two users with groups');
            }
            var recipients= other_roommates.map(function(roommate) {
                return roommate._id;
            });
            include_receiver && recipients.push(receiver_id);
            Request.getRequestsFromOneToMany(creator_id, recipients, function(err, requests) {
                //If creator has any outstanding requests to roommates of receiver, disallow request
                if (requests.length) {
                    return callback('User has already requested to join a member of this group');
                }
                var new_requests = recipients.map(function(user_id) {
                    return {from: creator_id, to: user_id};
                });
                new_requests.forEach(function(new_request) {
                    var request = new Request(new_request);
                    request.save();
                });
                callback();
            });
        });
    });
}

//Make user_id and other_id roommates
var addRoommate = function(user_id, other_id, roommate_ids, Request, callback) {
    roommate_ids.push(user_id);
    User.addRoommate(user_id, other_id, function(err) {
        if (err) return callback(err);
        roommate_ids.push(other_id);
        roommate_ids.forEach(function(creator_id) {
            Request.getRequests(creator_id, function(err, requests) {
                console.log(requests);
                requests.requestsFrom.forEach(function(request) {
                    request.remove();
                });
                requests.requestsTo.forEach(function(request) {
                    request.remove();
                })
            })
        });
        callback();
    })
};

//Confirm the request from creator_id to receiver_id
//If creator_id is in a group, send requests to all of creator's group members
//If receiver_id is in a group, then only add the creator as a roommate if all other roommates have already accepted
//If both are in a group, something went wrong - cancel the request
RequestSchema.statics.acceptRequest = function(creator_id, receiver_id, callback) {
    var Request = this;
    User.getUser(creator_id, function(err, creator) {
        if (err) return callback(err);
        if (!creator) return callback('User ' + creator_id + 'does not exist');
        User.getRoommates(receiver_id, function(err, roommates) {
            if (creator.group && roommates.length > 0) {
                //somehow both users have groups already...disregard the request entirely
                Request.cancelRequest(creator_id, receiver_id, callback);
            }
            else if (creator.group) {
                //Receiver is an individual accepting a request from a person in a group. 
                //That means he must now send requests out to all other group members.
                Request.removeFromTos(creator_id, [receiver_id], function(err) { 
                    if (err) return callback(err);
                    Request.createRequest(receiver_id, creator_id, false, callback);
                });
            }
            else if (roommates.length > 0) {
                //Receiver is a person in a group accepting a request from an individual.
                //That means he must now see if all other group members have also accepted their requests
                var recipients = roommates.map(function(roommate) {
                    return roommate._id;
                });
                Request.getRequestsFromOneToMany(creator_id, recipients, function(err, requests) {
                    if (err) return callback(err);
                    if (requests.length) {
                        //Not all of receiver's roommates have accepted their requests, so just delete ours and move on.
                        Request.removeFromTos(creator_id, [receiver_id], callback);
                    }
                    else {
                        //Receiver is the last roommate to accept a request, so add creator to his group
                        Request.removeFromTos(creator_id, [receiver_id], function(err) { 
                            if (err) return callback(err);
                            addRoommate(creator_id, receiver_id, recipients, Request, callback);
                        });
                    }
                });
            }
            else {
                //Receiver and creator are both individuals
                //That means we have to make them roommates and cancel all their existing requests
                Request.removeFromTos(creator_id, [receiver_id], function(err) { 
                    if (err) return callback(err);
                    addRoommate(creator_id, receiver_id, [], Request, callback);
                });
            }
        });
    });
}

//Cancel the request from creator to receiver
RequestSchema.statics.cancelRequest = function(creator_id, receiver_id, callback) {
    //Model changes when cancelling a request from User A to User B 
    //are identical to those when rejecting a request from User A to User B
    this.denyRequest(creator_id, receiver_id, callback);
}

//Get all requests from from_id that are to any of the users in to_ids
RequestSchema.statics.getRequestsFromOneToMany = function(from_id, to_ids, callback) {
    var Request = this;
    Request.findFrom(from_id, function(err, requests) {
        if (err) return callback(err);
        var result = requests.filter(function(request) {
            return to_ids.filter(function(id) {
                return request.to._id.equals(id);
            }).length > 0;
        });
        callback(undefined, result);
    });
}

//Get a request from from_id to to_id
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
        });
    });
}

//Deny a request from creator_id to receiver_id
RequestSchema.statics.denyRequest = function(creator_id, receiver_id, callback) {
    //delete all requests from creator to receiver as well as to roommates of receiver
    User.getRoommates(receiver_id, function(err, roommates) {
        var recipients = roommates.map(function(roommate) {
            return roommate._id;
        });
        recipients.push(receiver_id);
        Request.removeFromTos(creator_id, recipients, callback);
    });
}

var Request = mongoose.model('Request', RequestSchema);
module.exports = Request;