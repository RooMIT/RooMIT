function handleError(error) {
    console.log(error);
    showError('Something went wrong');
}

function removeError() {
    $('#error').html('');
}

function showError(text) {
	$('#error').html(text);
}