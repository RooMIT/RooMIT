var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectID = Schema.Types.ObjectId;
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

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
}

UserSchema.statics.createUser = function(params, callback) {
    var User = this;
    bcrypt.hash(params.password, 10, function(err, hash) {
        if (err) {
            return callback(err);
        }
        var user = new User({name: params.name, email: params.email, password: hash});
        user.save(callback);
    })
}

var User = mongoose.model('User', UserSchema);
module.exports = User;