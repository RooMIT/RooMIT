var loggedInUser = undefined;

// replace the login form with the register form
$(document).on('click', '#toggle-register', function(event) {
    clearMainDiv();
    $('#main').append(Handlebars.templates['register']);
    attachValidators();
});

// replace the register form with the login form
$(document).on('click', '#toggle-login', function(event) {
    clearMainDiv();
    $('#main').append(Handlebars.templates['login']);
    attachValidators();
});

// submit login
$(document).on('click', '#submit-login', function(event) {
    event.preventDefault();
    removeError(); // remove previous errors
    var email = $('#email').val();
    var password = $('#password').val();

    // ensure nonempty fields
    if (email == '') return handleError('Please enter an email');
    if (password == '') return handleError('Please enter a password');

    $.post(
        '/login',
        { email: email, password: password }
    ).done(function(response) {
        loggedInUser = response.user;
        showUserProfile(loggedInUser, loggedInUser);

    }).fail(function(error) {
        if (error.status == 404) {
            handleError('Please create an account')
        } else {
            handleError(error);
        }
    });

});

// submit register
$(document).on('click', '#submit-register', function(event) {
    event.preventDefault();
    removeError(); // remove previous errors
    var name = $('#name').val();
    var email = $('#email').val();
    var password = $('#password').val();

    // ensure nonempty fields
    if (name == '') return handleError('Please enter a name');
    if (email == '') return handleError('Please enter an email');
    if (password == '') return handleError('Please enter a password');
    
    $.post(
        '/users',
        { name: name, email: email, password: password }

    ).done(function(response) {
        loggedInUser = response.user;
        showUserProfile(loggedInUser, loggedInUser);

    }).fail(function(error) {
        if (error.status == 409) {
            handleError('Email already in use');
        } else {
            handleError(error);
        }
    });
});

// show a user's profile
showUserProfile = function(user, loggedInUser) {
    clearMainDiv();
    $('#main').append(Handlebars.templates['profile']({
       user: user,
       loggedInUser: loggedInUser
    }));
}


// attach bootstrap validators to the login/register form on the page
attachValidators = function(){
    $('.login-form').bootstrapValidator({
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {
            name: {
                validators: {
                    regexp: {
                        regexp: /^[a-z\s]+$/i,
                        message: 'The name can consist of alphabetical characters and spaces only'
                    }
                }
            },
            email: {
                validators: {
                    regexp: {
                        regexp: /^[A-Z0-9._%+-]+@mit.edu$/i,
                        message: 'We only accept MIT email addresses'
                    }
                }
            },
            password: {
                validators: {
                    regexp: {
                        regexp: /^(?=\s*\S).*$/i,
                        message: 'Password cannot be empty'
                    }
                }
            }
        }
    });
}