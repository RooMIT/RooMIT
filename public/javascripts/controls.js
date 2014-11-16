// click profile
$(document).on('click', '#profile:not(.active) a', function(event) {
    var user_id = $.cookie('user');
    if (user_id) {
        getUser(user_id, function(user) {
            showUserProfile(user);
        });
    }
    else {
        handleError('Please login first');
    }
});

// click suggestions
$(document).on('click', '#suggestions:not(.active) a', function(event) {
    showSuggestions();
});

// click requests
$(document).on('click', '#requests:not(.active) a', function(event) {
    showRequests();
});

// shows suggestions page
var showSuggestions = function() {
    switchActive('#suggestions');
    var suggestions = [];

    $('#content').html(Handlebars.templates['suggestions']({
       suggestions: suggestions
    }));
}





// switch the active class from the current item to a new item
switchActive = function(newActiveSelector) {
    $('li').removeClass('active');
    $(newActiveSelector).addClass('active');
}