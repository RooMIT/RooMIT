
// Updates the preference on a click
$(document).on('click', '.preference-radio-inline', function(event) {
	var input = this.firstChild;
	$.post(
        '/preferences/' + input.class,
        { response: input.value }
    ).done(function(response) {
    }).fail(function(error) {
        handleError(error);
    });
});