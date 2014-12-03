/** 
 * Author: Rujia
 */

$(document).on('click', '#requests:not(.active) a', function(event) {
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    showRequests();
});

var modifyRequest = function(creator_id, receiver_id, operation, callback) {
    var params = {};
    switch(operation) {
        case 'cancel':
            if (self_id !== creator_id) return showLogin();
            params.cancel = true;
            break;
        case 'accept':
            if (self_id !== receiver_id) return showLogin();
            params.accept = true;
            break;
        case 'deny':
            if (self_id !== receiver_id) return showLogin();
            params.deny = true;
            break;
        default:
            callback('No operation specified');
            break;
    }
    $.ajax({
        url: '/users/' + creator_id + '/requests/to/' + receiver_id,
        type: 'PUT',
        data: params
    }).done(function(response) {
        callback(undefined);
    }).fail(function(error) {
        callback(error);
        handleError(error);
    });
}

// click cancel request
$(document).on('click', '.cancel', function(event) {
    event.preventDefault();
    var receiver_id = $(this).parent().attr('user-id');

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();
    
    //Cancel request from user to receiver and to all of receiver's roommates
    modifyRequest(user_id, receiver_id, 'cancel', function(err) {
        if (err) return handleError(res, 500, 'Something went wrong');
        showRequests();
    })
});

// click deny
$(document).on('click', '.deny', function(event) {
    event.preventDefault();
    var creator_id = $(this).parent().attr('user-id');

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();
    
    //Accept request from creator to user, and add creator to user's roommates if all of user's other roommates have already accepted
    modifyRequest(creator_id, user_id, 'deny', function(err) {
        if (err) return handleError(res, 500, 'Something went wrong');
        showRequests();
    })
});

// click confirm, remove the request and make the users roommates (as well as unavailable)
$(document).on('click', '.confirm', function(event) {
    event.preventDefault();
    var creator_id = $(this).parent().attr('user-id');

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    modifyRequest(creator_id, user_id, 'accept', function(err) {
        if (err) return handleError(res, 500, 'Something went wrong');
        showRequests();
    })
    
});

// create new requests regarding the user with userId
// fromIds: array of ids of users requesting the user with userId
// toIds: array of ids of user the user with userId wants to request
var createRequest = function(user_id, receiver_id, callback) {
    $.ajax({
        url: '/users/' + user_id + '/requests/to/' + receiver_id,
        type: 'POST',
        data: {}
    }).done(function(response) {
        callback(undefined);
    }).fail(function(error) {
        handleError(error);
    });
}

// get all requests to/from a user
var getRequest = function(userId, callback) {
    $.get(
        '/users/' + userId + '/requests/'
    ).done(function(response) {
        callback(response);
    }).fail(function(error) {
        handleError(error);
    });
}

//get requests from a user to a list of specified users
var getRequestsTo = function(userId, to, callback) {
    getRequest(userId, function(res){
        var requestsFrom = res.requestsFrom;

        requestsFrom = requestsFrom.filter(function(elem) {
            return to.indexOf(elem.to._id) > -1;
        });

        callback(requestsFrom);
    });
}

// gets request to a certain id (undefined if none exist)
var getRequestTo = function(to, requests) {
    var result = requests.filter(function(request) {
        return request.to === to;
    });

    if (!result.length) return undefined;
    return result[0];
}

// refetch all requests to/from user and display them
var showRequests = function() {
    switchActive('#requests');

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    $.ajax({
        url: '/users/' + user_id + '/requests/',
        type: 'GET'
    }).done(function(response) {
        $('#content').html(Handlebars.templates['requests']({
            requestsToUser: response.requestsTo,
            requestsFromUser: response.requestsFrom,
            showName: true
        }));
    }).fail(function(error) {
        handleError(error);
    });
}
