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

UserSchema.methods.addRoommate = function (roommateID, callback){
    var user = this;
    User.findOne({ _id: roommateID }, function (err, roommate){
        if (err) return callback(err);
        if (!roommate) return callback('Roommate not found');

        if (user.group != undefined){
            User.update({_id: roommateID}, {group: this.group}, function (err){
                callback(err);
            });
        } else if (roommate.group != undefined){
            User.update({_id: this._id}, {group: roommate.group}, function (err){
                callback(err);
            });
        } else {
            var group = new Group();
            group.save(function (err){
                if (err) return callback(err);
                User.update({_id: this._id}, {group: group._id}, function (err){
                    if (err) return callback(err);
                    User.update({_id: roommateID}, {group: group._id}, function (err){
                        callback(err);
                    });
                });
            });
        }
    });
};

var deleteGroup = function(user, callback) {
    //TODO figure out whether this actually caches group or whether group is deleted
    var group = user.group;
    User.update({group: group}, {group: undefined}, function(err) {
        if (err) return callback(err);
        var Group = mongoose.model('Group');
        Group.remove({_id: group}, callback);
    }
}

UserSchema.methods.leaveGroup = function (callback){
    var user = this;
    User.update({_id: user._id}, {group: undefined}, function (err){
        if (err) return callback(err);
        User.find({group: group}, function (err, users){
            if (users.length > 1) return callback(err);
            var user = users[0];
            deleteGroup(user, callback);
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