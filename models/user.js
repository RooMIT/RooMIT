/** 
 * Author: Alec
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var bcrypt = require('bcrypt');
var Request = require('./request');
var User = require('../models/Group');

var UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    available: { type: Boolean, required: true, default: true },
    group: { type: ObjectId, ref: 'Group' },
    preferences: [{ type: ObjectId, ref: 'Preference' }]
});

UserSchema.methods.addRoommate = function (roommateID, callback){
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

UserSchema.methods.leaveGroup = function (callback){
    var group = this.group;
    User.update({_id: this._id}, {group: undefined}, function (err){
        if (err) return callback(err);
        User.find({group: group}, function (err, users){
            if (users.length > 1){
                return callback(err);
            } else {
                User.update({group: group}, {group: undefined}, function (err){
                    if (err) return callback(err);
                    Group.remove({_id: group}, function (err){
                        callback(err);
                    });
                });
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
    Request.findFrom(user._id, function(err, from) {
        if (err) return callback(err);
        Request.findTo(user._id, callback);
    })
};

UserSchema.methods.getRoommates = function(callback) {
    var user = this;
    // Slight hack: we need to get the current model for User but this is only available at runtime
    //var User = mongoose.model('User');
    User.find({ group: user.group }, '_id name email preferences available group').exec(function(err, users) {
        if (err) return callback(err);
        users = users.filter(function(other) {
            return user._id !== other._id;
        });
        callback(err, users);
    });
};

UserSchema.statics.getUser = function(userId, callback) {
    User.findOne({_id: userId}, function(callback);
}

UserSchema.statics.updateAvailability = function(userId, available, callback) {
    var User = this;
    User.getUser(userId, function(err, user) {
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

UserSchema.methods.setPreferences = function(prefs, callback) {
    var user = this;
    user.preferences = prefs;
    user.save(function(err, user) {
        if (err) callback(err);
        //var User = mongoose.model('User');
        User.findOne({_id: user_id}).populate('preferences').exec(callback);
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