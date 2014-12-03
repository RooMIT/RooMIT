/**
 * Author: Rujia
 */

var Request = require('../models/request');
var User = require('../models/user');
var handleError = require('./utils').handleError;

var modifyRequest = function(req, res) {
    var creator_id = req.params.from_id;
    var receiver_id = req.params.to_id;

    var self_id = req.session.userId;
    if (!self_id) return handleError(res, 400, 'Please login first');

    var accept = req.body.accept;
    var deny = req.body.deny;
    var cancel = req.body.cancel;

    var response = function(err) {
        if (err) return handleError(res, 500, err);
        res.json({success: true});
    };
    
    if (accept) {
        Request.acceptRequest(creator_id, receiver_id, response);
    }
    else if(deny) {
        Request.denyRequest(creator_id, receiver_id, response);
    }
    else if(cancel) {
        Request.cancelRequest(creator_id, receiver_id, response);
    }
    else {
        res.json({success: true});
    }
}

module.exports = {

    // create requests
    create: function(req, res) {
        if (!req.session.userId) return handleError(res, 400, 'Please login first');
        var toId = req.params.to_id;
        var fromId = req.params.from_id;
        if (!toId || !fromId) return handleError(res, 400, 'Requested user does not exist');
        Request.createRequest(fromId, toId, true, function (err){
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
