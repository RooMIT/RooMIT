var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var bcrypt = require('bcrypt');

var UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    available: { type: Boolean, required: true, default: true },
    roommates: [{ type: ObjectId, ref: 'User' }],
    requested: [{ type: ObjectId, ref: 'User' }],
    preferences: [{ type: ObjectId, ref: 'Preference' }]
});

UserSchema.methods.verifyPassword = function (enteredPassword, callback) {
    bcrypt.compare(enteredPassword, this.password, function(err, isMatch) {
        callback(err, isMatch);
    });
};

UserSchema.statics.createUser = function(params, callback) {
    var User = this;
    bcrypt.hash(params.password, 10, function(err, hash) {
        if (err) {
            return callback(err);
        }
        var user = new User({name: params.name, email: params.email, password: hash});
        // if user has a non-unique username, then this will fail
        user.save(callback);
    });
};

UserSchema.statics.getPopulated = function(user_id, callback) {
    var User = this;
    User.findOne({_id: user_id}).populate('preferences').populate('roommates', '_id name email').exec(callback);
};

UserSchema.methods.setPreferences = function(prefs, callback) {
    var user = this;
    user.preferences = prefs;
    user.save(function(err, user) {
        if (err) callback(err);
        //TODO figure out if this can be less hacky
        mongoose.model('User').getPopulated(user._id, callback);
    });
};

var User = mongoose.model('User', UserSchema);
module.exports = User;