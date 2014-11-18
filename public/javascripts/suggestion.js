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
    getMatches(function(suggestions) {
        console.log(suggestions);
        $('#content').html(Handlebars.templates['suggestions']({
            suggestions: suggestions
        }));
    });
}