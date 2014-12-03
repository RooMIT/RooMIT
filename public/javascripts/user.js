/**
 * Authors: Alec, Olga, Peinan, Rujia
 */
$(document).on('click', '#profile:not(.active) a', function(event) {
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();
    
    showUserProfile(user_id);
});

// click the not-selected button for availability
$(document).on('click', '#available-group .btn-default', function(event) {
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    var available = ($(this).attr('id') === 'available');
    
    updateUser(user_id, {available: available}, function() {
        showUserProfile(user_id);
    });

});

// click on link to a user's profile
$(document).on('click', '.user-profile', function(event) {
    event.preventDefault();
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    var id = $(this).attr('value');
    showUserProfile(id);
});

// click request roommate
$(document).on('click', '.request-roommate', function(event) {
    var button = $(this);
    var roommateId = button.attr('value');
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    $.ajax({
        url: '/users/'+ user_id + '/requests/to/' + roommateId,
        type: 'POST'
    }).done(function(response) {
        // update the ui accodingly
        showUserProfile(user_id);
    }).fail(function(error) {
        handleError(error);
    });
});

// click leave group, removes the user from the group
$(document).on('click', '.leave-group', function(event) {
    var roommateId = $(this).attr('value');
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    // delete the roommate from the user, this makes them available
    updateUser(user_id, { leaveGroup: true }, function() {
        showUserProfile(user);
    });

});

/*
// Updates the preference on a click
$(document).on('click', '.preference-radio-inline', function(event) {
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    var input = this.getElementsByTagName('input')[0];
    var id = input.className;
    var answer = input.value;
    var desc = $('.'+id).parent().prev('.space').html();

    $.ajax({
        url: '/preferences/' + id,
        type: 'PUT',
        data: {description: desc,  response: answer}
    }).done(function(response) {
        // update the ui accodingly
        showUserProfile(user_id);
    }).fail(function(error) {
        handleError(error);
    });
}); */

// Updates the preference on a click
$(document).on('click', '.preference', function(event) {

    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    var id = $(this).attr('id');
    var answer = $(this).attr('value');
    var desc = $(this).parent().prev('.space').html();

    $.ajax({
        url: '/preferences/' + id,
        type: 'PUT',
        data: {description: desc,  response: answer}
    }).done(function(response) {
        // update the ui accodingly
        showUserProfile(user_id);
    }).fail(function(error) {
        handleError(error);
    });  
});

// get a user 
var getUser = function(id, callback) {
    $.get(
        '/users/' + id
    ).done(function(response) {
        callback(response);
    }).fail(function(error) {
        handleError(error);
    });
}

// get all users
var getAll = function(callback) {
    $.get(
        '/users'
    ).done(function(response) {
        callback(response);
    }).fail(function(error) {
        handleError(error);
    });
}

// update the user's availability or group
// fields should have either availability or leaveGroup (true or false)
var updateUser = function(id, fields, callback) {
    $.ajax({
        url: '/users/' + id,
        type: 'PUT',
        data: fields
    }).done(function(response) {
        callback();

    }).fail(function(error) {
        handleError(error);
    });
}

// adds a roommate to the user
var addRoommate = function(id, roommateId, callback) {
    $.ajax({
        url: '/users/' + id + '/roommates',
        type: 'PUT',
        data: { roommateId: roommateId }
    }).done(function(response) {
        callback();

    }).fail(function(error) {
        handleError(error);
    });
}

// get roommates of a user
var getRoommates = function(userId, callback) {
    $.get(
        '/users/' + userId + '/roommates'
    ).done(function(response) {
        callback(response);
    }).fail(function(error) {
        handleError(error);
    });
}

// get the user object with roommates and requests
var getPopulatedUser = function(userId, callback) {
    getUser(userId, function(res) {
        var user = res.user;

        getRoommates(userId, function(res2) {
            user.roommates = res2.roommates;

            getRequest(userId, function(res3) {
                user.requestsTo = res3.requestsTo;
                user.requestsFrom = res3.requestsFrom;
                callback(user);
            });

        });

    });
}

Handlebars.registerPartial('preference', Handlebars.templates['preference']);
Handlebars.registerPartial('request-to-user', Handlebars.templates['request-to-user']);
Handlebars.registerPartial('request-from-user', Handlebars.templates['request-from-user']);

// show a user's profile
// TODO: make profile and my-profile one thing
var showUserProfile = function(userId) {
    var loggedInUserID = $.cookie('user');
    if (!loggedInUserID) return showLogin();

    // get the most updated info
    getPopulatedUser(userId, function(user) {
        // if user is current user, show personal profile
        if (userId === loggedInUserID) {
            switchActive('#profile');
            $('#content').html(Handlebars.templates['my-profile']({
                hasRoommates: user.roommates.length > 0,
                user: user
            }));

            return;
        }

        // else show visitor profile
        getPopulatedUser(loggedInUserID, function(loggedInUser) {
            $('li').removeClass('active');
            var areRoommates = user.group !== undefined && user.group === loggedInUser.group;
            
            $('#content').html(Handlebars.templates['profile']({
               user: user,
               areRoommates: areRoommates
            }));

            handleRequestBox(user, loggedInUser);
        });
    });
}

// add the correct request button (accept/deny, cancel, or request)
var handleRequestBox = function(user, loggedInUser) {
    var yourRequest = getRequestTo(user._id, loggedInUser.requestsFrom);
    var usersRequest = getRequestTo(loggedInUser._id, user.requestsFrom);

    // if you requested the user, show a cancel request button
    if (yourRequest) {
        $('#request-box').html(Handlebars.templates['request-from-user']({
           request: yourRequest,
           from: user,
           to: loggedInUser
        }));
        return;
    }

    // the user requested you, show accept/deny
    if (usersRequest) {
        $('#request-box').html(Handlebars.templates['request-to-user']({
           request: usersRequest,
           to: loggedInUser,
           from: user
        }));
        return;
    } 

    // just show request button
    $('#request-box').html(Handlebars.templates['request-button']({
       user: user
    }));

}
