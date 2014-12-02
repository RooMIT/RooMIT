/**
 * Author: Rujia
 */

var Request = require('../models/request');
var handleError = require('./utils').handleError;

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
    },

    // delete requests
    delete: function(req, res) {
        var deleteRequests = req.body.deleteRequests;
        if (!req.session.userId) return handleError(res, 400, 'Please login first');
        if (!deleteRequests.length) return handleError(res, 400, 'Requests do not exist');

        deleteRequests = deleteRequests.split(',');
        
        deleteRequests.forEach(function(requestId) {
            Request.findByIdAndRemove(requestId, function(err) {
                if (err) return handleError(res, 500, err);
                res.json({ success:true });
            });
        });
    }

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
