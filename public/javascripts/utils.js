// handles either human-readable text
// or server-given error objects
function handleError(error) {
    // not human readable error
    if (typeof error === 'object') {
        console.log(error);
        var errorMessage = JSON.parse(error.responseText).error
        $('#error').html(errorMessage);
    } else {
        // human readable error
        $('#error').html(error);
    }
}

function removeError() {
    $('#error').html('');
}