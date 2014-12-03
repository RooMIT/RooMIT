/**
 * Author: Rujia
 */

var Request = require('../models/request');
var User = require('../models/user');
var handleError = require('./utils').handleError;


var acceptRequest = function(creator_id, receiver_id, req, res) {
    Request.acceptRequest(creator_id, receiver_id, function(err, result) {

    });
}

var cancelRequest = function(creator_id, receiver_id, req, res) {
    //Model changes when cancelling a request from User A to User B 
    //are identical to those when rejecting a request from User A to User B
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
        Request.acceptRequest(creator_id, receiver_id, req, res);
    }
    else if(reject) {
        Request.rejectRequest(creator_id, receiver_id, req, res);
    }
    else if(cancel) {
        Request.cancelRequest(creator_id, receiver_id, req, res);
    }
    else {
        res.json({success: true});
    }
}

module.exports = {

    // create requests
    create: function(req, res) {
        if (!req.session.userId) return handleError(res, 400, 'Please login first');
        var toId = req.body.to_id;
        var fromId = req.body.from_id;
        if (!toId || !fromId) return handleError(res, 400, 'Requested user does not exist');
        Request.createRequest(fromId, toId, function (err){
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    },


    // modify requests
    modify: modifyRequest,

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
