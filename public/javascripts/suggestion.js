// click suggestions
$(document).on('click', '#suggestions:not(.active) a', function(event) {
    showSuggestions();
});

// shows suggestions page
var showSuggestions = function() {
    switchActive('#suggestions');
    var suggestions = [];

    $('#content').html(Handlebars.templates['suggestions']({
       suggestions: suggestions
    }));
}