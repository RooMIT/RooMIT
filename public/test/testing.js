/**
 * Authors: Rujia Zha
 */

(function() {
  var connectionString = 'http://localhost:8080/';

  
  asyncTest('creating a user again', function() {
    $.post(
        '/users',
        { name: 'testuser', email: 'testuser@mit.edu', password: 'asdfjkl;' }
    ).done(function(response) {
        ok(false);
    }).fail(function(error) {
        ok(true);
        console.log('Test failed with error : ' + error);
        start();
    });
  });
  

  asyncTest('logging in a user', function() {
    $.post(
        '/login',
        { email: 'rujiazha@mit.edu', password: 'asdfjkl;' }
    ).done(function(response) {
        var user = response.user;
        $.cookie('user', user._id);
        ok(user);
        start();

    }).fail(function(error) {
        console.log('Test failed with error : ' + error);
    });
  });

  /*
  asyncTest('getting all users', function() {
    $.get(
        '/users'
    ).done(function(response) {
        console.log(response.users);
        ok(response.users);
        start();
    }).fail(function(error) {
        console.log('Test failed with error : ' + error);
    });
  });  */
  
  

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

})();