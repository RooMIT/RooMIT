/**
 * Author: Rujia
 */

var Request = require('../models/request');
var handleError = require('./utils').handleError;

module.exports = {

    // create a request
    create: function(req, res) {
        var fromId = req.session.userId;
        var toId = req.body.toId;

        if (!fromId) return handleError(res, 400, 'Please login first');
        if (!toId) return handleError(res, 400, 'Requested user does not exist');
        
        var newRequest = new Request({ from: fromId, to: toId });
        newRequest.save(function (err, request) {
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    },

    // delete a request
    delete: function(user, callback){
        var requestId = req.params.id;
        
        if (!req.session.userId) return handleError(res, 400, 'Please login first');

        Request.findByIdAndRemove(requestId, function(err) {
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    }
};
