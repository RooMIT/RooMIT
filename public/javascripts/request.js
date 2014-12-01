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

    // delete the request
    deleteRequest(requestID, function() {
        //TODO: check if person has roommates
            //if yes, then remove requests to person's roommates
        getUser(requestedUserID, function(user){
            getRoommmateIDs(user, function(roommateIDs) {
                if (roommateIDs.length === 0) showRequests();
                else {
                    getRequests(user_id, roommateIDs, function(requests){
                        if (requests.length === 0) showRequests();
                        else {
                            var index = 0;
                            var recurseDelete = function(){
                                if (index < requests.length-1) {
                                    index++;
                                    deleteRequest(requests[index]);
                                }
                                else {
                                    showRequests();
                                }
                            });
                            deleteRequest(requests[index], recurseDelete);
                        }
                    });
                }
            });
        });
        //added frontend functions to: 
            //get roommate id's
            //(get requests from id, to group of id's)
            //delete list of requests
    });
});

// click deny
$(document).on('click', '.deny', function(event) {
    event.preventDefault();
    var requestID = $(this).parent().attr('request-id');
    var requestingUserID = $(this).parent().attr('user-id'); 

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();
    
    // delete the request
    deleteRequest(requestID, function() {
        //check if user has group 
            //if yes, then remove all requests from person to user's roommates
            //else nothing
        getUser(user_id, function(user) {
            getRoommmateIDs(user, function(roommateIDs) {
                if (roommateIDs.length === 0) showRequests();
                else {
                    getRequests(requestingUserID, roommateIDs, function(requests) {
                        if (requests.length === 0) showRequests();
                        else {
                            var index = 0;
                            var recurseDelete = function(){
                                if (index < requests.length-1) {
                                    index++;
                                    deleteRequest(requests[index]);
                                }
                                else {
                                    showRequests();
                                }
                            });
                            deleteRequest(requests[index], recurseDelete);
                        }
                    });
                }
            });
        }
    });
});

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
        //SUMMARY OF TODOS:
        // update the user's group: 

        // check if user has group 
            //if yes, then check if user's group has accepted, aka if there are any more requests from person to user's roommates
                //if there are, then do not add person to user's group
                //else: add person to user's group
            //if no, check if person has roommates. 
                //if person has roommates, send requests from user to roommates. 
                //else: create group between user and person

        // NOTE: if user got a new roommate, then add requests to user to requests to user's new roommate, and add 
        //requests to new roommate to requests to user and roommates. 

        getUser(user_id, function(user) {
            getRoommmateIDs(user, function(roommateIDs) {
                if (roommateIDs.length === 0) {
                    //TODO 
                    getUser(requestingUserID, function(user) {
                        getRoommmateIDs(user, function(roommateIDs) {
                            if (roommateIDs.length===0) {
                                //TODO: make group between user and person 
                            }
                            else {
                                //TODO send requests from user to roommates 
                            }
                        });
                    });
                    showRequests();
                }
                else {
                    getRequests(requestingUserID, roommateIDs, function(requests){
                        if (requests.length === 0) showRequests();
                        else {
                            //TODO add requestingUserID to user's group
                            //add requests to user to requests to user's new roommate, and add 
                            //requests to new roommate to requests to user and roommates.
                        }
                    });
                }
            });
        });
    });
    //We need functions to: 
        //get roommate ids
        //get requests from id, to group of id's
        //TODO: create requests from id to group of id's 
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
        '/requests/',
        { toId: toId }
    ).done(function(response) {
        callback(response);
    }).fail(function(error) {
        handleError(error);
    });
}

// get all requests
var getRequestAll = function(callback) {
    $.get(
        '/requests/'
    ).done(function(response) {
        callback(response);
    }).fail(function(error) {
        handleError(error);
    });
}

var getRequests = function(from, to, callback) {
    getRequestsAll(function(res){
        var requests = res.requests;
        var newRequests = [];
        for (var i = 0; i<requests.length; i++){
            if (requests[i].from === from && to.indexOf(requests[i].to) > -1 ) {
                newRequests.push(requests[i]._id);
            }
        }
        callback(newRequests);
    });
}

// refetch all requests to/from user and display them
//TODO: fix. getRequests no longer exists. 
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
