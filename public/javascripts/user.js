// click profile
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

    var userID = $.cookie('user');
    if (!userID) return showLogin();
    
    updateUser(userID, {available: available}, function(){
        console.log('updated availability');
        // swap which is selected in the UI
        $('#available-group .btn-primary').removeClass('btn-primary').addClass('btn-default');
        $(this).removeClass('btn-default').addClass('btn-primary');
        getUser(userID, function(user){
            showUserProfile(user);
        });
    });

});

// click on link to a user's profile
$(document).on('click', '.user-profile', function(event) {
    event.preventDefault();
    var id = $(this).attr('user-id');
    getUser(id, function(user){
        showUserProfile(user);
    });
});

// click request roommate
$(document).on('click', '.request-roommate', function(event) {
    var roommateId = $(this).val();
    var userID = $.cookie('user');
    if (!user_id) return showLogin();

    getUser(userID, function(user){
        var newRequested = user.requested;
        newRequested.push(roommateId);

        updateUser(userID, {requested: newRequested.toString()}, function(){
            console.log("request sent");
        });
    });

    $(this).html('Request Sent');
    $(this).addClass('disabled');

});

//click cancel roommate
$(document).on('click', '.cancel-roommate', function(event) {
    var roommateId = $(this).val();
    var userID = $.cookie('user');
    if (!user_id) return showLogin();

    getUser(userID, function(user){
        var newRoommates = user.roommates;
        var index = newRoommates.indexOf(roommateId);
        newRoommates.splice(index, 1);

        updateUser(userID, {roommates: JSON.stringify(newRoommates)}, function(){
            console.log("roommate canceled");
            getUser(roommateId, function(roommate) {
                var newRoommates = roommate.roommates;
                var index = newRoommates.indexOf(userID);
                newRoommates.splice(index, 1);

                updateUser(roommateId, {roommates: newRoommates.toString()}, function(){
                    console.log("roommate canceled");
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
    $.post(
        '/preferences/' + id,
        { response: answer }
    ).done(function(response) {
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
    
// get requested users
var getRequested = function(id, callback) {
    $.get(
        '/users/' + id + '/requested'
    ).done(function(response) {
        callback(response);
    }).fail(function(error) {
        handleError(error);
    });
}

// get roommates
var getRoommates = function(id, callback) {
    $.get(
        '/users/' + id + '/roommates'
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

// update the user data in the database
var updateUser = function(id, fields, callback) {
    $.post(
        '/users/' + id,
        fields
    ).done(function(response) {
        callback();

    }).fail(function(error) {
        handleError(error);
    });
}

Handlebars.registerPartial('preference', Handlebars.templates['preference']);

// show a user's profile
var showUserProfile = function(user) {
    var loggedInUserID = $.cookie('user');
    if (!loggedInUserID) return showLogin();

    // if user is current user, show personal profile
    if (user._id === loggedInUserID) {
        switchActive('#profile');

        $('#content').html(Handlebars.templates['my-profile']({
           user: user
        }));
    } 
    //else show visitor profile
    else {
        $('li').removeClass('active');
        // get logged in user
        getUser(loggedInUserID, function(loggedInUser) {
            getRoommates(user._id, function(res) {
                var roommates = res.users;
                var requested = loggedInUser.requested.indexOf(user._id) > -1;
                var areRoommates = user.roommates.indexOf(loggedInUserID) > -1;
                $('#content').html(Handlebars.templates['profile']({
                   user: user, roommates: roommates, requested: requested, areRoommates: areRoommates
                }));
            })
        });
    }
}
