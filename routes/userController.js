var User = require('../models/user');

module.exports = {

    // login existing users
    login: function(req, res) {
        var email = req.body.email;
        var password = req.body.password;

        // TODO: sanitize inputs

        User.findOne({ email: email }, function (err, user) {
            if (err) return handleError(res, 500, err);
            if (user == null) return handleError(res, 404, 'User not found');
            
            // verify password
            // make session
        });
    },

    // logout user
    logout: function(req, res) {
        // destroy session
        req.session.destroy(function(err) {
            if (err) handleError(res, 500, err);
            res.json({ success:true });
        });
    },

    // create a new user
    create: function(req, res) {
        var name = req.body.name;
        var email = req.body.email;
        var password = req.body.password;

        // TODO: sanitize inputs

        // create them!
        // create prefs
        // create session

    },

    // get the logged in user
    getLoggedInUser: function(req, res) {
        var userId = req.session.userId

        if (userId == undefined) {
            return res.json();
        }

        User.findOne({ _id: userId }, function (err, user) {
            if (err) return handleError(res, 500, err);
            if (user == undefined) return handleError(res, 404, 'User not found');
            res.json({ user: user });
        });
    },

    // modify a user
    modify: function(req, res) {
        var userId = req.params.id;
        var available = req.body.available;
        var roommates = req.body.roommates;
        var requested = req.body.requested;

        // all of these fields are optional, only update the ones that are defined
        var updateFields = {};
        if (roommates) {
            updateFields.roommates = roommates;
        }

        if (requested) {
            updateFields.requested = requested;
        }

        if (available) {
            updateFields.available = available == 'True' || available == 'true';
        }
        
        User.update({ _id: userId }, updateFields, function (err) {
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    }
}
