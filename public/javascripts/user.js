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

    // create the request
    createRequest(user_id, [], [roommateId], function() {
        // if person has roommates, then also send requests to person's roommates. 
        getRoommates(roommateId, function(res){
            var roommates = res.roommates.map(function(elem) {
                return elem._id;
            });
            if (!roommates.length) showUserProfile(user_id); // refresh the view
            else {
                createRequest(user_id, [], roommates, function() {
                    showUserProfile(user_id);
                });
            }
        });
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

// Updates the preference on a click
$(document).on('click', '.preference-radio-inline', function(event) {
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    var input = this.getElementsByTagName('input')[0];
    var id = input.className;
    var answer = input.value;
    var desc = this.prev('.space').innerHTML;

    $.ajax({
        url: '/preferences/' + id,
        type: 'PUT',
        data: {description: desc,  response: answer}
    }).done(function(response) {
        // update the ui accodingly
        $('.'+id).each(function() {
            if (this.value !== answer){
                $(this).prop('checked', false);
            }
        });
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

Handlebars.registerPartial('preference', Handlebars.templates['preference']);

// show a user's profile
// TODO: make profile and my-profile one thing
var showUserProfile = function(userId) {
    var loggedInUserID = $.cookie('user');
    if (!loggedInUserID) return showLogin();

    // get the most updated info
    getUser(userId, function(res) {
        var user = res.user;

        // get roommates
        getRoommates(user._id, function(res2) {
            user.roommates = res2.roommates;

            // if user is current user, show personal profile
            if (userId === loggedInUserID) {
                $('#content').html(Handlebars.templates['my-profile']({
                    hasRoommates: user.roommates.length > 0,
                    user: user
                }));

            } else {
                // else show visitor profile
                $('li').removeClass('active');
                // TODO get whether or not the logged in user has requested this dude
                // var requested = loggedInUser.requested.indexOf(user._id) > -1;
                var areRoommates = user.group === loggedInUser.group;
                
                $('#content').html(Handlebars.templates['profile']({
                   user: user,
                   requested: false, 
                   areRoommates: areRoommates
                }));
            }

        });

    });
}
