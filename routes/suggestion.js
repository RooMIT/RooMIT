/**
 * Author: Alec
 */

module.exports = {
    // filter out all users that don't share any housing preferences
    filterUsers: function(self, users) {
        var acceptableDorms = {};
        self.preferences.forEach(function(pref) {
            if (pref.isDormPreference && pref.response !== 'No') {
                acceptableDorms[pref.description] = true;
            }
        });

        var filtered = users.filter(function(user) {
            //do not change to triple equals. seriously.
            if (user._id.equals(self._id) || !user.available || !self.available) {
                return false;
            }
            if (user.group && self.group && self.group.equals(user.group)) {
                return false;
            }
            var compatible = user.preferences.filter(function(pref) {
                return pref.response !== 'No' && acceptableDorms[pref.description];
            });
            return compatible.length !== 0;
        });
        return filtered;
    },

    findSuggestions: function(self, users) {
        var suggestions = [];
        var selfPrefs = {};
        //make it easy to access self prefs by putting them in a dictionary not a list
        self.preferences.forEach(function(pref) {
            selfPrefs[pref.description] = pref.response;
        });
        users.forEach(function(user) {
            var suggestion = {};
            suggestion.id = user._id;
            suggestion.name = user.name;
            suggestion.email = user.email;
            suggestion.fullUser = user;
            suggestion.value = 0;
            user.preferences.forEach(function(pref) {
                var selfPref = selfPrefs[pref.description];
                var otherPref = pref.response;
                suggestion.value += suggestionScore(selfPref, otherPref);
            });
            suggestion.value = convertScoreToPercentage(suggestion.value, user.preferences.length);
            suggestions.push(suggestion);
        });
        return suggestions.sort(function(a,b) {
            return b.value - a.value;
        });
    }
}

/**
 * Completely arbitrary algorithm:
 * if yes / yes, give +2
 * if no / no, give +2
 * if don't care / don't care, give +1
 * if {yes, no} / don't care or don't care / {yes, no}, give -1
 * if no / yes or yes / no, give -2
 */
function suggestionScore(selfPref, otherPref) {
    if (selfPref === 'Yes') {
        if (otherPref === 'Yes') {
            return 2;
        }
        else if (otherPref === 'No') {
            return -2;
        }
        return -1;
    }
    else if (selfPref === 'No') {
        if (otherPref === 'No') {
            return 2;
        }
        else if(otherPref === 'Yes') {
            return -2;
        }
        return -1;
    }
    else {
        if (otherPref === 'Yes' || otherPref === 'No') {
            return -1;
        }
        return 1;
    }
}

/**
 * Optimal score is 2 * num of prefs, pessimal score is -2 * num of prefs
 * So, let's just do a linear mapping. Simple, right?
 * (Somewhere, a statistics major is crying and does not know why.)
 */
function convertScoreToPercentage(score, num_prefs) {
    // convert range to 0 - 4*num_prefs
    score += 2*num_prefs;

    //normalize to a 0-1 scale
    score = score / (4*num_prefs);
    return score;
}

