
const tmute = true;

const vtalker = {};


vtalker.talk = async function(rparams=null){

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

		const reseponse_data = await response.arrayBuffer()
		const dt = lizard.UTF8ArrToStr(new Uint8Array(reseponse_data))
		if (!tmute){log('vmix_talk', rnd_id, 'Data:', dt)}
		resolve(dt)
		return
	});
}

vtalker.ping = async function(){
	const pinger = await vtalker.talk({'Function': ''})
	if (pinger != false){
		return true
	}else{
		return false
	}
}

vtalker.project = async function(raw=false) {
	if (raw == true){
		return await vtalker.talk({'Function': ''})
	}else{
		const xm = (new DOMParser()).parseFromString((await vtalker.talk({'Function': ''})), 'application/xml');
		return xm
	}
}



class _vmix_app_talker
{

	constructor(mute=false) {
		this.mute = mute;
		print('Initialized Talker');
	};




	// ============================================================
	// ------------------------------------------------------------
	//                           VMIX Talker
	// ------------------------------------------------------------
	// ============================================================

	// takes a dict of parameters
	async vmix_talk(rq={})
	{
		const self = this;
		const ctx_cache = ksys.context.global.cache;
		return new Promise(async function(resolve, reject){
			const prms = new URLSearchParams(rq)

			var has_error = false;

			// get random colour and id for this request
			const rnd_colour = `color: hsl(${357 % window.crypto.getRandomValues(new Uint32Array(1))[0]}deg, 52%, 47%);`;
			const rnd_id = window.crypto.getRandomValues(new Uint16Array(1))[0]

			if (!self.mute){log('vmix_talk', rnd_id, 'Talking to', ctx_cache.vmix_ip, ':', ctx_cache.vmix_port, rq, prms.toString())};

			const response = await fetch(`http://${ctx_cache.vmix_ip}:${ctx_cache.vmix_port}/API/?${prms.toString()}`, {
			    'headers': {
			        'accept': '*/*',
			        'cache-control': 'no-cache',
			        'pragma': 'no-cache',
			        'Access-Control-Allow-Origin': '*'
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

			if (!self.mute){log('vmix_talk', rnd_id, 'Status:', response.status)};
			if (response.status != 200){
				resolve(false)
				return
			}

			const response_data = await response.arrayBuffer()
			const decoder = new TextDecoder();
			// const dt = lizard.UTF8ArrToStr(new Uint8Array(response_data))
			resolve(decoder.decode(response_data))
			if (!self.mute){log('vmix_talk', rnd_id, 'Data:', dt)};

			return
		});
	}









	// ============================================================
	// ------------------------------------------------------------
	//                           Python Talker
	// ------------------------------------------------------------
	// ============================================================

	// Takes action to be executed
	// A payload
	async py_talk(act='', pl={})
	{
		return new Promise(function(resolve, reject){
			let shell = new PythonShell('gateway.py', window.py_common_opts);
			var dtstorage = null
			var mkpayload = JSON.stringify({
				'action': act,
				'payload': pl
			})
			print(mkpayload)
			shell.send(mkpayload);

			shell.stdout.on('data', function (message) {
			    dtstorage = message
			});
			shell.end(function (err,code,signal) {
				// shell_end_c(err,code,signal)
				// print(lizard.UTF8ArrToStr(window.sexmsg))
				print(dtstorage)
				var converted = lizard.UTF8ArrToStr(dtstorage)
				// print(converted)
				resolve(converted)
			});
		});
	}









	// get current vmix project XML
	async project(raw=false){
		if (raw == true){
			return await this.vmix_talk({'Function': ''})
		}else{
			// return $.parseXML(await this.vmix_talk({'Function': ''}))
			const xm = (new DOMParser()).parseFromString((await this.vmix_talk({'Function': ''})), 'application/xml');
			return xm
		}
	}

	async ping(){
		const pinger = await this.vmix_talk({'Function': ''})
		if (pinger != false){
			return true
		}else{
			return false
		}
	}

}



// const _vmixtalker = new _vmix_app_talker(true);
module.exports = vtalker;



