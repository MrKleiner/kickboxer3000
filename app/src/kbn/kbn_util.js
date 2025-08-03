
// kbn = KickBoxerNode
// (KickBoxer, but it's Node.js)

const electron = require('electron');
const cls_pwnage = require('../sys/class_pwnage.js');
const pathlib = require('pathlib-js').default;


// Rapid transit IPC pipe
const Autobahn = class{
	constructor(params){
		const self = nprint(cls_pwnage.remap(this));

		// Create pipes
		const {port1, port2} = new electron.MessageChannelMain();
		self.pipe = port1;
		self._pipe_b = port2;

		// Callback can be re-assigned
		self.msg_callback = params?.msg_callback;

		self.detached = false;

		// Listen for incoming messages on this end
		self.pipe.on('message', function(msg){
			self?.msg_callback(msg);
		});

		self.pipe.on('close', function(evt){
			self.nprint('Autobahn', self, 'Pipe termination', evt);
			self.detached = true;
		})
	}

	$pipe_b(self){
		if (!self._pipe_b){return null};

		const pipe = self._pipe_b;
		self._pipe_b = null;
		return pipe;
	}

	terminate(self){
		console.error('Terminating Autobahn? How?', self);
	}

	send(self, msg){
		self.pipe.postMessage(msg);
	}
}

// Promise-based sleep
const sleep = function sleep(ms){
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	})
}

// Named prints
// (Prints class name in the beginning)
const nprint = function(cls){
	cls.nprint = function(){
		if (cls.constructor.MUTE_NPRINT){return};
		console.log(
			`[${cls.constructor.name}]`,
			...arguments
		)
	}

	cls.nwarn = function(){
		if (cls.constructor.MUTE_NPRINT){return};
		console.warn(
			`[${cls.constructor.name}]`,
			...arguments
		)
	}

	cls.nerr = function(){
		if (cls.constructor.MUTE_NPRINT){return};
		console.error(
			`[${cls.constructor.name}]`,
			...arguments
		)
	}

	return cls;
}

// todo: somehow unite this with what's already in kickboxer.js ?
const Path = function(){
	const cls = new pathlib(...arguments);

	cls.is_relative_to = function(target){
		const stack = cls.parts();
		const parent = Path(target).toString();

		while (stack.length){
			const current = Path(stack.join('/')).toString();
			if (current == parent){
				return true;
			}
			stack.pop();
		}

		return false;
	}

	return cls;
}


module.exports = {
	Autobahn,
	sleep,
	nprint,
	Path,
}


