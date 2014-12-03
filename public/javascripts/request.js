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
    var requestedUserID = $(this).parent().attr('user-id'); 

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    // delete the request (and also delete requests to self's roommates)
    deleteRequest(requestID, function() {
        //check if person has roommates
            //if yes, then remove requests to person's roommates
        getUser(requestedUserID, function(res){
            var user = res.user
            getRoommates(user, function(roommates) {
                if (!roommates.length) showRequests();
                else {
                    var roommateIDs = roommates.map(function(elem){
                        return elem._id;
                    });
                    getRequestsTo(user_id, roommateIDs, function(requests){
                        if (!requests.length) showRequests();
                        else {
                            deleteRequest(requests, function(){
                                showRequests();
                            });
                        }
                    });
                }
            });
        });
    });
});

// click deny
$(document).on('click', '.deny', function(event) {
    event.preventDefault();
    var request_id = $(this).parent().attr('request-id');
    var requesting_user_id = $(this).parent().attr('user-id'); 
    
    //delete request from requesting user to self. also deletes all requests from requesting user to self's roommates
    rejectRequest(requesting_user_id, function(err) {
        if (err) return handleError(err);
        showRequests();
    });
});

var confirmRequest = function(creator_id, callback) {
    User.
}

// click confirm, remove the request and make the users roommates (as well as unavailable)
$(document).on('click', '.confirm', function(event) {
    event.preventDefault();
    var requestID = $(this).parent().attr('request-id');
    var requestingUserID = $(this).parent().attr('user-id');

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    // delete the request
    deleteRequest(requestID, function() {

        // check if user has group 
            //if yes, then check if user's group has accepted, as in if there are any more requests from 
            //person to user's roommates
                //if there are, then do not add person to user's group
                //else: add person to user's group
            //if no, check if person has roommates. 
                //if person has roommates, send requests from user to roommates. 
                //else: create group for user and person

        // NOTE: if user got this new roommate, then add requests to user to requests to user's new roommate,
        // and add requests to new roommate to requests to user and roommates. 
        getUser(user_id, function(res) {
            var user = res.user;
            getRoommates(user, function(roommates) {
                if (!roommates.length) {
                    getUser(requestingUserID, function(res) {
                        var user = res.user;
                        getRoommates(user, function(roommates) {
                            if (!roommates.length) {
                                //make group for user and person
                                addRoommate(user_id, requestingUserID, function() {
                                    showRequests();
                                });
                            }
                            else {
                                var roommateIDs = roommates.map(function(elem){
                                    return elem._id;
                                });
                                //send requests from user to roommates 
                                createRequest(user_id, [], roommateIDs, function(){
                                    showRequests();
                                });
                            }
                        });
                    });
                }
                else {
                    var roommateIDs = roommates.map(function(elem) {
                        return elem._id;
                    });
                    getRequestsTo(requestingUserID, roommateIDs, function(requests){
                        if (!requests.length) showRequests();
                        else {
                            //add requestingUserID to user's group
                            addRoommate(user_id, requestingUserID, function(){
                                //add {requests to user} to {requests to user's new roommate}, and add 
                                //{requests to new roommate} to {requests to user and roommates}.
                                getRequest(user_id, function(res){
                                    var requestsTo = res.requestsTo;

                                    //list of ids of users that have sent requests to logged in user
                                    var requestsToUser = requestsTo.map(function(elem) {
                                        return elem.from._id;
                                    });
                                    //create requests from these users to requestingUserID
                                    createRequest(requestingUserID, requestsToUser, [] , function(){
                                        getRequest(requestingUserID, function(res) {
                                            var requestsTo = res.requestsTo;

                                            //list of ids of users that requested new roommate
                                            var requestsToNewRoommate = requestsTo.map(function(elem) {
                                                return elem.from._id;
                                            });
                                            //create requests from these users to the user and existing roommates
                                            createRequest(user_id, requestsToNewRoommate, [], function(){
                                                createRequest(roommateIDs[0], requestsToNewRoommate, [], function(){
                                                    if (!roommateIDs[1]) showRequests();
                                                    else {
                                                        createRequest(roommateIDs[1], requestsToNewRoommate, [], function(){
                                                            showRequests();
                                                        });
                                                    }
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    });
                }
            });
        });
    });
});

var rejectRequest = function(from_id, callback) {
    var self_id = $.cookie('user');
    if (!self_id) return showLogin();
    $.ajax({
        url: '/users/' + from_id + '/requests/to/' + self_id,
        type: 'DELETE'
    }).done(function(response) {
        callback(undefined);
    }).fail(function(error) {
        callback(error);
        handleError(error);
    });
}

var confirmRequest = function(from_id, callback) {

}
// delete requests
// deleteRequests: list of request id to be deleted
var deleteRequest = function(deleteRequests, callback) {
    $.ajax({
        url: '/requests/',
        type: 'DELETE', 
        data: {deleteRequests: deleteRequests.toString()}
    }).done(function(response) {
        callback();
    }).fail(function(error) {
        handleError(error);
    });
}

// create new requests regarding the user with userId
// fromIds: array of ids of users requesting the user with userId
// toIds: array of ids of user the user with userId wants to request
var createRequest = function(userId, fromIds, toIds, callback) {
    $.post(
        '/users/' + userId + '/requests/',
        { to: toIds.toString() , from: fromIds.toString()}
    ).done(function(response) {
        callback(response);
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

    var requestsToUser = [];
    var requestsFromUser = [];

    // get logged in user
    getUser(user_id, function(res) {
        var user = res.user;
        // if user not available, don't show any requests
        if (!user.available) {
            $('#content').html(Handlebars.templates['requests']({
                requestsToUser: requestsToUser,
                requestsFromUser: requestsFromUser,
                showName: true
            }));
            return;
        }
        
        // fetch requests
        getRequest(user_id, function(result) {

            $('#content').html(Handlebars.templates['requests']({
                requestsToUser: result.requestsTo,
                requestsFromUser: result.requestsFrom,
                showName: true
            }));
        });

    });

}
