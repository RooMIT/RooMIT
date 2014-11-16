// click the not-selected button for availability
$(document).on('click', '#available-group .btn-default', function(event) {
    var available = ($(this).attr('id') === 'available');

    // TODO: get id
    // updateUser(userId, { available : available }, function() {
    //     // swap which is selected in the UI
        // $('#available-group .btn-primary').removeClass('btn-primary').addClass('btn-default');
        // $(this).removeClass('btn-default').addClass('btn-primary');
    // });
});

// click on link to a user's profile
$(document).on('click', '#link', function(event) {
    event.preventDefault();
    var id = $(this).attr('user');
    getUser(id, function(user){
        showUserProfile(user);
    });
});

// click request roommate
$(document).on('click', '#request-roommate.btn-primary', function(event) {
    var roommateId = $(this).attr('user');
    var userID = $.cookie('user');
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
showUserProfile = function(user) {
    var loggedInUserID = $.cookie('user');
    // if user is current user, show personal profile
    if (user._id === loggedInUserID) {
        switchActive('#profile');

        getRoommates(loggedInUserID, function(res) {
            var roommates = res.users; 
            $('#content').html(Handlebars.templates['my-profile']({
               user: user, roommates: roommates
            }));
        });
    } 
    //else show visitor profile
    else {
        $('li').removeClass('active');
        // get logged in user
        getUser(loggedInUserID, function(loggedInUser) {
            getRoommates(user._id, function(res) {
                var roommates = res.users; 
                var requested = loggedInUser.requested.indexOf(user._id) > -1
                $('#content').html(Handlebars.templates['profile']({
                   user: user, roommates: roommates, requested: requested
                }));
            })
        });
    }
}
