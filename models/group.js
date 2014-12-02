/** 
 * Author: Olga
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var GroupSchema = new Schema();

// remove the group id from all users before deleting it
GroupSchema.pre('remove', function(next) {
    var groupId = this._id;

    User.update({ group: groupId }, { group: undefined }, function(err) {
        next(err);
    });
});

var Group = mongoose.model('Group', GroupSchema);
module.exports = Group;