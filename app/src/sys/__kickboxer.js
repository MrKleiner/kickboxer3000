


// Constants

// most of the core functions, like string check
const ksys = {};

// vmix-related commands
const vmix = {};

// interface for writing/saving files to global or local database
const kbdb = {};

// python toys
const print = console.log;

// some sort of modules ?
const kbmodules = {};

// Electron File System Access
const fs = require('fs');

// Python-like pathlib
const pathlib = require('pathlib-js').default;
const Path = function(){
	const p = new pathlib(...arguments)
	return p
}

// Jquery
const $ = window.jQuery = require('/apis/jquery/3_6_0/jquery.min.js');

// filesaverjs
const flsaver = require('/apis/filesaverjs/2_0_4/FileSaver.js');


// app root path
var _got_root = new pathlib(__dirname);
while (true) {
	var exs = got_root.join('roothook.lizard').isFileSync()
	if (exs == true){
		window.sysroot = got_root
		break
	}
	got_root = got_root.parent()
}

// set version in the title
document.title = 'KickBoxer3000 - v' + JSON.parse(fs.readFileSync(window.sysroot.parent().join('package.json').toString(), {encoding:'utf8', flag:'r'}))['version_native']


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






// ============================================================
// ------------------------------------------------------------
//                        Context Manager
// ------------------------------------------------------------
// ============================================================



//
// modern shite
//

// user
const context = {
	global: {},
	module: {
		// storing files
		db: {},
	},
};

// system
// this is where actual parameters are stored and this is where they're actually written to
vmix.app_context = {};
vmix.module_context = {};





