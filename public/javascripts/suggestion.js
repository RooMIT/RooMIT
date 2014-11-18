// takes .88888333 in and returns 89
Handlebars.registerHelper('percent', function(num) {
    return Math.round(num * 100);
});

// click suggestions
$(document).on('click', '#suggestions:not(.active) a', function(event) {
    event.preventDefault();
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();
    showSuggestions();
});

// shows suggestions page
var showSuggestions = function() {
    switchActive('#suggestions');
    getMatches(function(matches) {
        $('#content').html(Handlebars.templates['suggestions']({
            suggestions: matches
        }));
    });
}

// get the matches (suggestions) for the logged in user
var getMatches = function(callback) {
    $.get(
        '/matches'
    ).done(function(response) {
        callback(response.matches);
    }).fail(function(error) {
        handleError(error);
    });
}