/** 
 * Author: Olga
 */
function handleError(error) {
    // not human readable error
    if (typeof error === 'object') {
        console.log(error);
        var errorMessage = JSON.parse(error.responseText).error;
        $('#error').html(errorMessage);
    } else {
        // human readable error
        $('#error').html(error);
    }
}

function removeError() {
    $('#error').html('');
}

// in control toolbar: switch the active class from the current item to a new item
function switchActive(newActiveSelector) {
    $('li').removeClass('active');
    $(newActiveSelector).addClass('active');
}