/**
 * Author: Alec, Rujia
 */

var User = require('../models/user');
var handleError = require('./utils').handleError;
var initPreferences = require('./preferenceController').initialize;
var Match = require('./match');

var exports = {};

// validate login fields
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

// login user and set session
exports.login = function(req, res) {
    var params = req.body;
    var errorMessage = validateFields(params);
    if (errorMessage) return handleError(res, 400, errorMessage);

    User.login(params.email, params.password, function(err, user) {
        if (err) return handleError(res, 400, err);
        
        req.session.userId = user._id;
        res.json({user: user});
    });
};

// create a new user (with prefs), log them in, set session
exports.create = function(req, res) {
    var params = req.body;
    var errorMessage = validateFields(params);
    if (errorMessage) return handleError(res, 400, errorMessage);
    
    var newUser = new User({ name: params.name, email: params.email, password: params.password });
    newUser.save(function(err, user) {
        if (err && err.code == 11000) return handleError(res, 400, 'Email already in use');
        if (err) return handleError(res, 500, err);
        
        initPreferences(user, function(error, user) {
            if (error) return handleError(res, 500, err);
            if (!user) return handleError(res, 404, 'User not found');
            
            req.session.userId = user._id;
            res.json({ user: user });
        });
    });
};

exports.logout = function(req, res) {
    delete req.session.userId;
    res.json({ success: true });
};

exports.get = function(req, res) {
    if (!req.session.userId) return handleError(res, 400, 'Please login first');
    var userId = req.params.id;
    
    User.getUser(userId, function(err, user) {
        if (err) return handleError(res, 500, err);
        if (!user) return handleError(res, 404, 'User not found');
        res.json({ user: user });
    });
};

exports.getAll = function(req, res) {
    if (!req.session.userId) return handleError(res, 400, 'Please login first');
    
    User.getAllUsers(function(err, users) {
        if (err) return handleError(res, 500, err);
        res.json({users: users});
    });
};

exports.getRoommates = function(req, res) {
    if (!req.session.userId) return handleError(res, 400, 'Please login first');
    var userId = req.params.id;

    User.getRoommates(userId, function(err, roommates) {
        if (err) return handleError(res, 500, err);
        res.json({roommates: roommates});
    });
}

exports.getMatches = function(req, res) {
    var logged_in_id = req.session.userId;
    if (!logged_in_id) return handleError(res, 400, 'Please login first');
    
    User.getUser(logged_in_id, function(err, self) {
        if (err) return handleError(res, 500, err);
        if (!self) return handleError(res, 400, 'User does not exist');
        
        User.getAllUsers(function(err, users) {
            if (err) return handleError(res, 500, err);

            var compatible = Match.filterUsers(self, users);
            var matches = Match.findMatches(self, compatible);
            res.json({matches: matches});
        })
    });
}

// update the user's availability or group
exports.update = function(req, res) {
    if (!req.session.userId) return handleError(res, 400, 'Please login first');
    var userId = req.params.id;
    var available = req.body.available;
    var leaveGroup = req.body.leaveGroup;
    console.log(available, leaveGroup);

    // nothing to update
    if (available === undefined && leaveGroup === undefined) return res.json({ success:true });

    if (leaveGroup !== undefined) {
        // this also makes the user available
        User.leaveGroup(userId, function (err) {
            if (err) return handleError(res, 500, err);
            return res.json({ success:true });
        });
    }

    if (available !== undefined) {
        User.updateAvailability(userId, available, function (err) {
            if (err) return handleError(res, 500, err);
            return res.json({ success:true });
        });
    }
}

// add a new roommate to the user
exports.addRoommate = function(req, res) {
    if (!req.session.userId) return handleError(res, 400, 'Please login first');
    var userId = req.params.id;
    var roommateId = req.body.roommateId;

    // nothing to update
    if (!roommateId) return res.json({ success:true });

    User.addRoommate(newRoommate, function (err) {
        if (err) return handleError(res, 500, err);
        return res.json({ success:true });
    });
};

module.exports = exports;