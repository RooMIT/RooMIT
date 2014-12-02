/** 
 * Author: Alec
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var bcrypt = require('bcrypt');
var Group = require('../models/Group');

var UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    available: { type: Boolean, required: true, default: true },
    group: { type: ObjectId, ref: 'Group' },
    preferences: [{ type: ObjectId, ref: 'Preference' }]
});

// adds a roommate to the user's group.
// this will either add the roommate to the user's group, 
// add the user to the roommate's group,
// or make an entirely new group if neither is in a group
UserSchema.methods.addRoommate = function (roommateID, callback) {
    var user = this;

    // if the user has a group, update the roommate to have the same group
    if (user.group) {
        User.update({ _id: roommateID }, { group: user.group }, function (err) {
            return callback(err);
        });
    } 

    // now we check if the roommate has a group
    User.find({ _id: roommateID }, 'group', function(err, roommate) {
        // if the roommate has a group, update the user to have the same group
        if (roommate.group) {
            User.update({ _id: user._id }, { group: roommate.group }, function (err) {
                return callback(err);
            });
        }  
    });
    
    // otherwise, make a new group
    var group = new Group();
    group.save(function (err) {
        if (err) return callback(err);
        // update both users to share the group
        User.update({ _id: { $in: [user._id, roommateID] } }, { group: group._id }, function (err) {
            callback(err);
        });
    });

};

// remove the user from their group, also delete the group if there is only 1 user left
UserSchema.methods.leaveGroup = function (callback) {
    var user = this;
    // set the user's group to undefined
    User.update({ _id: user._id }, { group: undefined }, function (err) {
        if (err) return callback(err);

        // now find the remaining amount of users in the group
        User.find({ group: group }, function (err, users) {
            if (users.length > 1) return callback(err);

            // if there is only 1 user in the group, destroy the group
            var user = users[0];
            Group.remove({ _id: user.group }, callback);
            }
        });

    });
};

UserSchema.methods.verifyPassword = function (enteredPassword, callback) {
    bcrypt.compare(enteredPassword, this.password, function(err, isMatch) {
        callback(err, isMatch);
    });
};

// get requests to and from the user
UserSchema.methods.getRequests = function(callback) {
    var user = this;
    Request.getRequests(user._id, callback);
};

UserSchema.statics.getUser = function(userId, callback) {
    User.findOne({_id: userId}, function(callback);
}

// update availability of the user and their roommates
UserSchema.methods.updateAvailability = function(userId, available, callback) {
    // find the user
    User.findOne({ _id: userId }, function (err, user) {
        if (err) return callback(err);
        user.updateAvailability(available, callback);
    }
}

UserSchema.methods.updateAvailability = function(available, callback) {
    var user = this;
    var groupId = user.group;
    var availableBoolean = available === 'True' || available === 'true';

    var User = mongoose.model('User');
    // update the availability of everyone in the user's group
    User.update({ group: groupId }, { available: availableBoolean }, function(error) {
        callback(error);
    });
};

// set all of the user's preferences and return the new user object
UserSchema.methods.setPreferences = function(prefs, callback) {
    var user = this;
    User.findOneAndUpdate({ id: user._id }, { preferences : prefs }, 
                    '_id name email preferences available group')
                    .populate('preferences').exec(function(err, updatedUser) {
        callback(err, updatedUser);
    });
};

// get the roommates of the user
UserSchema.methods.getRoommates = function(user, callback) {
    User.find({ group: user.group }, '_id name email preferences available group', function(err, users) {
        if (err) return callback(err);

        var roommates = users.filter(function(other) {
            return user._id !== other._id;
        });

        callback(err, roommates);
    });
};

// encrypt password before save
UserSchema.pre('save', function(next) {
    var user = this;

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password along with our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

var User = mongoose.model('User', UserSchema);
module.exports = User;