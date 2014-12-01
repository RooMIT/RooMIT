/**
 * Author: Rujia
 */

var Request = require('../models/request');
var handleError = require('./utils').handleError;

module.exports = {

    // create a request
    create: function(req, res) {
        var fromId = req.params.id;
        var toId = req.body.to;

        if (!toId || !fromId) return handleError(res, 400, 'User does not exist');
        
        var newRequest = new Request({ from: fromId, to: toId });
        newRequest.save(function (err, request) {
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    },

    // delete a request
    delete: function(req, res) {
        var requestId = req.params.id;
        
        if (!req.session.userId) return handleError(res, 400, 'Please login first');

        Request.findByIdAndRemove(requestId, function(err) {
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    }

    // get all requests to/from a user
    get: function(req, res) {
        var userId = req.params.id;

        Request.getRequests(userId, function(err, result){
            if (err) return handleError(res, 500, err);
            res.json({ requestsTo: result.requestsTo, requestsFrom: result.requestsFrom }); 
        });
    }

};
