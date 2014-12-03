/**
 * Author: Rujia
 */

$.ajaxPrefilter(function(options, _, xhr) {
    if (!xhr.crossDomain) {
        var token = $('meta[name="csrf-token"]').attr('content');
        xhr.setRequestHeader('X-CSRF-Token', token);
    }
});

var name = 'testuser';
var password = 'beans';
var connectionString = 'http://localhost:8080/';

asyncTest('registering a user', function() {
    registerUser(function(user) {
        equal(user.name, name);
        ok(user.preferences.length);
        ok(user.available);
        equal(user.group, undefined);
        start();
    });
});

asyncTest('logging in a user', function() {
    registerUser(function(user1) {
        login(user1.email, password, function(response) {
            var user = response.user;
            equal(user.name, name);
            equal(user.email, user1.email);
            equal(user._id, user1._id)
            start();
        });
    });
});

asyncTest('getting a user', function() {
    registerUser(function(user1) {
        getUser(user1._id, function(response) {
            var user = response.user;
            equal(user.name, name);
            equal(user.email, user1.email);
            equal(user._id, user1._id)
            start();
        });
    });
});

asyncTest('get suggestions', function() {
    registerUser(function(user) {
        getSuggestions(function(response) {
            var suggestions = response.suggestions;
            ok(suggestions);
            start();
        });
    });
});

asyncTest('modify preferences', function() {
    registerUser(function(user1) {
        getUser(user1._id, function(response) {
            var user = response.user;
            var preference = user.preferences[0];
            console.log(preference._id);
            
            modifyPreference(preference._id, 'Yes', function(response) {
                ok(response.success)

            //     getUser(user1._id, function(response) {
            //         var preference2 = response.user.preferences[0];
            //         equal(preference2.response, 'Yes');
            //         equal(preference.description, preference2.description);
                    start();
            //     }); 
            });
        });
    });
});

// asyncTest('add and remove roommate', function() {
//     registerTwoUsers(function(user1, user2) {
//         // both have no roommates
//         getBothRoommates(user1._id, user2._id, function(roommates1, roommates2) {
//             equal(roommates1.length, 0);
//             equal(roommates2.length, 0);
                
//             makeRoommates(user1._id, user2._id, response, function(response) {
//                 ok(response.success)

//                 // check that they both have each other
//                 getBothUsers(user1._id, user2._id, function(user1, user2) {
//                     var group1 = user1.group;
//                     var group2 = user2.group;
//                     ok(group1 !== undefined); 
//                     ok(group2 !== undefined);
//                     equal(group1, group2);

//                     getBothRoommates(user1._id, user2._id, function(roommates1, roommates2) {
//                         same(roommates1, [user2._id]);
//                         same(roommates2, [user1._id]);

//                         // disband group
//                         leaveGroup(user1._id, function(response) {
//                             ok(response.success);

//                             getBothUsers(user1._id, user2._id, function(user1, user2) {
//                                 var group1 = user1.group;
//                                 var group2 = user2.group;
//                                 ok(group1 === undefined); 
//                                 ok(group2 ===  undefined);

//                                 getBothRoommates(user1._id, user2._id, function(roommates1, roommates2) {
//                                     same(roommates1, []);
//                                     same(roommates2, []);
//                                     start();
//                                 });
//                             });
//                         });
//                     });
//                 });
//             });
//         });
//     });
// });

// asyncTest('modify availability', function() {
//     registerTwoUsers(function(user1, user2) {
//         makeRoommates(user1._id, user2._id, response, function(response) {
//             ok(response.success);

//             // check that they are both available
//             getBothUsers(user1._id, user2._id, function(user1, user2) {
//                 ok(user1.available); 
//                 ok(user2.available);

//                 // make one unavailable
//                 modifyUserAvailability(user1._id, false, function(response) {
//                     ok(response.success);

//                     // both should be unavailable
//                     getBothUsers(user1._id, user2._id, function(user1, user2) {
//                         ok(!user1.available); 
//                         ok(!user2.available);

//                         // make one available
//                         modifyUserAvailability(user2._id, true, function(response) {
//                             ok(response.success);

//                             // both should be available
//                             getBothUsers(user1._id, user2._id, function(user1, user2) {
//                                 ok(user1.available); 
//                                 ok(user2.available);

//                                 // disband group
//                                 leaveGroup(user1._id, function(response) {
//                                     ok(response.success);
//                                     start();
//                                 });
//                             });
//                         });
//                     });
//                 });
//             });
//         });
//     });
// });

// asyncTest('make and deny request', function() {
//     registerTwoUsers(function(user1, user2) {
//         createRequest(user1._id, user2._id, function(response) {
//             ok(response.success);

//             getBothRequests(user1._id, user2._id, function(response1, response2) {
//                 var reqTo1 = response1.requestsTo;
//                 var reqTo2 = response2.requestsTo;
//                 var reqFrom1 = response1.requestsFrom;
//                 var reqFrom2 = response2.requestsFrom;

//                 equal(reqTo1.length, 0);
//                 equal(reqFrom2.length, 0);
//                 equal(reqTo2.length, 1);
//                 equal(reqFrom1.length, 1);

//                 equal(reqTo2[0].to, user2._id);
//                 equal(reqTo2[0].from, user1._id);
//                 equal(reqFrom1[0].to, user2._id);
//                 equal(reqFrom1[0].from, user1._id);

//                 modifyRequest(user1._id, user2._id, false, true, false, function(response) {
//                     ok(response.success);

//                     getBothRequests(user1._id, user2._id, function(response1, response2) {
//                         var reqTo1 = response1.requestsTo;
//                         var reqTo2 = response2.requestsTo;
//                         var reqFrom1 = response1.requestsFrom;
//                         var reqFrom2 = response2.requestsFrom;

//                         equal(reqTo1.length, 0);
//                         equal(reqFrom2.length, 0);
//                         equal(reqTo2.length, 0);
//                         equal(reqFrom1.length, 0);
//                         start();
//                     });
//                 });
//             });
//         });
//     });
// });

// asyncTest('make and cancel request', function() {
//     registerTwoUsers(function(user1, user2) {
//         createRequest(user1._id, user2._id, function(response) {
//             ok(response.success);

//             getBothRequests(user1._id, user2._id, function(response1, response2) {
//                 var reqTo1 = response1.requestsTo;
//                 var reqTo2 = response2.requestsTo;
//                 var reqFrom1 = response1.requestsFrom;
//                 var reqFrom2 = response2.requestsFrom;

//                 equal(reqTo1.length, 0);
//                 equal(reqFrom2.length, 0);
//                 equal(reqTo2.length, 1);
//                 equal(reqFrom1.length, 1);

//                 equal(reqTo2[0].to, user2._id);
//                 equal(reqTo2[0].from, user1._id);
//                 equal(reqFrom1[0].to, user2._id);
//                 equal(reqFrom1[0].from, user1._id);

//                 // cancel request
//                 modifyRequest(user1._id, user2._id, false, false, true, function(response) {
//                     ok(response.success);

//                     getBothRequests(user1._id, user2._id, function(response1, response2) {
//                         var reqTo1 = response1.requestsTo;
//                         var reqTo2 = response2.requestsTo;
//                         var reqFrom1 = response1.requestsFrom;
//                         var reqFrom2 = response2.requestsFrom;

//                         equal(reqTo1.length, 0);
//                         equal(reqFrom2.length, 0);
//                         equal(reqTo2.length, 0);
//                         equal(reqFrom1.length, 0);
//                         start();
//                     });
//                 });
//             });
//         });
//     });
// });

function makeRoommates(userId1, userId2, callback) {
    // request and accept
    createRequest(userId, userId1, function(response) {
        modifyRequest(userId, userId2, true, false, false, callback);
    });
}

function getBothUsers(userId1, userId2, callback) {
    getUser(userId1, function(response1) {
        getUser(userId2, function(response2) {
            callback(response1.user, response2.user);
        });
    });
}

function getBothRoommates(userId1, userId2, callback) {
    getRoommates(userId1, function(response1) {
        getRoommates(userId2, function(response2) {
            callback(response1.roommates, response2.roommates);
        });
    });
}

function getBothRequests(userId1, userId2, callback) {
    getRequests(userId1, function(response1) {
        getRequests(userId2, function(response2) {
            callback(response1, response2);
        });
    });
}

function registerTwoUsers(callback) {
    registerUser(function(user1) {
        registerUser(function(user2) {
            callback(user1, user2);
        });
    });
}

function registerUser(callback) {
    var email = randomString() + '@mit.edu';
    registerWithoutTest(name, email, password, function(response) {
        callback(response.user);
    });
}

function login(email, password, callback) {
    ajax({email: email, password: password}, '/login/', 'POST', 'Login', callback);
}

function register(name, email, password, callback) {
    ajax({name: name, email: email, password: password}, '/users/', 'POST', 'Register', callback);
}

function logout(callback) {
    ajax({}, '/logout/', 'POST', 'Logout', callback);
}

function getUser(userId, callback) {
    ajax({}, '/users/' + userId, 'GET', 'Get user', callback);
}

function getSuggestions(callback) {
    ajax({}, '/suggestions/', 'GET', 'Get suggestions', callback);
}

function leaveGroup(userId, callback) {
    ajax({leaveGroup: true}, '/users/' + userId, 'PUT', 'Leave group', callback);
}

function modifyUserAvailability(userId, available, callback) {
    ajax({available: available}, '/users/' + userId, 'PUT', 'Modify user availability', callback);
}

function modifyPreference(preferenceId, response, callback) {
    ajax({response: response}, '/preferences/' + preferenceId, 'PUT', 'Modify preferences', callback);
}

function getRoommates(userId, callback) {
    ajax({}, '/users/' + userId + '/roommates', 'GET', 'Get roommates', callback);
}

function getRequests(userId, callback) {
    ajax({}, '/users/' + userId + '/requests', 'GET', 'Get requests', callback);
}

function createRequest(from, to, callback) {
    ajax({}, '/users/' + from + '/requests/to/' + to, 'POST', 'Make a request', callback);
}

function modifyRequest(from, to, accept, deny, cancel, callback) {
    ajax({deny: deny, cancel: cancel, accept: accept}, '/users/' + from + '/requests/to/' + to, 'PUT', 'Modify request', callback);
}

function registerWithoutTest(name, email, password, callback) {
    $.post(
        '/users',
        { name: name, email: email, password: password }
    ).done(function(response) {
        callback(response);
    }).fail(function(error) {
        console.log(error);
    });
}

function ajax(params, url, restType, testName, success) {
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
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i=0; i < 10; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}