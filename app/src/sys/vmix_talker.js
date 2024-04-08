
const tmute = true;

const vtalker = {};

const valid_overlay_numbers = [
	1, 2, 3, 4, 5, 6, 7, 8,
	'1', '2', '3', '4', '5', '6', '7', '8',
];

vtalker._talk = async function(rparams=null){

	const ctx_cache = ksys.context.global.cache;

	return new Promise(async function(resolve, reject){
		const prms = new URLSearchParams(rparams || {})

		var has_error = false;

		// get random colour and id for this request
		const rnd_colour = `color: hsl(${356 % window.crypto.getRandomValues(new Uint32Array(1))[0]}deg, 52%, 47%);`;
		const rnd_id = window.crypto.getRandomValues(new Uint16Array(1))[0];

		if (!tmute){log('vmix_talk', rnd_id, 'Talking to', ctx_cache.vmix_ip, ':', ctx_cache.vmix_port, rparams, prms.toString())}

		const response = await fetch(`http://${ctx_cache.vmix_ip}:${ctx_cache.vmix_port}/API/?${prms.toString()}`, {
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
		    'credentials': 'omit'
		})
		.catch((error) => {
			print(log('vmix_talk', rnd_id, 'Error occured while performing a request:', error))
			has_error = true;
			resolve(false)
			return
		});

		if (has_error){return}

		if (!tmute){log('vmix_talk', rnd_id, 'Status:', response.status)}

		if (response.status != 200){
			resolve(false)
			return
		}

		const reseponse_data = await response.arrayBuffer();
		const dt = lizard.UTF8ArrToStr(new Uint8Array(reseponse_data))
		if (!tmute){log('vmix_talk', rnd_id, 'Data:', dt)}
		resolve(dt)
		return
	});
}


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
	const ctx_cache = ksys.context.global.cache;

	// URL params constructor
	const prms = new URLSearchParams(rparams || {});

	let error_data = null;

	// Construct and execute the request
	const response = await fetch(
		`http://${ctx_cache.vmix_ip}:${ctx_cache.vmix_port}/API/?${prms.toString()}`,
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
			'credentials': 'omit'
		}
	).catch(function(err){
		error_data = err;
	})

	// If there was an error while executing a response - there's nothing else
	// todo except stopping the function execution
	if (error_data){
		console.warn('vmix_talk', 'Error occured while executing a request:');
		console.error(error_data);
		return false
	}

	// todo: can vmix send back 304 (cached content) (or any other garbage code) ?
	// Theoretically, any response from VMIX that is not 200 is an error
	if (response.status != 200){
		console.warn('vmix_talk', 'Response status is not 200:', response);
		return false
	}

	// todo: can vmix return something that is not text / invalid text in general ?
	const text_decoder = new TextDecoder('utf-8');
	const response_data = text_decoder.decode(
		await response.arrayBuffer()
	);

	return response_data
}


// Try retreiving the project currently opened in VMIX
// by sending empty Function to the API.
// This action should return the project as XML.
// If not - ping is failed.
vtalker.ping = async function(){
	const pinger = await vtalker.talk({'Function': ''})
	if (pinger != false){
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

	await vmix.talker.talk({
		'Function': `OverlayInput${ov_num}Out`,
	})
}

module.exports = vtalker;



