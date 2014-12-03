 /** 
  * Author: Alec
  */
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
    getSuggestions(function(response) {
        var suggestions = response.suggestions

        $('#content').html(Handlebars.templates['suggestions']({
            suggestions: suggestions
        }));
    });
}

// get the suggestions for the logged in user
var getSuggestions = function(callback) {
    $.get(
        '/suggestions'
    ).done(function(response) {
        callback(response);
    }).fail(function(error) {
        handleError(error);
    });
}