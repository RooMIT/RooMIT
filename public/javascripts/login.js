/** 
 * Author: Olga
 */

Handlebars.registerHelper('checked', function(label, response) {
    if (label == response) {
        return 'checked: checked';
    }

    return '';
});

// set the CSRF token in each request
$.ajaxPrefilter(function(options, _, xhr) {
    if (!xhr.crossDomain) {
        var token = $('meta[name="csrf-token"]').attr('content');
        xhr.setRequestHeader('X-CSRF-Token', token);
    }
});

// on first load, show either the logged in user's profile
// or the login screen
$(document).ready(function() { 

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    // user logged in
    $('#main').html(Handlebars.templates['main']);
    showUserProfile(user_id);

});

// replace the login form with the register form
$(document).on('click', '#toggle-register', function(event) {
    showRegister();
});

// replace the register form with the login form
$(document).on('click', '#toggle-login', function(event) {
    showLogin();
});

// on enter, submit login
$(document).on('keypress', '#login-form', function (event) {
    if (event.which == 13) { // enter
        event.preventDefault();
        login();
    }
});

// on enter, submit register
$(document).on('keypress', '#register-form', function (event) {
    if (event.which == 13) { // enter
        event.preventDefault();
        register();
    }
});

// submit login
$(document).on('click', '#submit-login', function(event) {
    event.preventDefault();
    login();
});

// submit register
$(document).on('click', '#submit-register', function(event) {
    event.preventDefault();
    register();
});

// logout
$(document).on('click', '#logout', function(event) {
    event.preventDefault();

    $.post(
        '/logout'

    ).done(function(response) {
        $.removeCookie('user');
        showLogin();
    }).fail(function(error) {
        handleError(error);
    });
});

// show the login screen
var showLogin = function() {
    $('#main').html(Handlebars.templates['login']);
    attachValidators();
}

// show the register screen
var showRegister = function() {
    $('#main').html(Handlebars.templates['register']);
    attachValidators();
}

// log in the user
var login = function() {
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
        var user = response.user;
        $.cookie('user', user._id);
        $('#main').html(Handlebars.templates['main']);
        showUserProfile(user._id);

    }).fail(function(error) {
        handleError(error);
    });
}

//register a user
var register = function() {
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
        var user = response.user;
        $.cookie('user', user._id);
        $('#main').html(Handlebars.templates['main']);
        showUserProfile(user._id);
    }).fail(function(error) {
        handleError(error);
    });
}

// attach bootstrap validators to the login/register form on the page
var attachValidators = function(){
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