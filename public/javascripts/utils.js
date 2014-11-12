function handleError(error) {
    // not human readable error
    if (typeof error === 'object') {
        console.log(error);
        $('#error').html('Something went wrong');
    } else {
        // human readable error
        $('#error').html(error);
    }
}

function removeError() {
    $('#error').html('');
}

// used to change the view: clear everything in the 
// main div, and clear any errors
function clearMainDiv() {
	$('#main').children().remove();
    removeError();
}