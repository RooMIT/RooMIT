var User = require('../models/user');
var Preference = require('../models/preference');
var handleError = require('./utils').handleError;
var initPreferences = require('./preferenceController').initialize;

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

        User.findOne({ email: email }).populate('preferences').populate('roommates', '_id name email').exec(function (err, user) {
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

            // create all the user's preferences
            initPreferences(user, function(error) {
                if (error) return handleError(res, 500, err);

                // set cookies
                req.session.userId = user._id;

                // populate the user's prefs and roommates
                User.findOne({ _id: user._id }).populate('preferences').populate('roommates', '_id name email').exec(function (err, user) {
                    if (err) return handleError(res, 500, err);
                    res.json({ user: user });
                });
            });

        });

    },

    // get a particular user
    get: function(req, res) {
        var userId = req.params.id

        User.findOne({ _id: userId }).populate('preferences').populate('roommates', '_id name email').exec(function (err, user) {
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

    //get all requested users
    getRequested: function(req, res) {
        User.findOne({ _id: req.params.id}, function (err, user) {
            User.find({ _id: { $in: user.requested}}, function (err, users) {
                if (err) return handleError(res, 500, err);
                if (users == undefined) return handleError(res, 404, 'Users not found');
                res.json({ users: users }); 
            });
        });
    },

    //get all roommates
    getRoommates: function(req, res) {
        User.findOne({ _id: req.params.id}, function (err, user) {
            User.find({ _id: { $in: user.roommates}}, function (err, users) {
                if (err) return handleError(res, 500, err);
                if (users == undefined) return handleError(res, 404, 'Users not found');
                res.json({ users: users }); 
            });
        });
    },

    // modify a user
    update: function(req, res) {
        var userId = req.params.id;
        var available = req.body.available;

        if (typeof req.body.roommates !== 'undefined') var roommates = (req.body.roommates.length > 0) ? req.body.roommates.split(','): [];
        if (typeof req.body.requested !== 'undefined') var requested = (req.body.requested.length > 0) ? req.body.requested.split(','): [];

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

            // if no availability changes, just return
            if (!available) return res.json({ success:true });

            // if availability changes, change roommates availability too
            updateRoommatesAvailability(userId, available, function(error) {
                if (error) return handleError(res, 500, error);
                res.json({ success:true });
            });

        });
    },

    // get the logged in user's matches in { <user> : <percent>, ... } format
    getMatches: function(req, res) {
        var userId = req.session.userId;

        // TODO: get matches
    }
}

// update the availability of all roommates of the user
var updateRoommatesAvailability = function(userId, available, callback) {
    User.update({ roommates: userId }, { available: available }, function(err) {
        callback(err);
    }
}
