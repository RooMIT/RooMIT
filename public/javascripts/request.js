/** 
 * Author: Rujia
 */

$(document).on('click', '#requests:not(.active) a', function(event) {
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    showRequests();
});

// click cancel request
$(document).on('click', '.cancel', function(event) {
    event.preventDefault();
    var requestID = $(this).parent().attr('request-id');

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    // delete the request
    deleteRequest(requestID, function() {
        showRequests();
    });
});

// click confirm, remove the request and make the users roommates (as well as unavailable)
$(document).on('click', '.confirm', function(event) {
    event.preventDefault();
    var requestID = $(this).parent().attr('request-id');
    var roommateID = $(this).parent().attr('user-id');

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();
    
    // delete the request
    deleteRequest(requestID, function() {
        // TODO: update the user's group
    });
});

// click deny
$(document).on('click', '.deny', function(event) {
    event.preventDefault();
    var requestID = $(this).parent().attr('request-id');

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();
    
    // delete the request
    deleteRequest(requestID, function() {
        showRequests();
    });

});

// delete request
var deleteRequest = function(id, callback) {
    $.ajax({
        url: '/requests/' + id,
        type: 'DELETE'
    }).done(function(response) {
        callback();
    }).fail(function(error) {
        handleError(error);
    });
}

// create a new request from the logged in user to a specified id
var createRequest = function(toId, callback) {
    $.post(
        '/requests',
        { toId: toId }
    ).done(function(response) {
        callback(response);
    }).fail(function(error) {
        handleError(error);
    });
}

// refetch all requests to/from user and display them
var showRequests = function() {
    switchActive('#requests');

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    var requestsToUser = [];
    var requestsFromUser = [];

    // get logged in user
    getUser(user_id, function(user) {
        // if user not available, don't show any requests
        if (!user.available) {
            $('#content').html(Handlebars.templates['requests']({
                requestsToUser: requestsToUser,
                requestsFromUser: requestsFromUser
            }));
            return;
        }

        // get requests to and from
        user.getRequests(function(err, reqs) {
            requestsToUser = reqs.requestsTo;
            requestsFromUser = reqs.requestsFrom;

            $('#content').html(Handlebars.templates['requests']({
                requestsToUser: requestsToUser,
                requestsFromUser: requestsFromUser
            }));

        });
    });

}
