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
    this.find({}).populate('to', '_id name').exec(function(err, result) {
        result = result.filter(function(request) {
            return request.to._id.equals(userId);
        });
        callback(err, result)
    });
}

RequestSchema.statics.removeFromTos = function(creator_id, receiver_ids, callback) {
    this.find({}).exec(function(err, result) {
        result = result.filter(function(request) {
            return request.from.equals(creator_id);
        });
        console.log(result);
        result = result.filter(function(request) {
            return receiver_ids.indexOf(request.from.toString()) !== -1;
        });
        result.forEach(function(request) {
            request.remove();
        });
        callback();
    })
}

// find all requests from userId 
RequestSchema.statics.findFrom = function(userId, callback) {
    this.find({}).populate('from', '_id name').exec(function(err, result) {
        result = result.filter(function(request) {
            return request.from._id.equals(userId);
        });
        callback(err, result)
    });
}

RequestSchema.statics.createRequest = function (creator_id, receiver_id, include_receiver, callback){
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
            include_receiver && recipients.push(receiver_id);
            Request.getRequestsFromOneToMany(creator_id, recipients, function(err, requests) {
                //If creator has any outstanding requests to roommates of receiver, disallow request
                if (requests.length) {
                    return callback('User has already requested to join a member of this group');
                }
                var new_requests = recipients.map(function(user_id) {
                    return {from: creator_id, to: user_id};
                });
                Request.collection.insert(new_requests, callback);
            });
        });
    });
}



var addRoommate = function(user_id, other_id, roommate_ids, Request, callback) {
    roommate_ids.push(user_id);
    User.addRoommate(user_id, other_id, function(err) {
        if (err) return callback(err);
        roommate_ids.push(other_id);
        roommate_ids.forEach(function(creator_id) {
            Request.removeFromTos(creator_id, roommate_ids, function(err, result) {
                //do nothing
            });
        });
        callback();
    })
};

RequestSchema.acceptRequest = function(creator_id, receiver_id, callback) {
    User.getUser(creator_id, function(err, creator) {
        User.getRoommates(receiver_id, function(err, roommates) {
            if (creator.group && roommates.length > 0) {
                //somehow both users have groups already...disregard the request entirely
                this.cancelRequest(creator_id, receiver_id, callback);
            }
            else if (creator.group) {
                //Receiver is an individual accepting a request from a person in a group. 
                //That means he must now send requests out to all other group members.
                Request.removeFromTos(creator_id, [receiver_id], function(err) { 
                    if (err) return callback(err);
                    this.createRequest(receiver_id, creator_id, false, callback);
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
                            addRoommate(user, creator_id, recipients, Request, callback);
                        });
                    }
                });
            }
            else {
                //Receiver and creator are both individuals
                //That means we have to make them roommates and cancel all their existing requests
                Request.removeFromTos(creator_id, [receiver_id], function(err) { 
                    if (err) return callback(err);
                    addRoommate(user, creator_id, [], Request, callback);
                });
            }
        });
    });
}

RequestSchema.statics.rejectRequest = function(creator_id, receiver_id, callback) {
    var Request = this;
    //delete all requests from creator to receiver as well as to roommates of receiver
    User.getRoommates(receiver_id, function(err, roommates) {
        var recipients = roommates.map(function(roommate) {
            return roommate._id.toString();
        });
        recipients.push(receiver_id);
        Request.removeFromTos(creator_id, recipients, callback);
    });
}

RequestSchema.statics.cancelRequest = function(creator_id, receiver_id, callback) {
    //Model changes when cancelling a request from User A to User B 
    //are identical to those when rejecting a request from User A to User B
    this.rejectRequest(creator_id, receiver_id, callback);
}

RequestSchema.statics.getRequestsFromOneToMany = function(from_id, to_ids, callback) {
    var Request = this;
    Request.findFrom(from_id, function(err, requests) {
        console.log('Requests', requests);
        if (err) return callback(err);
        var result = requests.filter(function(request) {
            return to_ids.indexOf(request.to.toString()) !== -1;
        });
        console.log('Result', result);
        callback(undefined, result);
    });
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
        });
    });
}

RequestSchema.statics.denyRequest = function(creator_id, receiver_id, req, res) {
    //delete all requests from creator to receiver as well as to roommates of receiver
    User.getRoommates(receiver_id, function(err, roommates) {
        var recipients = roommates.map(function(roommate) {
            return roommate._id.toString();
        });
        recipients.push(receiver_id);
        Request.removeFromTos(creator_id, recipients, callback);
    });
}

var Request = mongoose.model('Request', RequestSchema);
module.exports = Request;