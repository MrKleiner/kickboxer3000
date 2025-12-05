
// kbn = KickBoxerNode
// (KickBoxer, but it's Node.js)

const electron = require('electron');
const cls_pwnage = require('../sys/class_pwnage.js');
const pathlib = require('pathlib-js').default;
const crypto_em = require('crypto');
const AdmZip = require('adm-zip');
const fs = require('fs');
const child_proc = require('child_process');


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


	cls.nprintL = function(log_level=-1, ...others){
		if (cls.constructor.MUTE_NPRINT){return};
		if ((log_level == -1) || (log_level >= (cls.constructor.NPRINT_LEVEL || 0))){
			console.log(
				`[${cls.constructor.name}]`,
				...others
			)
		}
	}
	cls.nwarnL = function(log_level=-1, ...others){
		if (cls.constructor.MUTE_NPRINT){return};
		if ((log_level == -1) || (log_level >= (cls.constructor.NPRINT_LEVEL || 0))){
			console.warn(
				`[${cls.constructor.name}]`,
				...others
			)
		}
	}
	cls.nerrL = function(log_level=-1, ...others){
		if (cls.constructor.MUTE_NPRINT){return};
		if ((log_level == -1) || (log_level >= (cls.constructor.NPRINT_LEVEL || 0))){
			console.error(
				`[${cls.constructor.name}]`,
				...others
			)
		}
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

const rnd_uuid = function(joinchar='-'){
	const bytes = crypto_em.randomBytes(16);

	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	return [
		bytes.toString('hex', 0, 4),
		bytes.toString('hex', 4, 6),
		bytes.toString('hex', 6, 8),
		bytes.toString('hex', 8, 10),
		bytes.toString('hex', 10, 16)
	].join(joinchar || '-');
}

const clampNum = function(num, min, max) {
  return num <= min 
    ? min 
    : num >= max 
      ? max 
      : num
}


const flatPromise = function(){
	const promiseFunctions = [null, null, null];

	const promiseObject = new Promise(function(resolve, reject){
		promiseFunctions[1] = resolve;
		promiseFunctions[2] = reject;
	});

	promiseFunctions[0] = promiseObject;

	return promiseFunctions;
}

const toInt32 = function(num){
	const buf = Buffer.allocUnsafe(4);
	buf.writeUint32LE(num);
	return buf
}

const isDev = function(){
	const parts = Path(__dirname).parts();
	while (parts.length){
		if (Path(parts.join('/'), 'isdev.fuck').isFileSync()){
			return true
		}
		parts.pop();
	}
	return false
}


const dlFileProgressive = async function(params){
	const fpath = Path(params.targetFilePath);
	await fpath.unlink();

	const res = await fetch(params.srcURL);

	if (!res.ok){
		throw new Error(`HTTP ${res.status}`)
	};

	await fpath.open({
		'flags': 'a',
		'ensureExists': true,
	});

	const reader = res.body.getReader();

	let done = false;

	const total = parseInt(
		res.headers.get('Content-Length') || 0
	);
	let prog = 0;

	while (!done) {
		const {value, done: readDone} = await reader.read();
		done = readDone;
		if (value) {
			prog += value.length;
			params?.dlProgressCallback?.(prog / total);

			await fpath.write(
				value, 0, value.length, null, false
			);
		}
	}

	await fpath.close();

	return true
}


const downloadFFMPEG = async function(params){
	console.log('Downloading FFMPEG...');

	const targetDir = Path(params.targetDir);

	fs.mkdirSync(targetDir.toString(), {
		recursive: true
	})

	const dlFilepath = targetDir.join('dl.zip');
	const ffmpegFilePath = targetDir.join('ffmpeg.exe');
	const ffprobeFilePath = targetDir.join('ffprobe.exe');
	const ffplayFilePath = targetDir.join('ffplay.exe');

	await ffmpegFilePath.unlink();
	await ffprobeFilePath.unlink();
	await ffplayFilePath.unlink();

	await dlFileProgressive({
		'srcURL': 'https://github.com/GyanD/codexffmpeg/releases/download/8.0.1/ffmpeg-8.0.1-full_build.zip',
		'targetFilePath': dlFilepath,
		'dlProgressCallback': params.dlProgressCallback,
	})

	const zipBuf = new AdmZip(
		await dlFilepath.readFile()
	)

	await ffmpegFilePath.writeFile(
		zipBuf.readFile('ffmpeg-8.0.1-full_build/bin/ffmpeg.exe')
	)
	await ffprobeFilePath.writeFile(
		zipBuf.readFile('ffmpeg-8.0.1-full_build/bin/ffprobe.exe')
	)
	await ffplayFilePath.writeFile(
		zipBuf.readFile('ffmpeg-8.0.1-full_build/bin/ffplay.exe')
	)

	await dlFilepath.unlink();
}


const runProc = async function(bin_path, params, pipe_data, buf_only=false){
	const text_decoder = new TextDecoder();

	const [promise, resolve, reject] = flatPromise();
	const stdio = {'stdio': pipe_data?.proc_params}
	const proc = child_proc.spawn(
		bin_path,
		params,
		pipe_data ? stdio : {}
	);

	const status = {
		'stdout': [],
		'stderr': [],
		'stdbuf': [],
		'exit_code': null,
	}

	proc.stdout.on('data', function(data){
		if (!buf_only){
			try{status.stdout.push(text_decoder.decode(data))}catch{};
		}
		status.stdbuf.push(data);
	})

	proc.stderr.on('data', function(data){
		try{status.stderr.push(text_decoder.decode(data))}catch{};
	})

	proc.on('close', function(code){
		status.exit_code = code;
		resolve(true);
	})

	if (pipe_data){
		let idx = 3;
		for (const pipe_buf of pipe_data.bufs){
			proc.stdio[idx].write(
				Buffer.from(pipe_buf)
			)
			proc.stdio[idx].end();
			idx += 1;
		}
	}

	await promise;

	return {
		'stderr': status.stderr,
		'stdout': status.stdout,
		'stdbuf': Buffer.concat(status.stdbuf),
		'code':   status.exit_code,
	}
}


module.exports = {
	Autobahn,
	sleep,
	nprint,
	Path,
	clampNum,
	flatPromise,
	toInt32,
	rnd_uuid,
	isDev,
	dlFileProgressive,
	downloadFFMPEG,
	runProc,
}


