// filter out all users that don't share any housing preferences
function filterUsers(self, users) {
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
        var compatible = user.preferences.filter(function(pref) {
            return pref.response !== 'No' && acceptableDorms[pref.description];
        });
        return compatible.length !== 0;
    });
    return filtered;
}

/**
 * Completely arbitrary algorithm:
 * if yes / yes, give +2
 * if no / no, give +2
 * if don't care / don't care, give +1
 * if {yes, no} / don't care or don't care / {yes, no}, give -1
 * if no / yes or yes / no, give -2
 */
function matchScore(selfPref, otherPref) {
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

function findMatches(self, users) {
    var matches = [];
    var selfPrefs = {};
    //make it easy to access self prefs by putting them in a dictionary not a list
    self.preferences.forEach(function(pref) {
        selfPrefs[pref.description] = pref.response;
    });
    users.forEach(function(user) {
        var match = {};
        match.id = user._id;
        match.name = user.name;
        match.email = user.email;
        match.fullUser = user;
        match.value = 0;
        user.preferences.forEach(function(pref) {
            var selfPref = selfPrefs[pref.description];
            var otherPref = pref.response;
            match.value += matchScore(selfPref, otherPref);
        });
        match.value = convertScoreToPercentage(match.value, user.preferences.length);
        matches.push(match);
    });
    return matches.sort(function(a,b) {
        return b.value - a.value;
    });
}