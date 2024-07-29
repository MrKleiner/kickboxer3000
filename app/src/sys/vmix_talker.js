
const tmute = true;

const vtalker = {};

const valid_overlay_numbers = [
	1, 2, 3, 4, 5, 6, 7, 8,
	'1', '2', '3', '4', '5', '6', '7', '8',
];


// Create a VMIX API request URL.
// IP:Port is pulled from the context cache.
vtalker.create_url = function(rparams=null, with_scheme=false){
	const ctx_cache = ksys.context.global.cache;
	const prms = new URLSearchParams(rparams || {});

	if (with_scheme){
		return `http://${ctx_cache.vmix_ip}:${ctx_cache.vmix_port}/API/?${prms.toString()}`
	}else{
		return `/API/?${prms.toString()}`
	}
}



// Send a command to VMIX API
vtalker.talk = async function(rparams=null){
	let error_data = null;

	// Construct and execute the request
	const response = await fetch(
		vtalker.create_url(rparams),
		{
			'headers': {
				'accept': '*/*',
				'cache-control': 'no-cache',
				'pragma': 'no-cache',
				'Access-Control-Allow-Origin': '*',
				// 'Access-Control-Allow-Methods': 'DELETE, POST, GET, OPTIONS',
				// 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
			},
			'method': 'GET',
			'mode': 'cors',
			'credentials': 'omit',
			'cache': 'no-store',
		}
	).catch(function(err){
		error_data = err;
	})

	// If there was an error while executing a response - there's nothing else
	// to do except stopping the function execution
	if (error_data){
		console.warn('Vmix Talk:', 'Error occured while executing a request:');
		console.error(error_data);
		return false
	}

	// todo: can vmix send back 304 (cached content) (or any other garbage code) ?
	// Theoretically, any response from VMIX that is not 200 is an error
	if (response.status != 200){
		console.warn('Vmix Talk:', 'Response status is not 200:', response);
		return false
	}

	// todo: can vmix return something that is not text / invalid text in general ?
	const text_decoder = new TextDecoder('utf-8');
	const response_data = text_decoder.decode(
		await response.arrayBuffer()
	);

	return response_data
}


// Simply try connecting to vmix.
// Returns true if connection went through.
// Otherwise returns false
vtalker.ping = async function(){
	const response = await vtalker.talk({'Function': ''})
	if (response != false){
		return true
	}else{
		return false
	}
}

// Retreive the project currently opened in VMIX as XML
vtalker.project = async function(raw=false) {
	if (raw == true){
		return await vtalker.talk({'Function': ''})
	}else{
		const evaluated_xml = (new DOMParser()).parseFromString(
			await vtalker.talk({'Function': ''}),
			'application/xml'
		);
		return evaluated_xml
	}
}


// OverlayInput1Out
// Globally turn overlay 1 off
vtalker.overlay_out = async function(ov_num){
	if (!valid_overlay_numbers.includes(ov_num)){
		console.error('Invalid overlay number:', ov_num, '. Must be a number from 1 to 8');
		return null
	}

	await vtalker.talk({
		'Function': `OverlayInput${ov_num}Out`,
	})
}

module.exports = vtalker;



