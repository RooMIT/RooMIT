var User = require('../models/user');
var Preference = require('../models/preference');
var handleError = require('./utils').handleError;

module.exports = {

    // login existing users
    login: function(req, res) {
        var email = req.body.email;
        var password = req.body.password;

        // sanitize inputs
        if (typeof email === 'object') {
            email = JSON.stringify(email);
        }

        if (typeof password === 'object') {
            password = JSON.stringify(password);
        }

        User.findOne({ email: email }, function (err, user) {
            if (err) return handleError(res, 500, err);
            if (user == null) return handleError(res, 404, 'User not found');
            
            user.verifyPassword(password, function(error, isMatch) {
                if (error) return handleError(res, 500, error);
                if (!isMatch) return handleError(res, 403, 'Incorrect password');

                // make session
                req.session.userId = user._id;
                req.session.save();
                res.json({ user: user });
            });
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

        // sanitize inputs
        if (typeof name === 'object') {
            name = JSON.stringify(name);
        }

        if (typeof email === 'object') {
            email = JSON.stringify(email);
        }

        if (typeof password === 'object') {
            password = JSON.stringify(password);
        }

        // create them!
        var newUser = new User({ name: name, email: email, password: password });
        newUser.save(function (err, user) {
            if (err && err.code == 11000) return handleError(res, 409, 'Email already in use');
            if (err) return handleError(res, 500, err);

            createPreferences(user, function(error) {
                if (error) return handleError(res, 500, err);
                req.session.userId = user._id;
                req.session.save();
                res.json({ user:user });
            });
        });

    },

    // get the logged in user
    getLoggedInUser: function(req, res) {
        var userId = req.session.userId

        if (userId == undefined) {
            return res.json({ user: undefined });
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

var createPreferences = function(user, callback) {
    // TODO: this
    callback();
}
