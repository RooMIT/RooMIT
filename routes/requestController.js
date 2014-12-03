/**
 * Author: Rujia
 */

var Request = require('../models/request');
var User = require('../models/request');
var handleError = require('./utils').handleError;

var deleteRequest = function(to, from, callback) {
    Request.getRequestFromTo(from, to, function(err, request) {
        if (err) return callback(err);
        Request.findByIdAndRemove(request._id, callback);
    });

}
module.exports = {

    // create requests
    create: function(req, res) {
        var userId = req.params.id;
        if (!req.session.userId) return handleError(res, 400, 'Please login first');
        var toIds = req.body.to;
        var fromIds = req.body.from;
        if (!toIds.length && !fromIds.length) return handleError(res, 400, 'Users do not exist');
        Request.create(fromIds, toIds, function (err));


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


    // delete requests
    delete: function(req, res) {
        var handleDelete = function(err) {
            if (err) return handleError(res, 500, err);
            res.json({success: true});
        };

        var creator_id = req.params.from_id;
        var receiver_id = req.params.to_id;
        var self_id = req.session.userId;
        if (!self_id) return handleError(res, 400, 'Please login first');
        if (self_id === receiver_id) {
            //user is the recipient, no need to auth
            deleteRequest(creator_id, receiver_id, handleDelete);
        }
        User.getRoommates(self_id, function(err, roommates) {
            //allow iff user is roommate of recipient
            if (roommates.indexOf(receiver_id) === -1) {
                //logged in user is not a roommate of the receiver, disallow
                return handleError(res, 400, 'Logged in user not a roommate of recipient');
            }
            deleteRequest(creator_id, receiver_id, handleDelete);
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
