/**
 * Author: Alec, Rujia
 */

var User = require('../models/user');
var handleError = require('./utils').handleError;
var initPreferences = require('./preferenceController').initialize;

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

    User.findOne({ email: params.email }).populate('preferences').exec(function(err, user) {
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

// create a new user (with prefs), log them in, set session
exports.create = function(req, res) {
    var params = req.body;
    var errorMessage = validateFields(params);
    if (errorMessage) return handleError(res, 400, errorMessage);
    
    var newUser = new User({ name: params.name, email: params.email, password: param.password });
    User.save(params, function(err, user) {
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

exports.get = function(req, res) {
    if (!req.session.userId) return handleError(res, 400, 'Please login first');
    var userId = req.params.id;
    User.getPopulated(userId, function(err, user) {
        if (err) return handleError(res, 500, err);
        if (!user) return handleError(res, 404, 'User not found');
        User.getRequests(function(err, res){
            if (err) return handleError(res, 500, err);
            if (!res) return handleError(res, 404, 'Requests not found');
            res.json({user: user, requestsFrom: res.requestsFrom, requestsTo: res.requestsTo});
        });
    });
};

exports.getAll = function(req, res) {
    if (!req.session.userId) return handleError(res, 400, 'Please login first');
    User.find({}, '_id name email preferences available group').populate('preferences').exec(function(err, users) {
        if (err) return handleError(res, 500, err);
        res.json({users: users});
    });
};

// filter out all users that don't share any housing preferences
function filterUsers(self, users) {
    var acceptableDorms = {};
    self.preferences.forEach(function(pref) {
        if (pref.isDormPreference && pref.response !== 'No') {
            acceptableDorms[pref.description] = true;
        }
    });

    var filtered = users.filter(function(user) {
        //do not change to triple equals. seriously.
        if (user._id.equals(self._id) || !user.available || !self.available) {
            return false;
        }
        var compatible = user.preferences.filter(function(pref) {
            return pref.response !== 'No' && acceptableDorms[pref.description];
        });
        return compatible.length !== 0;
    });
    return filtered;
}

/**
 * Completely arbitrary algorithm:
 * if yes / yes, give +2
 * if no / no, give +2
 * if don't care / don't care, give +1
 * if {yes, no} / don't care or don't care / {yes, no}, give -1
 * if no / yes or yes / no, give -2
 */
function matchScore(selfPref, otherPref) {
    if (selfPref === 'Yes') {
        if (otherPref === 'Yes') {
            return 2;
        }
        else if (otherPref === 'No') {
            return -2;
        }
        return -1;
    }
    else if (selfPref === 'No') {
        if (otherPref === 'No') {
            return 2;
        }
        else if(otherPref === 'Yes') {
            return -2;
        }
        return -1;
    }
    else {
        if (otherPref === 'Yes' || otherPref === 'No') {
            return -1;
        }
        return 1;
    }
}

/**
 * Optimal score is 2 * num of prefs, pessimal score is -2 * num of prefs
 * So, let's just do a linear mapping. Simple, right?
 * (Somewhere, a statistics major is crying and does not know why.)
 */
function convertScoreToPercentage(score, num_prefs) {
    // convert range to 0 - 4*num_prefs
    score += 2*num_prefs;

    //normalize to a 0-1 scale
    score = score / (4*num_prefs);
    return score;
}

function findMatches(self, users) {
    var matches = [];
    var selfPrefs = {};
    //make it easy to access self prefs by putting them in a dictionary not a list
    self.preferences.forEach(function(pref) {
        selfPrefs[pref.description] = pref.response;
    });
    users.forEach(function(user) {
        var match = {};
        match.id = user._id;
        match.name = user.name;
        match.email = user.email;
        match.fullUser = user;
        match.value = 0;
        user.preferences.forEach(function(pref) {
            var selfPref = selfPrefs[pref.description];
            var otherPref = pref.response;
            match.value += matchScore(selfPref, otherPref);
        });
        match.value = convertScoreToPercentage(match.value, user.preferences.length);
        matches.push(match);
    });
    return matches.sort(function(a,b) {
        return b.value - a.value;
    });
}

exports.getMatches = function(req, res) {
    var logged_in_id = req.session.userId;
    if (!logged_in_id) return handleError(res, 400, 'Please login first');
    User.getPopulated(logged_in_id, function(err, self) {
        if (err) return handleError(res, 500, err);
        if (!self) return handleError(res, 400, 'User does not exist');
        User.getAll(function(err, users) {
            if (err) return handleError(res, 500, err);
            var compatible = filterUsers(self, users);
            var matches = findMatches(self, compatible);
            res.json({matches: matches});
        })
    });
}

// update the availability of the user
exports.update = function(req, res) {
    if (!req.session.userId) return handleError(res, 400, 'Please login first');
    var userId = req.params.id;
    var available = req.body.available;
    var newRoommate = req.body.newRoommate;

    if (newRoommate) {
        User.addRoommate(newRoommate, function (err) {
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    }

    if (available) {
        // find the user
        User.updateAvailability(userId, function (err, user) {
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    }

    // nothing to update
    if (!available && !newRoommate) return res.json({ success:true });
};

module.exports = exports;