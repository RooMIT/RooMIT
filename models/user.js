/** 
 * Author: Alec
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var bcrypt = require('bcrypt');
var Request = require('./request');

var UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    available: { type: Boolean, required: true, default: true },
    group: { type: ObjectId, ref: 'Group' },
    preferences: [{ type: ObjectId, ref: 'Preference' }]
});

UserSchema.methods.verifyPassword = function (enteredPassword, callback) {
    bcrypt.compare(enteredPassword, this.password, function(err, isMatch) {
        callback(err, isMatch);
    });
};

// get requests to and from the user
UserSchema.methods.getRequests = function(callback) {
    var user = this;
    Request.find({ from: this._id }).populate('to', '_id name email preferences available group').exec(function(err, reqFrom) {
        if (err) return callback(err);
        Request.find({ to: this._id }).populate('from', '_id name email preferences available group').exec(function(error, reqTo) {
            callback(err, { requestsFrom: reqFrom, requestsTo: reqTo });
        });
    });
};

UserSchema.methods.getRoommates = function(callback) {
    var user = this;
    // FIXME: this gives all including user
    User.find({ group: this.group }, '_id name email preferences available group').exec(callback(err, users));
};


UserSchema.methods.updateAvailability = function(userId, callback) {
    // find the user
    User.findOne({ _id: userId }, function (err, user) {
        if (err) return callback(err);
        if (!user) return callback('User not found');

        var groupId = user.group;
        var availableBoolean = available === 'True' || available === 'true';

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

        User.findOne({_id: user_id}).populate('preferences').exec(callback(err, user));
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