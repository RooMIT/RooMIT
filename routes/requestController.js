/**
 * Author: Rujia
 */

var Request = require('../models/request');
var User = require('../models/request');
var handleError = require('./utils').handleError;

var acceptRequest = function(creator_id, receiver_id, req, res) {
    User.getRoommates()
}

var rejectRequest = function(creator_id, receiver_id, req, res) {
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

var cancelRequest = function(creator_id, receiver_id, req, res) {
    //Model changes when cancelling a request from User A to User B 
    //  are identical to those when rejecting a request from User A to User B
    rejectRequest(creator_id, receiver_id, req, res);
}

var modifyRequest = function(req, res) {
    var creator_id = req.params.from_id;
    var receiver_id = req.params.to_id;

    var self_id = req.session.userId;
    if (!self_id) return handleError(res, 400, 'Please login first');
    if (receiver_id !== self_id) return handleError(res, 400, 'Not logged in as correct user');

    var accept = req.session.accept;
    var reject = req.session.reject;
    var cancel = req.session.cancel;

    if (accept) {
        acceptRequest(creator_id, receiver_id, req, res);
    }
    else if(reject) {
        rejectRequest(creator_id, receiver_id, req, res);
    }
    else if(cancel) {
        cancelRequest(creator_id, receiver_id, req, res);
    }
    else {
        res.json({success: true});
    }
}

module.exports = {

    // create requests
    create: function(req, res) {
        var userId = req.params.id;
        if (!req.session.userId) return handleError(res, 400, 'Please login first');
        if (!toIds.length && !fromIds.length) return handleError(res, 400, 'Users do not exist');

        var toIds = req.body.to;
        var requests = [];
        if (toIds.length) {
            toIds = toIds.split(',');
            requests = toIds.map(function(elem){
                return new Request({ from: userId, to: elem });
            });
        }

        var fromIds = req.body.from;
        var requests2 = [];
        if (fromIds.length) {
            fromIds = fromIds.split(',');
            var requests2 = fromIds.map(function(elem){
                return new Request({ from: elem, to: userId });
            });
        }        

        var allRequests = requests.concat(requests2);

        allRequests.forEach(function(request) {
            request.save(function (err, res) {
                if (err) return handleError(res, 500, err);
                res.json({ success:true });
            });
        });
    },


    // modify requests
    update: function(req, res) {

        
    },

    // get all requests to/from a user
    get: function(req, res) {
        var userId = req.params.id;

        if (!req.session.userId) return handleError(res, 400, 'Please login first');

        Request.getRequests(userId, function(err, result) {
            if (err) return handleError(res, 500, err);
            res.json({ requestsTo: result.requestsTo, requestsFrom: result.requestsFrom }); 
        });
    }

};
