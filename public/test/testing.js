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
var userId2;
var email;
var email2;
var name = 'testuser';
var password = 'beans';

(function() {
    var connectionString = 'http://localhost:8080/';

    // create 2 users
    begin(function() {
        email = randomString() + '@mit.edu';
        test('registering a user', function() {
            register(name, email, password, function(response) {
                var user = response.user;
                equal(user.name, name);
                equal(user.email, email);
                ok(user.preferences.length);
                ok(user.available);
                equal(user.group, undefined);
                userId = user._id;
                start();
            });
        });

        email2 = randomString() + '@mit.edu';
        test('registering a user 2', function() {
            register(name, email2, password, function(response) {
                var user = response.user;
                equal(user.name, name);
                equal(user.email, email2);
                ok(user.preferences.length);
                ok(user.available);
                equal(user.group, undefined);
                userId2 = user._id;
                start();
            });
        });
    });
    
    // logout
    done(function() {
        test('logging out user', function() {
            logout(function(response) {
                ok(response.success);
                start();
            });
        });
    });

    asyncTest('logging in a user', function() {
        login(email, password, function(response) {
            var user = response.user;
            equal(user.name, name);
            equal(user.email, email);
            equal(user._id, userId)
            start();
        });
    });

    asyncTest('getting a user', function() {
        getUser(userId, function(response) {
            var user = response.user;
            equal(user.name, name);
            equal(user.email, email);
            equal(user._id, userId)
            start();
        });
    });

    asyncTest('get suggestions', function() {
        getSuggestions(function(response) {
            var suggestions = response.user;
            ok(suggestions);
            start();
        };
    });

    asyncTest('modify preferences', function() {
        getUser(userId, function(response) {
            var user = response.user;
            var preference = user.preferences[0];
            
            modifyPreference(preference._id, 'Yes', function(response) {
                ok(response.success)

                getUser(userId, function(response) {
                    var preference2 = response.user.preferences[0];
                    equal(preference2.response, 'Yes');
                    equal(preference.description, preference2.description);
                    start(); 
                });
            });
        });
    });

    asyncTest('add and remove roommate', function() {
        // both have no roommates
        getBothRoommates(function(roommates1, roommates2) {
            equal(roommates1.length, 0);
            equal(roommates2.length, 0);
                
            makeRoommates(response) {
                ok(response.success)

                // check that they both have each other
                getBothUsers(function(user1, user2) {
                    var group1 = user1.group;
                    var group2 = user2.group;
                    ok(group1 !== undefined); 
                    ok(group2 !== undefined);
                    equal(group1, group2);

                    getBothRoommates(function(roommates1, roommates2) {
                        same(roommates1, [userId2]);
                        same(roommates2, [userId1]);

                        // disband group
                        leaveGroup(userId1, function(response) {
                            ok(response.success);

                            getBothUsers(function(user1, user2) {
                                var group1 = user1.group;
                                var group2 = user2.group;
                                ok(group1 === undefined); 
                                ok(group2 ===  undefined);

                                getBothRoommates(function(roommates1, roommates2) {
                                    same(roommates1, []);
                                    same(roommates2, []);
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    asyncTest('modify availability', function() {
        makeRoommates(response) {
            ok(response.success)

            // check that they are both available
            getBothUsers(function(user1, user2) {
                ok(user1.available); 
                ok(user2.available);

                    // make one unavailable
                    modifyUserAvailability(userId1, false, function(response) {
                        ok(response.success);

                        // both should be unavailable
                        getBothUsers(function(user1, user2) {
                            ok(!user1.available); 
                            ok(!user2.available);

                            // make one available
                            modifyUserAvailability(userId2, true, function(response) {
                                ok(response.success);

                                // both should be available
                                getBothUsers(function(user1, user2) {
                                    ok(user1.available); 
                                    ok(user2.available);

                                    // disband group
                                    leaveGroup(userId1, function(response) {
                                        ok(response.success);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    asyncTest('deny request', function() {
            createRequest(userId, userId2, response) {
                ok(response.success)

                // check that they are both available
                denyRequest(function(user1, user2) {
                    ok(user1.available); 
                    ok(user2.available);

                        // make one unavailable
                        modifyUserAvailability(userId1, false, function(response) {
                            ok(response.success);

                            // both should be unavailable
                            getBothUsers(function(user1, user2) {
                                ok(!user1.available); 
                                ok(!user2.available);

                                // make one available
                                modifyUserAvailability(userId2, true, function(response) {
                                    ok(response.success);

                                    // both should be available
                                    getBothUsers(function(user1, user2) {
                                        ok(user1.available); 
                                        ok(user2.available);

                                        // disband group
                                        leaveGroup(userId1, function(response) {
                                            ok(response.success);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

})();

function makeRoommates(callback) {
    // request and accept
    createRequest(userId, userId2, function(response) {
        acceptRequest(userId, userId2, callback);
    });
}

function getBothUsers(callback) {
    getUser(userId, function(response1) {
        getUser(userId2, function(response2) {
            callback(response1.user, response2.user);
        });
    });
}

function getBothRoommates(callback) {
    getRoommates(userId, function(response1) {
        getRoommates(userId2, function(response2) {
            callback(response1.roommates, response2.roommates);
        });
    });
}

function login(name, email, password, callback) {
    ajax({name: name, email: email, password: password}, '/login/', 'POST', 'Login', callback);
}

function register(email, password, callback) {
    ajax({email: email, password: password}, '/users/', 'POST', 'Register', callback);
}

function logout(callback) {
    ajax({}, '/logout/', 'POST', 'Logout', callback);
}

function getSuggestions(callback) {
    ajax({}, '/suggestions/', 'GET', 'Get suggestions', callback);
}

function leaveGroup(userId, callback) {
    ajax({leaveGroup: true}, '/users/' + userId, 'PUT', 'Leave group', callback);
}

function modifyUserAvailability(userId, available, callback) {
    ajax({available: available}, '/users/' + userId, 'PUT', 'Modify user', callback);
}

function modifyPreference(preferenceId, response, callback) {
    ajax({response: response}, '/preferences/' + preferenceId, 'PUT', 'Modify preferences', callback);
}

function getRoommates(userId, callback) {
    ajax({}, '/users/' + userId '/roommates', 'GET', 'Get roommates', callback);
}

function addRoommates(userId, roommateId, callback) {
    ajax({roommateId: roommateId}, '/users/' + userId '/roommates', 'PUT', 'Add roommate', callback);
}

function getRequests(userId, callback) {
    ajax({}, '/users/' + userId + '/requests', 'GET', 'Get requests', callback);
}

function createRequest(from, to, callback) {
    ajax({}, '/users/' + userId + '/requests', 'GET', 'Get requests', callback);
}

function denyRequest(from, to, callback) {
    ajax({}, '/users/' + userId + '/requests', 'GET', 'Get requests', callback);
}

function acceptRequest(from, to, callback) {
    ajax({}, '/users/' + userId + '/requests', 'GET', 'Get requests', callback);
}

// TODO: requests shit

function ajax (params, url, restType, testName, success) {
    if (restType != 'DELETE' && restType != 'PUT' && restType != 'POST') {
        restType = 'GET';
    }

    $.ajax({
        url         : url,
        type        : restType,
        data        : params,
        dataType    : 'json',
        beforeSend  : function() {},
        error       : function() {ok(false, testName); start()},
        success     : function(data) {ok(true, testName); success(data);}
    });
}

// returns a random 10 character string
function randomString() {
    var text = ';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i=0; i < 10; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}