module.exports = {
	// a succinct way to handle errors
	// makes it easy to debug
    handleError: function(res, code, err) {
        console.error(err);
        res.status(code).json({ error: err });
    },

    getPrefs: function(){
    	return [
	    	'Maseeh?',
			'Simmons?',
			'East Campus?',
			'Senior House?',
			'MacGregor?',
			'McCormick?',
			'Baker?',
			'Burton Connor?',
			'New House?',
			'Next House?',
			'Random House?',
			'Live with a male?',
			'Live with a female?',
			'Noise at night?',
			'Noise during day?',
			'Morning person?',
			'Night person?',
			'Party-goer?',
			'Sleep before midnight?',
			'Sleep elsewhere frequently?',
			'Organized?'
    	];
    }
}