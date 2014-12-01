/** 
 * Author: Olga
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var GroupSchema = new Schema();

var Group = mongoose.model('Group', GroupSchema);
module.exports = Group;