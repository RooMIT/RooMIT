// click profile
$(document).on('click', '#profile:not(.active) a', function(event) {
    // TODO: figure out cookies
    //showUserProfile();
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

// shows requests page
var showRequests = function() {
    switchActive('#requests');
    var requestsToUser = [];
    var requestsFromUser = [];

    $('#content').html(Handlebars.templates['requests']({
       requestsToUser: requestsToUser,
       requestsFromUser: requestsFromUser
    }));
}

// switch the active class from the current item to a new item
switchActive = function(newActiveSelector) {
    $('li').removeClass('active');
    $(newActiveSelector).addClass('active');
}