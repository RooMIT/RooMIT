/**
 * Authors: Alec, Olga, Peinan, Rujia
 */
$(document).on('click', '#profile:not(.active) a', function(event) {
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();
    
    getUser(user_id, function(user) {
        showUserProfile(user);
    });
});

// click the not-selected button for availability
$(document).on('click', '#available-group .btn-default', function(event) {
    var available = ($(this).attr('id') === 'available');

    var user_id = $.cookie('user');
    if (!user_id) return showLogin();
    
    updateUser(user_id, {available: available}, function() {
        // swap which is selected in the UI
        $('#available-group .btn-primary').removeClass('btn-primary').addClass('btn-default');
        $(this).removeClass('btn-default').addClass('btn-primary');
        getUser(user_id, function(user){
            showUserProfile(user);
        });
    });

});

// click on link to a user's profile
$(document).on('click', '.user-profile', function(event) {
    event.preventDefault();
    var id = $(this).attr('value');
    getUser(id, function(user){
        showUserProfile(user);
    });
});

// click request roommate
$(document).on('click', '.request-roommate', function(event) {
    var button = $(this);
    var roommateId = button.attr('value');
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    // create the request
    createRequest(roommateId, function() {
        //TODO: if person has roommates, then also send requests to person's roommates. 
        button.removeClass('request-roommate').addClass('disabled');
        button.html('Request Sent');
    });

});

// TODO: fix this
// you should only be able to remove yourself from group. Also adjust requests. 
    //Easiest design choice: just keep requests the way they are.

// click delete roommate, deletes roomates from both, makes availability for both true
$(document).on('click', '.delete-roommate', function(event) {
    var roommateId = $(this).attr('value');
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    // delete the roommate from the user
    getUser(user_id, function(user){
        var newRoommates = user.roommates;
        var index = newRoommates.indexOf(roommateId);
        newRoommates.splice(index, 1);

        updateUser(user_id, {roommates: JSON.stringify(newRoommates), available: 'True'}, function(){
            
            // delete the user from the roommate
            getUser(roommateId, function(roommate) {
                var newRoommates = roommate.roommates;
                var index = newRoommates.indexOf(user_id);
                newRoommates.splice(index, 1);

                updateUser(roommateId, {roommates: JSON.stringify(newRoommates), available: 'True'}, function(){
                    showUserProfile(user);
                });
            });
        });
    });

});

// Updates the preference on a click
$(document).on('click', '.preference-radio-inline', function(event) {
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
        callback(response.user);
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

// update the user's availability
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

//get ids of roommates of user
var getRoommateIDs = function(user, callback) {
    if (user.group != undefined) {
        var userGroup = user.group; 
        getAll(function(res){
            var users = res.users;
            var roommateIDs = [];
            for (var i = 0; i < users.length; i++){
                if (users[i].group === userGroup && users[i]._id !== user._id) {
                    roommateIDs.push(users[i]._id); 
                }
            }
            callback(roommateIDs);
        });
    }
    else {
        callback([]);
    }
}

Handlebars.registerPartial('preference', Handlebars.templates['preference']);

// show a user's profile
var showUserProfile = function(user) {
    var loggedInUserID = $.cookie('user');
    if (!loggedInUserID) return showLogin();

    // if user is current user, show personal profile
    if (user._id === loggedInUserID) {
        switchActive('#profile');

        // TODO: this will not get roommates
        $('#content').html(Handlebars.templates['my-profile']({
           user: user
        }));
    } 
    // else show visitor profile
    else {
        $('li').removeClass('active');
        // get logged in user
        getUser(loggedInUserID, function(loggedInUser) {
            loggedInUser.getRoommates(function(err, users) {
                var roommates = users;
                // TODO get whether or not the logged in user has requested this dude
                // var requested = loggedInUser.requested.indexOf(user._id) > -1;
                var areRoommates = user.group === loggedInUser.group;
                
                $('#content').html(Handlebars.templates['profile']({
                   user: user, 
                   roommates: roommates, 
                   requested: false, 
                   areRoommates: areRoommates
                }));
            })
        });
    }
}
