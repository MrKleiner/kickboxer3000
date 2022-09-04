
// window.context = {}
// window.vmix = {}
// window.context.vmix_ip = '192.168.0.10'
// window.context.vmix_port = '8088'
// window.vmix.app_context.vmix_ip
window.mein_sleep = {}

window.$ = window.jQuery = require('./apis/jquery/3_6_0/jquery.min.js');

// ============================================================
// ------------------------------------------------------------
//                             Logger
// ------------------------------------------------------------
// ============================================================

class fbi_logger
{
	// constructor(height, width) {
	constructor() {
		window.print = console.log.bind(window.console);
		window.log = this.module_log
		console.log('Initialized Fbi Logger');
	};


	// module: module name, if found in predef styles - style correspondingly. Else - wrap into []
	// log: an array of objects to log
	module_log(md=null, lg=''){
		// get pure list of stuff to actually log
		var clear_log = [...arguments].slice(1)

		var predef_styles = {
			'skyboxer': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#1F963B',
				'text': '[Skyboxer]'
			},
			'python_sender': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#3852B2',
				'text': '[Python Sender]'
			},
			'vmix_talk': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#C1186C',
				'text': '[Vmix Talker]'
			},
			'modmaker': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#6198CC',
				'text': '[Modmaker]'
			},
			'gameinfo': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#5F881E',
				'text': '[GameInfo]'
			},
			'dboard': {
				'bg': 'rgba(0, 0, 0, 0.0)',
				'fg': '#5C1EB8',
				'text': '[Dashboard]'
			}
		}

		// make the module name
		if (predef_styles.hasOwnProperty(md)){
			var module_name = `%c${predef_styles[md]['text']}`;
			var module_style = `background: ${predef_styles[md]['bg']}; color: ${predef_styles[md]['fg']}`;
		}else{
			var module_name = `[${md}]`;
			var module_style = '';
		}
		
		// absolute genius
		// return [module_name, module_style, ...clear_log]
		print(
			module_name,
			module_style,
			...clear_log
		)

	}

}
window.fbi = new fbi_logger();



//
// ctrl + r
//
document.addEventListener('keydown', kvt => {
    // console.log('keypress');
    app_reload_refresh(kvt)
    // todo: this really is a core feature...
    if (kvt.altKey && kvt.keyCode == 87 && window.current_app_module != 'main_dashboard'){
    	dashboard_app_loader()
    }
});

function app_reload_refresh(evee){
	if (  evee.ctrlKey  &&  evee.keyCode == 82  ){
		location.reload()
	}
}









// ============================================================
// ------------------------------------------------------------
//                             Buttons
// ------------------------------------------------------------
// ============================================================

class vmix_t_bottuns
{
	// constructor(height, width) {
	constructor() {
		window.vmix_btns = {}
		console.log('Initialized Buttons System');
		Element.prototype.vmixbtn=function(state=false) {
			if (this.closest('vmixbtn') != null){
				if (state == false){
					this.classList.add('vmixbtn_locked')
				}
				if (state == true){
					this.classList.remove('vmixbtn_locked')
				}
			}
		}
	};



}
window.btns = new vmix_t_bottuns();



























async function jsleep(amt=500, ref='a') {

	return new Promise(function(resolve, reject){
	    window.mein_sleep[ref] = setTimeout(function () {
			resolve(true)
	    }, amt);
	});
}

// if empty then return empty_string html
function str_check(st)
{
	if (str(st).trim() == ''){
		return '<span style="color: gray; user-select: none">empty string</span>'
	}else{
		return st
	}
}


















// ============================================================
// ------------------------------------------------------------
//                           Talker
// ------------------------------------------------------------
// ============================================================

class vmix_app_talker
{

	constructor() {
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
		return new Promise(function(resolve, reject){
			var prms = new URLSearchParams(rq)

			// get random colour and id for this request
			var rnd_colour = `color: hsl(${357 % window.crypto.getRandomValues(new Uint32Array(1))[0]}deg, 52%, 47%);`;
			var rnd_id = window.crypto.getRandomValues(new Uint16Array(1))[0]

			log('vmix_talk', rnd_id, 'Talking to', window.vmix.app_context.vmix_ip, ':', window.vmix.app_context.vmix_port, rq, prms.toString())

			fetch(`http://${window.vmix.app_context.vmix_ip}:${window.vmix.app_context.vmix_port}/API/?${prms.toString()}`, {
			    'headers': {
			        // 'accept': '*/*',
			        // 'cache-control': 'no-cache',
			        // 'pragma': 'no-cache',
			        // 'Access-Control-Allow-Origin': '*',
			        // 'Access-Control-Allow-Methods': 'DELETE, POST, GET, OPTIONS',
			        // 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
			    },
			    'method': 'GET'
			    // 'mode': 'cors',
			    // 'credentials': 'omit'
			})
			.then(function(response) {
				log('vmix_talk', rnd_id, 'Status:', response.status)
			    if (response.status != 200){
			    	resolve(false)
			    }
			    response.arrayBuffer().then(function(data) {
			    	var dt = lizard.UTF8ArrToStr(new Uint8Array(data))
			    	log('vmix_talk', rnd_id, 'Data:', dt)
			    	resolve(dt)
			    });
			})
			.catch((error) => {
				resolve(false)
			});
		});
	}









	// ============================================================
	// ------------------------------------------------------------
	//                           Python Sender
	// ------------------------------------------------------------
	// ============================================================

	// Takes payload
	// A dict of parameters
	// And the type of data to receive: bytes/text/json
	async py_send(pl='', prms={}, tp='text')
	{
		return new Promise(function(resolve, reject){

			// parse URL parameters
			var url_prms = new URLSearchParams(prms)

			// create data blob
			var blob = new Blob([pl], {type: '*/*'});

			// execute request
			fetch(`htbin/logicman.py/?${url_prms.toString()}`, {
			    'headers': {
			        // 'accept': '*/*',
			        // 'cache-control': 'no-cache',
			        // 'pragma': 'no-cache',
			        // 'Access-Control-Allow-Origin': '*',
			        // 'Access-Control-Allow-Methods': 'DELETE, POST, GET, OPTIONS',
			        // 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
			    },
			    'method': 'POST',
			    'body': blob
			    // 'mode': 'cors',
			    // 'credentials': 'omit'
			})
			.then(function(response) {
				log('python_sender', 'Executed Dialogue, response status:', response.status)

				// if it's text - get bytes from the response and decode them into text
				if (tp == 'text'){
					response.arrayBuffer().then(function(data) {
						resolve(lizard.UTF8ArrToStr(new Uint8Array(data)))
					});
				}

				// if it's json - let the javascript do shit for us
				if (tp == 'json'){
					response.json().then(function(data) {
						resolve(data)
					});
				}

				// if it's array buffer - return raw array buffer
				if (tp == 'buffer'){
					response.arrayBuffer().then(function(data) {
						resolve(data)
					});
				}

			})
			.catch((error) => {
				resolve(false)
			});
		});
	}







	// ============================================================
	// ------------------------------------------------------------
	//                       Python Requester
	// ------------------------------------------------------------
	// ============================================================

	// Takes payload
	// A dict of parameters
	// And the type of data to receive: bytes/text/json
	async py_get(prms={}, tp='text')
	{
		return new Promise(function(resolve, reject){

			// parse URL parameters
			var url_prms = new URLSearchParams(prms)

			// execute request
			log('python_sender', 'Get from python:', `htbin/logicman.py/?${url_prms.toString()}`)
			fetch(`htbin/logicman.py/?${url_prms.toString()}`, {
			    'headers': {
					// 'accept': '*/*',
					// 'cache-control': 'no-cache',
					// 'pragma': 'no-cache',
					// 'Access-Control-Allow-Origin': '*',
					// 'Access-Control-Allow-Methods': 'DELETE, POST, GET, OPTIONS',
					// 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
			    },
			    'method': 'GET',
			    'mode': 'no-cors',
			    // 'credentials': 'omit'
			})
			.then(function(response) {
				log('python_sender', 'Executed Dialogue, response status:', response.status)

				// if it's text - get bytes from the response and decode them into text
				if (tp == 'text'){
					response.arrayBuffer().then(function(data) {
						resolve(lizard.UTF8ArrToStr(new Uint8Array(data)))
					});
				}

				// if it's json - let the javascript do shit for us
				if (tp == 'josn'){
					response.json().then(function(data) {
						resolve(data)
					});
				}

				// if it's array buffer - return raw array buffer
				if (tp == 'buffer'){
					response.arrayBuffer().then(function(data) {
						resolve(data)
					});
				}

			})
			.catch((error) => {
				resolve(false)
			});
		});
	}














	// get current vmix project XML
	async project(raw=false){
		if (raw == true){
			return await this.vmix_talk({'Function': ''})
		}else{
			return $.parseXML(await this.vmix_talk({'Function': ''}))
		}
	}

	async ping(){
		var pinger = await this.vmix_talk({'Function': ''})
		if (pinger != false){
			return true
		}else{
			return false
		}
	}



}
window.talker = new vmix_app_talker();



































// ============================================================
// ------------------------------------------------------------
//                        Context Manager
// ------------------------------------------------------------
// ============================================================

class vmix_context_manager
{

	constructor() {
		window.vmix = {}
		window.vmix.app_context = {}
		// window.vmix.app_context.vmix_ip = '192.168.0.10'
		// window.vmix.app_context.vmix_port = '8088'
		print('Initialized Context Manager');
	};

	// set OR get parameter
	async prm(key=null, value=undefined, dosave=true){

		// if value is undefined, then it means that we're only getting a parameter
		if (value == undefined){
			return window.vmix.app_context[key]
		}

		// if defined - set and maybe save
		window.vmix.app_context[key] = value;
		if (dosave == true){
			return await this.save()
		}
	}



	// readonly shite
	get read(){
		// todo: there are better ways of duplicating shit
		var dupli = {}
		for (var k in window.vmix.app_context){
			dupli[k] = window.vmix.app_context[k]
		}
		return dupli
	}



	// save to disk
	async save(){
		return new Promise(function(resolve, reject){
			var prms = new URLSearchParams({
				'action': 'save_context'
			})
			print('Talking to', `htbin/logicman.py?${prms.toString()}`)

			var blob = new Blob([JSON.stringify(window.vmix.app_context)], {type: 'text/plain'});

			// fetch(`http://${window.vmix.app_context.vmix_ip}:3186/htbin/logicman.py?${prms.toString()}`, {
			fetch(`htbin/logicman.py?${prms.toString()}`, {
			    'headers': {
			    	'accept': '*/*',
			    	'cache-control': 'no-cache',
			    	'pragma': 'no-cache',
			    	'Access-Control-Allow-Origin': '*'
			    },
			    'body': blob,
			    'mode': 'no-cors',
			    'method': 'POST'
			})
			.then(function(response) {
			    print(response.status);
			    response.arrayBuffer().then(function(data) {
			    	var rs = lizard.UTF8ArrToStr(new Uint8Array(data))
			    	print(rs)
			    	resolve(rs)
			    });
			});
		});
	}


	async pull(){
		return
		return new Promise(function(resolve, reject){
			var prms = new URLSearchParams({
				'action': 'load_context'
			})
			print('Talking to', `htbin/logicman.py?${prms.toString()}`)

			// fetch(`http://${window.vmix.app_context.vmix_ip}:3186/htbin/logicman.py?${prms.toString()}`, {
			fetch(`htbin/logicman.py?${prms.toString()}`, {
			    'headers': {
			    	'accept': '*/*',
			    	'cache-control': 'no-cache',
			    	'pragma': 'no-cache',
			    	'Access-Control-Allow-Origin': '*'
			    },
			    'mode': 'no-cors',
			    'method': 'GET'
			})
			.then(function(response) {
			    print(response.status);
			    response.json().then(function(data) {
			    	// var rs = lizard.UTF8ArrToStr(new Uint8Array(data))
			    	print(data)
			    	window.vmix.app_context = data
			    	resolve(data)
			    });
			});
		});
	}


}
window.context = new vmix_context_manager();


















async function sys_load(nm)
{
	return new Promise(function(resolve, reject){

		fetch(`modules/${nm}`, {
		    'headers': {
		    	'accept': '*/*',
		    	'cache-control': 'no-cache',
		    	'pragma': 'no-cache',
		    	'Access-Control-Allow-Origin': '*'
		    },
		    'mode': 'no-cors',
		    'method': 'GET'
		})
		.then(function(response) {
		    print(response.status);
		    response.text().then(function(data) {
		    	$('#app_sys').html(data)
		    	// module_styling


		    	//
		    	// Style
		    	//

				fetch(`modules/${nm.split('/').at(-2)}/style.css`, {
				    'headers': {
				    	'accept': '*/*',
				    	'cache-control': 'no-cache',
				    	'pragma': 'no-cache',
				    	'Access-Control-Allow-Origin': '*'
				    },
				    'mode': 'no-cors',
				    'method': 'GET'
				})
				.then(function(response) {
				    print(response.status);
				    response.text().then(function(data) {
				    	$('#module_styling').text(data)
				    	// module_styling
				    	pull_cached_data()
				    });
				});





		    });
		});
	});
}
























$(document).ready(function(){
	app_init()
});


// always start from the welcome page
// check if vmix is reachable
// if reachable - load module
async function app_init()
{
	var loadlast = await context.pull()

	var reach = await talker.ping()
	if (reach == false){
		$('#welcome_screen_title_2').text('VMIX is unreachable: Bad ip/port. Please enter valid ip/port to proceed.')
		$('#welcome_screen').append(`
			<div id="welcome_enter_info">
				<input style="color: white" type="text" placeholder="IP" ip>:<input style="color: white" type="number" placeholder="Port" port>
			</div>
			<sysbtn style="margin-top: 10px" onclick="save_creds_from_welcome()" id="welcome_apply_creds">Apply</sysbtn>
		`)
		return
	}else{
		$('#welcome_screen_title_2').text('Please select a system from the list below...')
		$('#system_selector').removeAttr('style')
	}
}


function save_creds_from_welcome()
{
	context.prm('vmix_ip', $('#welcome_enter_info [ip]').val(), false)
	context.prm('vmix_port', $('#welcome_enter_info [port]').val(), false)
	context.save()
	window.location.reload()
}















