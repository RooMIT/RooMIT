// click the not-selected button for availability
$(document).on('click', '#available-group .btn-default', function(event) {
    var available = $(this).attr('id') == 'available';

    // TODO: get id
    // updateUser(userId, { available : available }, function() {
    //     // swap which is selected in the UI
        // $('#available-group .btn-primary').removeClass('btn-primary').addClass('btn-default');
        // $(this).removeClass('btn-default').addClass('btn-primary');
    // });
});

// click request roommate
$(document).on('click', '#request-roommate.btn-primary', function(event) {
    var roommateId = $(this).attr('user');

    // TODO: get id
    // updateUser(roommateId, { requests: userId }, function() {
        // $(this).html('Request Sent');
        // $(this).addClass('disabled');
    // });
});

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

// show a user's profile
showUserProfile = function(user, loggedInUser) {
    switchActive('#profile');

    // TODO: this is super jank
    if (user._id == loggedInUser._id) {
        $('#content').html(Handlebars.templates['my-profile']({
           user: user
        }));
    } else {
        var requested = user.requested.indexOf(loggedInUser._id) > -1
        $('#content').html(Handlebars.templates['profile']({
           user: user,
           requested: requested
        }));
    }
}
