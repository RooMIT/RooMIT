/**
 * Author: Rujia
 */

var Request = require('../models/request');
var User = require('../models/user');
var handleError = require('./utils').handleError;

var deleteRequest = function(from, to, callback) {
    Request.getRequestFromTo(from, to, function(err, request) {
        if (err) return callback(err);
        Request.findByIdAndRemove(request._id, callback);
    });

}
module.exports = {

    // create requests
    create: function(req, res) {
        if (!req.session.userId) return handleError(res, 400, 'Please login first');
        var toId = req.body.to_id;
        var fromId = req.body.from_id;
        if (!toId || !fromId) return handleError(res, 400, 'Requested user does not exist');
        Request.createRequests(fromId, toId, function (err){
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    },


    // delete requests
    delete: function(req, res) {

        var creator_id = req.params.from_id;
        var receiver_id = req.params.to_id;

        var deleteRoommates = req.body.deleteRoommateRequests;

        var self_id = req.session.userId;
        if (!self_id) return handleError(res, 400, 'Please login first');

        if (!deleteRoommates) {
            if (receiver_id !== self_id) return handleError(res, 400, 'Not logged in as correct user');
            //user is the recipient, no need to auth
            Request.remove({from: creator_id, to: receiver_id}, function(err) {
                if (err) return handleError(res, 500, err);
                res.json({success: true});
            })
        }
        User.getRoommates(receiver_id, function(err, roommates) {
            //allow iff user is roommate of recipient
            var recipients = roommates.map(function(roommate) {
                return roommate._id.toString();
            });
            if (recipients.indexOf(self_id) === -1 && self_id !== receiver_id) {
                //logged in user is not a roommate of the receiver or the receiver himself, disallow this operation
                return handleError(res, 400, 'Logged in user not a roommate of recipient');
            }
            recipients.push(receiver_id);
            Request.remove({from: creator_id, to: {$in: recipients}}, function(err) {
                if (err) return handleError(res, 500, err);
                res.json({success: true});
            });
        });
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
