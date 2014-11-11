var Preference = require('../models/preference');

module.exports = {

    // modify a preference
    modify: function(req, res) {
        var preferenceId = req.params.id;
        var response = req.body.response;
        
        Preference.update({ _id: preferenceId }, { response: response }, function (err) {
            if (err) return handleError(res, 500, err);
            res.json({ success:true });
        });
    }
}
