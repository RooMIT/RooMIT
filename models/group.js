/** 
 * Author: Olga
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var GroupSchema = new Schema();

// remove the group id from all users before deleting it
GroupSchema.statics.deleteGroup = function(groupId, callback) {
    Group.find({ _id: groupId }).remove(function(err) {

        var User = mongoose.model('User');
        User.find({ group: groupId }, function(error, users) {
            if (error) return callback(error);
            // because update doesn't work
            var counter = 0;
            var goal = users.length;
            
            users.forEach(function(oneUser) {
                oneUser.group = undefined;
                oneUser.available = true;
                oneUser.save(function(newuser) {
                    counter += 1;
                    if (counter === goal) {
                        callback();
                    }
                });
            });

        });
    });
}

var Group = mongoose.model('Group', GroupSchema);
module.exports = Group;