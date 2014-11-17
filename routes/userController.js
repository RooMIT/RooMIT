var User = require('../models/user');
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
};

exports.login = function(req, res) {
    var params = req.body;
    var errorMessage = validateFields(params);
    if (errorMessage) {
        return handleError(res, 400, errorMessage);
    }
    User.findOne({ email: params.email }).populate('preferences').populate('roommates', '_id name email').exec(function(err, user) {
        if (err) return handleError(res, 500, err);
        if (!user) return handleError(res, 404, 'Please create an account');
        user.verifyPassword(params.password, function(err, isMatch) {
            if (err) return handleError(res, 500, err);
            if (!isMatch) return handleError(res, 401, 'Incorrect password');
            req.session.userId = user._id;
            res.json({user: user});
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
        initPreferences(user, function(error, user) {
            if (error) return handleError(res, 500, err);
            if (!user) return handleError(res, 404, 'User not found');
            req.session.userId = user._id;
            res.json({user: user});
        });
    });
};

exports.logout = function(req, res) {
    delete req.session.userId;
    res.json({ success: true });
};

exports.getLoggedInUser = function(req, res) {
    var userId = req.session.userId;
    if (!userId) {
        return res.json({ user: undefined });
    }
    User.getPopulated(userId, function(err, user) {
        if (err) return handleError(res, 500, err);
        if (!user) return handleError(res, 404, 'User not found');
        res.json({user: user});
    });
};

exports.get = function(req, res) {
    var userId = req.params.id;
    User.getPopulated(userId, function(err, user) {
        if (err) return handleError(res, 500, err);
        if (!user) return handleError(res, 404, 'User not found');
        res.json({user: user});
    });
};

exports.getAll = function(req, res) {
    User.find({}, 'name email roommates preferences available ').populate('preferences').populate('roommates', '_id name email').exec(function(err, users) {
        res.json({ users: users });
    });
};

exports.getRequested = function(req, res) {
    if (req.params.id !== res.session.userId) return handleError(res, 400, 'Please login first');
    User.findOne({ _id: req.params.id}, function (err, user) {
        if (err) return handleError(res, 500, err);
        if (!user) return handleError(res, 404, 'User does not exist');
        User.find({ _id: { $in: user.requested}}, function (err, users) {
            if (err) return handleError(res, 500, err);
            if (!users) return handleError(res, 404, 'Users not found');
            res.json({ users: users }); 
        });
    });
};

exports.getRoommates = function(req, res) {
    User.findOne({ _id: req.params.id}, function (err, user) {
        User.find({ _id: { $in: user.roommates}}, function (err, users) {
            if (err) return handleError(res, 500, err);
            if (users === undefined) return handleError(res, 404, 'Users not found');
            res.json({ users: users }); 
        });
    });
};

exports.update = function(req, res) {
    var userId = req.params.id;
    var available = req.body.available;
    var roommates;
    var requested;

    var updateRoommatesAvailability = function(userId, available, callback) {
        User.update({ roommates: userId }, { available: available }, function(err) {
            callback(err);
        }
    };

    if (typeof req.body.roommates === 'string') {
        roommates = (req.body.roommates.length > 0) ? req.body.roommates.split(','): [];
    }

    if (typeof req.body.requested === 'string') {
        requested = (req.body.requested.length > 0) ? req.body.requested.split(','): [];
    }

    // all of these fields are optional, only update the ones that are defined
    var updateFields = {};

    if (roommates) {
        updateFields.roommates = roommates;
    }

    if (available) {
        updateFields.available = available === 'True' || available === 'true';
    }

    if (requested) {
        updateFields.requested = requested;
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
    
    User.update({ _id: userId }, updateFields, function (err) {
        if (err) return handleError(res, 500, err);
        res.json({ success:true });
    });
};

module.exports = exports;
