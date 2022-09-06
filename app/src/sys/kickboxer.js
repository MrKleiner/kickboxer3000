
// ============================================================
// ------------------------------------------------------------
//                   Core info and functions
// ------------------------------------------------------------
// ============================================================


// Electron File System Access
const fs = require('fs');

// Python-like pathlib
const pathlib = require('pathlib-js').default;
// app root path
var got_root = new pathlib(__dirname)
while (true) {
	var exs = got_root.join('roothook.lizard').isFileSync()
	if (exs == true){
		window.sysroot = got_root
		break
	}
	got_root = got_root.parent()
}


// Jquery
window.$ = window.jQuery = require('./apis/jquery/3_6_0/jquery.min.js');

//
// python shite
//
const {PythonShell} = require('python-shell');
window.py_common_opts = {
	mode: 'binary',
	pythonPath: str(window.sysroot.join('bins', 'python', 'bin', 'python.exe')),
	pythonOptions: [],
	scriptPath: str(window.sysroot.join('py'))
};

function shell_end_c(err,code,signal)
{
	if (err) throw err;
	console.log('The exit code was: ' + code);
	console.log('The exit signal was: ' + signal);
	console.log('finished');
}







window.mein_sleep = {}



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

	warn_critical(msg=''){
		$('#logs_place').append(`
			<div class="warning_critical">
				<msg>${msg}</msg>
				<sysbtn onclick="close_warnings()"><span style="font-style: italic">I swear I will not ignore this warning and do what was asked</span></sysbtn>
			</div>
		`);
		$('#logs_place').css('visibility', 'visible')
	}

}
window.fbi = new fbi_logger();



//
// ctrl + r
//
document.addEventListener('keydown', kvt => {
    app_reload_refresh(kvt)
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
		window.vmix_btns.pool = {}
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

	// register named buttons in a pool
	sync_pool(){
		for (var reg of document.querySelectorAll('vmixbtn[btname]')){
			window.vmix_btns.pool[reg.getAttribute('btname')] = reg
		}
	}

	get pool(){
		// todo: temp: Resync pool before getting it
		this.sync_pool()
		return window.vmix_btns.pool
	}

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
	prm(key=null, value=undefined, dosave=true){

		// if value is undefined, then it means that we're only getting a parameter
		if (value == undefined){
			return window.vmix.app_context[key]
		}
		var remap_this = this;
		// if defined - set and maybe save
		window.vmix.app_context[key] = value;
		if (dosave == true){
			return new Promise(function(resolve, reject){
				remap_this.save()
				.then(function(response) {
					resolve(response)
				});
			});
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
		return new Promise(async function(resolve, reject){
			var rsp = await talker.py_talk('save_context', window.vmix.app_context)
	    	// var resp = lizard.UTF8ArrToStr(new Uint8Array(rsp))
	    	print('save response:', rsp)
	    	resolve(rsp)
		});
	}


	async pull(){
		return new Promise(async function(resolve, reject){
			var rsp = await talker.py_talk('load_context', null)
	    	var resp = JSON.parse(rsp)
	    	print(resp)
	    	window.vmix.app_context = resp
	    	resolve(resp)
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
	print('LOADLAST', loadlast)
	print('context read before warning', context.read['been_warned'])
	if (context.read['been_warned'] != true){
		fbi.warn_critical('Do not forget to turn on alpha channel on the required outputs (sdi/ndi)!')
	}

	var reach = await talker.ping()
	if (reach == false){
		$('#welcome_screen_title_2').text('VMIX is unreachable: Bad ip/port. Please enter valid ip/port to proceed.')
		$('#welcome_screen').append(`
			<div id="welcome_enter_info">
				<input style="color: white" type="text" placeholder="IP (absolute)" ip>:<input style="color: white" type="number" placeholder="Port" port>
			</div>
			<sysbtn style="margin-top: 10px" onclick="save_creds_from_welcome()" id="welcome_apply_creds">Apply</sysbtn>
		`)
		return
	}else{
		$('#welcome_screen_title_2').text('Please select a system from the list below...')
		$('#system_selector').removeAttr('style')
	}
}


async function save_creds_from_welcome()
{
	context.prm('vmix_ip', $('#welcome_enter_info [ip]').val(), false)
	context.prm('vmix_port', $('#welcome_enter_info [port]').val(), false)
	print(await context.save())
	window.location.reload()
}










function close_warnings()
{
	$('#logs_place').css('visibility', 'hidden')
	$('#logs_place').empty()
	context.prm('been_warned', true)
}




function wipe_context()
{
	context.prm('vmix_ip', '', false)
	context.prm('vmix_port', '', false)
	context.prm('title_name', '', false)
	context.prm('title_path', '', false)
	context.prm('interval', '', false)
	context.prm('interval_exp', '', false)
	context.prm('xml_url', 'https://feed.pm/api/v1/event/collection-xml/xsport_feed', false)
	context.prm('been_warned', false)
}







