/**
 * Authors: Rujia Zha
 */

$.ajaxPrefilter(function(options, _, xhr) {
    if (!xhr.crossDomain) {
        var token = $('meta[name="csrf-token"]').attr('content');
        xhr.setRequestHeader('X-CSRF-Token', token);
    }
});

var userId;
var email = randomString() + '@mit.edu';
var name = 'testuser';

(function() {
    var connectionString = 'http://localhost:8080/';

    asyncTest('creating a user', function() {
        $.post(
            '/users',
            { name: name, email: email, password: 'asdfjkl;' }
        ).done(function(response) {
            var user = response.user;
            ok(user.name === name);
            ok(user.email === email);
            ok(user.preferences.length);
            ok(user.available);
            ok(user.group === undefined);
            userId = user._id;
            start();
        }).fail(function(error) {
            console.log('Test failed with error : ' + error);
        });
    });


    asyncTest('logging in a user', function() {
        $.post(
            '/login',
            { email: email, password: 'asdfjkl;' }
        ).done(function(response) {
            var user = response.user;
            ok(user.name === name);
            ok(user.email === email);
            ok(user._id === userId)
            start();
        }).fail(function(error) {
            console.log('Test failed with error : ' + error);
        });
    });

    asyncTest('logging out user', function() {
        $.post(
            '/logout'
        ).done(function(response) {
            ok(response.success);
            start();
        }).fail(function(error) {
            console.log('Test failed with error : ' + error);
        });
    });

    asyncTest('getting a user', function() {
        $.get(
            '/users/' + userId
        ).done(function(response) {
            var user = response.user;
            ok(user.name === name);
            ok(user.email === email);
            ok(user._id === userId)
            start();
        }).fail(function(error) {
            console.log('Test failed with error : ' + error);
        });
    });

    // TEST MATCHES?

    asyncTest('modify preferences', function() {
        $.get(
            '/users/' + userId
        ).done(function(response) {
            var user = response.user;
            var preference = user.preferences[0];
            
            asyncTest('modify preferences', function() {
            $.ajax({
                url: '/requests/',
                type: 'DELETE', 
                data: {deleteRequests: deleteRequests.toString()}
            }).done(function(response) {
                callback();
            }).fail(function(error) {
                console.log('Test failed with error : ' + error);
            });
    });


        }).fail(function(error) {
            console.log('Test failed with error : ' + error);
        });
    });

})();

// returns a random 10 character string
function randomString() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i=0; i < 10; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}