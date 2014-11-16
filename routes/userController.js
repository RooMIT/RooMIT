var User = require('../models/user');
var Preference = require('../models/preference');
var handleError = require('./utils').handleError;
var initPreferences = require('./preferenceController').initialize;

var exports = {};

var validateFields = function(fields) {
    if (typeof fields.email === 'string' && !(/^[A-Z0-9._%+-]+@mit.edu$/i).test(fields.email)) {
        return 'Please enter a valid MIT email';
    }
    if (typeof fields.password === 'string' && !(/^(?=\s*\S).*$/i).test(fields.password)) {
        return 'Please enter a nonempty password';
    }
    if (typeof fields.name === 'string' && !(/^[a-z\s]+$/i).test(fields.name)) {
        return 'Please enter a nonempty name with alphabetical characters and spaces only';
    }
    return '';
}

exports.login = function(req, res) {
    var errorMessage = validateFields(req.body);
    if (errorMessage) {
        return handleError(res, 400, errorMessage);
    }
    User.findOne({ email: email }, function (err, user) {
        if (err) return handleError(res, 500, err);
        if (!user) return handleError(res, 404, 'Please create an account');
        user.verifyPassword(password, function(error, isMatch) {
            if (error) return handleError(res, 500, error);
            if (!isMatch) return handleError(res, 401, 'Incorrect password');

            // make session
            req.session.userId = user._id;
            res.json({ user: user });
        });
    });
};

exports.create = function(req, res) {
    var params = req.body;
    var errorMessage = validateFields(params);
    if (errorMessage) {
        return handleError(res, 400, errorMessage);
    }
    User.createUser(params, function(err, user) {
        if (err && err.code == 11000) return handleError(res, 400, 'Email already in use');
        if (err) return handleError(res, 500, err);
        initPreferences(user._id);
    }
    var newUser = new User({ name: params.name, email: params.email, password: params.password });
    newUser.save(function (err, user) {


        createPreferences(user, function(error) {
            if (error) return handleError(res, 500, err);
            req.session.userId = user._id;
            res.json({ user:user });
        });
    });
};

var logout = function(req, res) {
    delete req.session.userId;
    res.json({ success: true });
};

var getLoggedInUser = function(req, res) {
    var userId = req.session.userId

    if (!userId) {
        return res.json({ user: undefined });
    }

    User.findOne({ _id: userId }, function (err, user) {
        if (err) return handleError(res, 500, err);
        if (!user) return handleError(res, 404, 'User not found');
        res.json({ user: user });
    });
};

module.exports = {
    login: login,
    logout: logout,

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
    getLoggedInUser: 
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

    // modify a user
    update: function(req, res) {
        var userId = req.params.id;
        var available = req.body.available;

        //TODO just use if(req.body.<param>)
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
