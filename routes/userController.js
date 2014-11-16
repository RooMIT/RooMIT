var User = require('../models/user');
var Preference = require('../models/preference');
var handleError = require('./utils').handleError;
var initPreferences = require('./preferenceController').initiliaze;

module.exports = {

    // login existing users
    login: function(req, res) {
        var email = req.body.email;
        var password = req.body.password;

        // sanitize inputs
        if (!(/^[A-Z0-9._%+-]+@mit.edu$/i).test(email)) {
            return handleError(res, 400, 'Please enter a valid MIT email');
        }

        if (!(/^(?=\s*\S).*$/i).test(password)) {
            return handleError(res, 400, 'Please enter a nonempty password');
        }

        User.findOne({ email: email }, function (err, user) {
            if (err) return handleError(res, 500, err);
            if (user == null) return handleError(res, 404, 'Please create an account');
            
            user.verifyPassword(password, function(error, isMatch) {
                if (error) return handleError(res, 500, error);
                if (!isMatch) return handleError(res, 401, 'Incorrect password');

                // make session
                req.session.userId = user._id;
                res.json({ user: user });
            });
        });

    },

    // logout user
    logout: function(req, res) {
        // destroy session
        req.session.userId = undefined;
        res.json({ success:true });
    },

    // create a new user
    create: function(req, res) {
        var name = req.body.name;
        var email = req.body.email;
        var password = req.body.password;

        // sanitize inputs
        if (!(/^[a-z\s]+$/i).test(name)) {
            return handleError(res, 400, 'Please enter a nonempty name with alphabetical characters and spaces only');
        }

        if (!(/^[A-Z0-9._%+-]+@mit.edu$/i).test(email)) {
            return handleError(res, 400, 'Please enter a valid MIT email');
        }

        if (!(/^(?=\s*\S).*$/i).test(password)) {
            return handleError(res, 400, 'Please enter a nonempty password');
        }

        // create them!
        var newUser = new User({ name: name, email: email, password: password });
        newUser.save(function (err, user) {
            if (err && err.code == 11000) return handleError(res, 400, 'Email already in use');
            if (err) return handleError(res, 500, err);

            createPreferences(user, function(error) {
                if (error) return handleError(res, 500, err);
                req.session.userId = user._id;
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

    // get a particular user
    get: function(req, res) {
        var userId = req.params.id

        User.findOne({ _id: userId }, function (err, user) {
            if (err) return handleError(res, 500, err);
            if (user == undefined) return handleError(res, 404, 'User not found');
            res.json({ user: user });
        });
    },

    // get all users
    getAll: function(req, res) {
        User.find({}, function(err, users) {
            res.json({ users: users });
        })
    },

    // get all specified users
    getSpecified: function(req, res) {
        var requested = req.body.requested.split(',');

        console.log("req.body.users:", requested);
        
        User.find({ _id: { $in: requested}}, function (err, users) {
            if (err) return handleError(res, 500, err);
            if (users == undefined) return handleError(res, 404, 'Users not found');
            res.json({ users: users }); 
        }); 
    },

    // modify a user
    update: function(req, res) {
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

        // TODO: if availability changes, change roommates availability too
        if (available) {
            updateFields.available = available == 'True' || available == 'true';
        }
        
        User.update({ _id: userId }, updateFields, function (err) {
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    },

    // get the logged in user's matches in { <user> : <percent>, ... } format
    getMatches: function(req, res) {
        var userId = req.session.userId;

        // TODO: get matches
    }
}

var createPreferences = function(userId) {
    initPreferences(userId);
}
