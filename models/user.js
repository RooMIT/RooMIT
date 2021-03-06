/** 
 * Author: Alec
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var Group = require('../models/group');

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
UserSchema.statics.addRoommate = function(userID, roommateID, callback) {
    var User = this;
    User.findOne({ _id: userID}, '_id group', function(err, user) {
        if (err) return callback(err);
        if (!user) return callback('User does not exist');
        User.findOne({_id: roommateID}, '_id group', function(err, other) {
            if (err) return callback(err);
            if (!other) return callback('Other user does not exist');
            //If user already has a group, add other to user's group

            if (user.group) {
                other.group = user.group;
                other.save(callback);
            }
            //If user has no group but other does, add user to other's group
            else if (other.group) {
                user.group = other.group;
                user.save(callback);
            }
            //otherwise make a new group
            else {
                var group = new Group();
                group.save(function (err) {
                    if (err) return callback(err);
                    // update both users to share the group
                    User.find({_id: {$in: [userID, roommateID] } }, function(err, result) {
                        result.forEach(function(elem) {
                            elem.group = group._id;
                            elem.save();

                        });
                        callback();
                    });
                });
            }
        });
    });
};

// remove the user from their group, also delete the group if there is only 1 user left
UserSchema.statics.leaveGroup = function (userId, callback) {
    // get the user to find their group
    User.findOne({ _id: userId }, 'group', function(err, user) {
        if (err) return callback(err);
        var oldGroup = user.group;

        // set the user's group to undefined and availability to true
        user.group = undefined;
        user.available = true;
        user.save(function (error) {
            if (error) return callback(error);

            // now find the remaining amount of users in the group
            User.find({ group: oldGroup }, function (error2, users) {
                if (error2) return callback(error2);
                if (users.length > 1) return callback(undefined);

                // if there is only 1 user in the group, destroy the group
                Group.deleteGroup(oldGroup, callback);
            });
        });

    });
};

// verify the given password
UserSchema.methods.verifyPassword = function (enteredPassword, callback) {
    var user = this;
    bcrypt.compare(enteredPassword, user.password, callback);
};

// get requests to and from the user
UserSchema.methods.getRequests = function(callback) {
    var user = this;
    Request.getRequests(user._id, callback);
};

// get the populated (with preferences) user
UserSchema.statics.getUser = function(userId, callback) {
    User.findOne({ _id: userId }, '_id name email preferences available group')
                .populate('preferences', 
                    '_id description response isDormPreference isRoommateNumberPreference', 
                    null, 
                    { sort: { '_id': 1 } }
                ).exec(callback);
}

// get all of the populated (with preferences) users
UserSchema.statics.getAllUsers = function(callback) {
    User.find({}, '_id name email preferences available group')
                .populate('preferences', 
                    '_id description response isDormPreference isRoommateNumberPreference', 
                    null, 
                    { sort: { '_id': 1 } }
                ).exec(callback);
}

// find the user and validate their password
UserSchema.statics.login = function(email, password, callback) {
    User.findOne({ email: email }).populate('preferences').exec(function(err, user) {
        if (err) return callback(err);
        if (!user) return callback('Please create an account');

        user.verifyPassword(password, function(error, isMatch) {
            if (!isMatch) return callback('Incorrect password');
            callback(error, user);
        });
    });
}

// update availability of the user and their roommates
UserSchema.statics.updateAvailability = function(userId, available, callback) {
    // find the user to find their group
    User.findOne({ _id: userId }, function (err, user) {
        if (err) return callback(err);

        var availableBoolean = available === 'True' || available === 'true';

        // if the user doesn't have a group, just update them
        if (!user.group) {
            User.update({ _id: userId }, { available: availableBoolean }).exec(callback);
        } else {
            // if there is a group, update the availability of everyone in the user's group
            User.find({ group: user.group }, function(err, users) {
                users.forEach(function(oneUser) {
                    oneUser.available = availableBoolean;
                    oneUser.save();
                });
                callback(err);
            });
        }

        
    });
}

// set all of the user's preferences and return the new user object
UserSchema.methods.setPreferences = function(prefs, callback) {
    var user = this;
    User.findOneAndUpdate({ _id: user._id }, { preferences : prefs }, 
                    '_id name email preferences available group')
                    .populate('preferences',
                        '_id description response isDormPreference isRoommateNumberPreference', 
                        null, 
                        { sort: { '_id': 1 } }
                    ).exec(callback);
};

// get the roommates of the user
UserSchema.statics.getRoommates = function(userId, callback) {
    User.findOne({ _id: userId }, 'group email', function(err, user) {
        if (err) return callback(err);

        // if no group, no roommates
        if (!user.group) {
            return callback(undefined, []);
        }

        User.find({ group: user.group }, '_id name email preferences available group', function(error, users) {
            if (error) return callback(err);

            // filter out the user from roommates
            var roommates = users.filter(function(other) {
                return !(other._id.equals(user._id))
            });
            callback(undefined, roommates);
        });
    });
    
};

// create the user, hash the password
UserSchema.statics.create = function(name, email, password, callback) {
    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return callback(err);

        // hash the password along with our new salt
        bcrypt.hash(password, salt, function(error, hash) {
            if (error) return callback(error);

            var newUser = new User({ name: name, email: email, password: hash });
            newUser.save(function(error2, user) {
                callback(undefined, user);
            });
        });
    });
}

var User = mongoose.model('User', UserSchema);
module.exports = User;