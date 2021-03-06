/** 
 * Author: Olga
 */
function handleError(error) {
    // not human readable error
    if (typeof error === 'object') {
        var errorMessage = JSON.parse(error.responseText);
        $('#error').html(errorMessage);
    } else {
        // human readable error
        $('#error').html(error);
    }
}

// remove error message
function removeError() {
    $('#error').html('');
}

// in control toolbar: switch the active class from the current item to a new item
function switchActive(newActiveSelector) {
    $('li').removeClass('active');
    $(newActiveSelector).addClass('active');
}