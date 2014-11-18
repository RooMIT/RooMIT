module.exports = {
	// a succinct way to handle errors
	// makes it easy to debug
    handleError: function(res, code, err) {
        console.error(err);
        res.status(code).json({ error: err });
    },

    getPrefs: function(){
    	return [
    		'I am male and would like to have a male roommate',
    		'I am female and would like to have a male roommate',
    		'I am male and would like to have a female roommate',
    		'I am female and would like to have a female roommate',
	    	'I would like to live in Maseeh',
			'I would like to live in Simmons',
			'I would like to live in East Campus',
			'I would like to live in Senior House',
			'I would like to live in MacGregor',
			'I would like to live in McCormick',
			'I would like to live in Baker',
			'I would like to live in Burton Connor',
			'I would like to live in New House',
			'I would like to live in Next House',
			'I would like to live in Random House',
			'I am good with noise during the night',
			'I am a morning person',
			'I like inviting my friends over',
			'I sleep before midnight',
			'I like to keep my room organized',
			'I care a lot about my personal hygiene'
    	];
    }
}