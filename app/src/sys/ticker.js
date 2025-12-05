
const { ipcRenderer } = require('electron');


const _ticker = {
	sys_pool: {},
	syskill: false,
	kb_at: {
		'server_service': null,
	},
};


const STFU = true;



const AddrPicker = class {
	constructor(cfg){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.cfg = cfg;
		self.dom = $(`<select></select>`)[0];
		$(self.dom).append('<option value="">---------------</option>');
		self.dom.onchange = function(){
			self.exec_callback()
		}
		self.dom.onfocus = function(){
			self.resync()
		}
	}

	exec_callback(self){
		return self.cfg?.callback?.(self, self.dom.value)
	}

	resync(self){
		// $(tplate.elem).append('<option value="">--</option>');
		$(self.dom).find('option:not([value=""])').remove();
		for (const ip of ksys.util.list_ip_interfaces(false)){
			$(self.dom).append(`
				<option value="${ip.lower()}">${ip.lower()}</option>
			`)
		}
	}
}





// ============================================================
// ------------------------------------------------------------
//                   Fancy UDP integration
// ------------------------------------------------------------
// ============================================================

// Spoiler: everything below will work exponentially worse,
// than the previous ticker

// It's very important to kill functions,
// that run in a loop
const kb_atat_listen_pool = new Set();

const valid_commands_list = [
	0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
];



// This function creates a promise
// and returns a dict with two keys:
//     - 'lock':     Promise itself
//     - 'release':  Its resolve function

// This does nothing, but help avoid 2 extra
// levels of identation

// Todo: this is a bootleg hack
const create_promise_lock = function(){
	const lock_data = {
		'release': null,
		'lock': null,
	}

	const p_lock = new Promise(
		function(resolve, reject){
			lock_data.release = resolve;
		}
	)

	lock_data.lock = p_lock;

	return lock_data
}

const kbat_iff_data = {
	'header': {
		'out': [73, 73],
		'in':  [37, 37],
	}
}



// exec_cmd returns the following stuff:
// It tells the status of a command.
// For better readability it should be referenced as
// cmd_exec_reply_*
// This concept is represented through a dict with the following keys:
// - received (bool):
//   Internal data remnant. Indicates whether there was a response or not.
// - error (String || Object):
//   This key is only present when there was an error
//   during the command's execution.
//   The most common error is a string 'timed_out',
//   which occurs both when send or receive has timed out.
//   When send times out - there's nothing that can be done
//   and it's simply displayed as a fatal error both in console
//   and GUI.
//   If send times out - there's a very critical internal fault
//   somewhere and ideally, the controller should be restarted.
// 
// - msg_data (dict || null):
//   Is either null or the following dict:
//       - data_buff (Uint8Array):
//         Raw data buffer with iff removed (sliced).
//         The buffer is sliced at all times, regardless
//         of whether the iff check passed or not.
//       - iff (Array):
//         The result of slicing the raw input buffer.
//         As was described above, which should result into
//         an array of 2 integers, such as [37, 37]
//       - iff_pass (Bool):
//         Whether the first two bytes of the message match
//         the standard iff header ([73, 73]).

// send_cmd is very simple and returns a dict
// with the following keys:
// - sent (Bool):
//   Speculated to be always true for some reason.
//   Indicates whether the payload was sent.
// - error:
//   This key is only present, when there was an error
//   during js execution.

const KbAtCMDGateway = class{
	// This is useless, but at the same time rather important:
	// This is JS execution timeout
	static js_execution_timeout = 9000;

	// important todo: it appears, that a timeout of 2 seconds
	// is an absolute minimum, because AT-AT seems to choke
	// when there are multiple streams of commands being
	// stuffed in it.
	// static recv_timeout = 800;
	static recv_timeout = 2000;

	// todo: is this the right place for these functions ?

	// Convert an array of uint16 numbers (OR a single number) to electron Buffer class
	static uint16_buf(input_data, endian='LE'){
		// print('To uint16 input data:', input_data)
		if (!Number.isInteger(input_data) && !Array.isArray(input_data)){
			throw new Error('Invalid data supplied to uint16_buf');
		}

		// todo: do let buf = null and then create it in the required way
		// const buf = Buffer.alloc(2 * input_data?.length || 1);
		let buf = null;

		if (Array.isArray(input_data)){
			buf = Buffer.alloc(2 * input_data.length);
			let offs = 0;
			for (const uint of input_data){
				if (endian == 'BE'){
					buf.writeUInt16BE(int(uint));
				}else{
					buf.writeUInt16LE(int(uint));
				}
				
				offs += 2;
			}
		}else{
			buf = Buffer.alloc(2);
			if (endian == 'BE'){
				buf.writeUInt16BE(int(input_data));
			}else{
				buf.writeUInt16LE(int(input_data));
			}
		}

		return buf
	}

	// Get vmix port as uint16 array
	static vmix_port_as_uint16(){
		return KbAtCMDGateway.uint16_buf(
			int(ksys.context.global.cache.vmix_port)
		)
	}

	// Shared utility function for easy payload construction
	// This does nothing, but construct a payload
	// And send it to the provided UDP socket.
	// If this function times out - there's a fatal internal error
	// And there's nothing that can be done really.
	static async send_cmd(addr_data, cmd_id, data_chunks){
		if (!valid_commands_list.includes(cmd_id)){
			console.warn(
				'send_cmd: Command with an ID of', cmd_id,
				'was not found in the command registry:',
				'further execution might fail.'
			)
		}

		// Command ID is a single byte signed int,
		// which means it cannot be greater than 255 or less than 0
		if (cmd_id > 255 || cmd_id < 0){
			throw new Error(
				`send_cmd: Fatal Error: Invalid command ID supplied to KbAtCMDGatewaysend_cmd: ${cmd_id}`
			);
		}

		// Create the payload
		const buffer_array = [
			Buffer.from(kbat_iff_data.header.out),
			Buffer.from([cmd_id]),
		];

		// Convert input data to Buffer classes
		for (const chunk of (data_chunks || [])){
			// Todo: actual type check, instead of this retarded
			// try catch
			try{
				buffer_array.push(
					Buffer.from(chunk)
				)
			}catch(e){
				buffer_array.push(
					Buffer.from([chunk])
				)
			}
		}

		// Concat the array of resulting buffers into a single buffer
		// Thus, creating a final payload
		const payload = Buffer.concat(buffer_array);

		// debug
		// print('send_cmd: CMD constructed payload:', payload)

		// This is returned by this function
		// 'error' key will appear, if there's an error
		const cmd_status = {
			'sent': false,
		};

		// Avoiding 666 levels of nesting
		// (see definition for descirption)
		const linear_lock = create_promise_lock();

		// Execute the command
		if (addr_data.port){
			addr_data.skt.send(
				payload,
				addr_data.port,
				addr_data.ip,
				function(err){
					if (err){
						print('send_cmd: CMD Send errored:', err);
						cmd_status.sent = false;
						cmd_status.error = err;
					}else{
						// debug
						// print('send_cmd: CMD Send ok');
						cmd_status.sent = true;
					}

					linear_lock.release();
				}
			)
		}


		// Create a timeout.
		// It's SPECULATED, that this is absolutely useless,
		// because it does nothing, but timeout the js
		// execution time and not the actual UDP shit
		setTimeout(
			function(){
				if (!cmd_status.sent){
					// Broadcast errors everywhere
					console.error(
						'Fatal error:',
						'The CMD gateway timed out on sending the command',
					)
					ksys.info_msg.send_msg(
						`Fatal internal KB AT-AT error: send timed out`,
						'err',
						9000
					);

					// Todo: use a special class instead of 'timed_out' string ?
					cmd_status.error = 'timed_out';
				}

				// Release the lock
				linear_lock.release();
			},
			// Timeout time
			KbAtCMDGateway.js_execution_timeout
		)

		await linear_lock.lock;
		return cmd_status
	}

	// Shared utility function for easy response evaluation
	static msg_in_iff_pipe(msg_buf){
		const payload_splice = {
			'iff':      [msg_buf[0], msg_buf[1]],
			'data_buf': msg_buf.slice(2),
		}

		const is_friend = (
			payload_splice.iff[0] == kbat_iff_data.header.in[0]
			&&
			payload_splice.iff[1] == kbat_iff_data.header.in[1]
		)

		payload_splice.iff_pass = is_friend;

		if (!is_friend){
			console.warn(
				'Invalid IFF in:', payload_splice.iff
			)
		}

		return payload_splice
	}

	// Execute a command with timeouts
	// This function does 2 retries, before giving up
	// and returning a fail
	// The amount of retries is not indicated anywhere
	static async exec_cmd(addr, cmd_id, data_chunks){
		const test = lizard.rndwave();
		for (const retry of range(2)){
			if (!STFU){
				console.warn(
					'exec_cmd: retry №', retry + 1, 'of', 2,
					'Sending cmd', cmd_id,
					'With data', data_chunks,
					test
				);
			}

			const linear_lock = create_promise_lock();
			const skt = dgram.createSocket('udp4');

			const recv_status = {
				'received': false,
				'msg_data': null,
			}

			skt.on(
				'message',
				function(msg_buf, rinfo){
					// important todo: Apparently, this still triggers
					// if there was a reply after all the timeouts.
					// This is good, but does not represent the expected behaviour, so...
					// Make this not trigger, if the timeout was reached.
					if (recv_status.error == 'timed_out'){
						console.error(
							'exec_cmd: received a reply after timeout on retry №',
							retry + 1, 'of', 2,
							'With the following data', msg_buf, rinfo,
							test
						)
						return
					}

					console.warn(
						'exec_cmd: received a reply on retry №', retry + 1, 'of', 2,
						'With the following data', msg_buf, rinfo,
						test
					);
					recv_status.received = true;
					recv_status.msg_data = KbAtCMDGateway.msg_in_iff_pipe(msg_buf);
					// print('Eval msg data:', recv_status.msg_data)
					linear_lock.release();
				}
			)

			const addr_data = {
				'skt':  skt,
				'ip':   addr[0],
				'port': addr[1],
			}

			const cmd_send_status = await KbAtCMDGateway.send_cmd(
				addr_data, cmd_id, data_chunks
			);

			setTimeout(
				function(){
					if (!recv_status.received){
						if (!STFU){
							console.error(
								'exec_cmd: Timed out on waiting for the reply',
								'on retry №', retry + 1, 'of', 2, '. Where payload had the following data:',
								'Command id:', cmd_id, 'Payload:', data_chunks,
								test
							)
						}

						// Todo: use a special class instead of 'timed_out' string ?
						recv_status.error = 'timed_out';

						// important todo: this crashes the AT-AT
						// try{
						// 	skt.close();
						// }catch(e){
						// 	console.error(
						// 		`Couldn't close a timed out socket`, test, 'because', e
						// 	)
						// }
					}

					// Release the lock
					linear_lock.release();
				},
				// Timeout time
				KbAtStatusWatcher.recv_timeout
			)

			// Wait for the command to go through
			await linear_lock.lock;

			// If the command failed for ANY reason - retry
			if (!recv_status.received && retry != 1){
				continue
			}

			return recv_status
		}
	}
}


// This class does not utilize exec_cmd from KbAtCMDGateway,
// Because it has its own custom execution logic.
// This is a standalone, non-global class, which makes it
// easy to track whether the AT-AT service is reachable or not.

// 'callback' is a function to call on each ping regardless of its success.
// This function receives a dict with the following keys:
// - ok (Bool):
//   The service is reachable.
// - error (str || object):
//   For now can only contain 'timed_out'
const KbAtStatusWatcher = class{

	// The actual UDP timeout
	// important todo: see KbAtCMDGateway's comment on this
	// static recv_timeout = 800;
	static recv_timeout = 2000;

	constructor(atat_ip, atat_port, callback){
		const self = this;

		// This is utterly fucking retarded,
		// but is actually fine...
		self.terminate = function(){
			self.terminated = true;
		}

		if (!atat_port){
			console.error(
				'Invalid port supplied to status watcher',
				'further execution might not go through',
				atat_port
			)
		}

		self.echo_timeout = 700;

		self.ip = atat_ip;
		self.port = atat_port;
		self.callback = callback;

		self.terminated = false;

		self.returning_msg_callback = null;

		self.skt = null;

		self.restart(self);
		self.main(self);

		// Fuck js
		{
			self.terminate = function(){
				return self._terminate(self);
			}
		}
	}

	restart(self){
		if (self.terminated){
			console.error('This watcher is terminated');
			return
		}
		self.skt = dgram.createSocket('udp4');

		// Listen for returning messages
		self.skt.on(
			'message',
			function(msg_buf, rinfo){
				// debug
				// print('KB AT-AT status watcher received message:', msg_buf, rinfo);
				if (!self.returning_msg_callback){
					console.error(
						'KB AT-AT status watcher received message,',
						'but no callback was scheduled',
						self.recv_callback
					)
					return
				}
				self.returning_msg_callback(msg_buf, rinfo);
			}
		)
	}

	async main(self){
		while (true){
			await ksys.util.sleep(1000);

			if (self.terminated){return};

			const linear_lock = create_promise_lock();

			// Echo status
			// 'error' key would appear, if there was an error
			// todo: pass this to the callback
			const recv_status = {
				'received': false,
				'msg_data': null,
			}

			self.returning_msg_callback = function(msg_buf, rinfo){
				recv_status.received = true;
				recv_status.msg_data = KbAtCMDGateway.msg_in_iff_pipe(msg_buf);
				// print('Eval msg data:', recv_status.msg_data)
				linear_lock.release();
			}

			const addr_data = {
				'skt':  self.skt,
				'ip':   self.ip,
				'port': self.port,
			}

			// todo: make a few retries
			const cmd_send_status = await KbAtCMDGateway.send_cmd(
				addr_data, 9, []
			);

			// Actual UDP timeout (bootleg)
			setTimeout(
				function(){
					if (!recv_status.received && !self.terminated){
						// todo: this console error is for debug only
						console.error(
							'Status Watcher timed out on waiting for the reply',
						)
						// Todo: use a special class instead of 'timed_out' string ?
						recv_status.error = 'timed_out';
					}

					// Release the lock
					linear_lock.release();
				},
				// Timeout time
				KbAtStatusWatcher.recv_timeout
			)

			// Wait for the command to go through
			await linear_lock.lock;

			if (self.terminated){return};

			const callback_wrap = function(data){
				try{
					self.callback(data)
				}catch(err){
					console.error(
						'Status Watcher erorred while executing target callback:',
						err
					)
				}
			}

			// Evaluate the situation
			// todo: actually do the evaluation
			if (!recv_status.received){
				callback_wrap({
					'ok':    false,
					'error': recv_status.error,
				});
				console.error('Timed out on status watch, restarting')
				self.restart(self);
				continue
			}

			callback_wrap({
				'ok': recv_status.msg_data.data_buf[0] === 0,
			});
		}
	}

	_terminate(self){
		self.terminated = true;
	}
}



// Class for direct manipulations with ticker

// todo: there's a very confusing mix of places
// vmix ip/at_at ip/at_at port is taken from.
const KbAtTicker = class{
	constructor(cfg){
		const self = this;

		self.id = cfg.id;
		self.ip = cfg.ip;
		self.port = cfg.port;

		// self.tgt_url = vmix.talker.create_url(cfg.url_params);
		self.tgt_url = cfg.url_params;

		// Timings syntax:
		// {
		// 	'start': [255, 59],
		// 	// Optional
		// 	'end': [255, 59],
		// }

		self.time = {
			'minutes': 0,
			'seconds': 0,
		}

		// Both minutes and seconds are mandatory, for now,
		// aka this [35,] is invalid
		self.timings = cfg.timings;

		// Trigger this once the timer ends
		self.finish_callback = cfg.end_callback;

		// todo: Better logistics for this.
		// feng-shui suggests, that it's very stupid not
		// to do/expect this by default
		self.echo_callback = cfg.echo_callback;

		// udp socket for subbing
		self.echo_sub_skt = null;

		// udp socket for end event
		self.end_skt = null;

		// Termination is fatal and final
		// The class becomes completely locked
		self.terminated = false;

		// Just a pause
		self.paused = false;

		self.running = true;

		// todo: Fuck javascript ?
		{
			self.start = async function(auto_attach=true, auto_echo_sub=true){
				return await self._start(self, auto_attach, auto_echo_sub)
			}
			self.resume = async function(){
				return await self._resume(self)
			}
			self.pause = async function(){
				return await self._pause(self)
			}
			self.terminate = async function(){
				return await self._terminate(self)
			}
			self.get_curtime = async function(){
				return await self._get_curtime(self)
			}
			self.resub_to_echo = async function(){
				return await self._resub_to_echo(self)
			}
			self.resub_to_end = async function(){
				return await self._resub_to_end(self)
			}
			self.resume_from_offset = async function(timings){
				return await self._resume_from_offset(self, timings)
			}
		}

	}

	// todo: what would be a not naive status check?
	static naive_status_ok(cmd_exec_reply_data){
		return (
			// First check if the message fully went through
			cmd_exec_reply_data.received &&
			// Then check details
			cmd_exec_reply_data?.msg_data?.iff_pass &&
			!cmd_exec_reply_data?.error
		)
	}

	// Convert reply buffer to time dict
	static exec_reply_buf_to_time_dict(cmd_exec_reply_data){
		return {
			'minutes': cmd_exec_reply_data.msg_data.data_buf[2],
			'seconds': cmd_exec_reply_data.msg_data.data_buf[3],
		}
	}


	// auto_attach = automatically attach target URL
	// auto_sub = automatically sub to timer progress echo
	async _start(self, auto_attach=true, auto_echo_sub=true){
		// Contains cmd_exec_reply_* dicts:
		// attach
		// start
		// sub

		// todo: actually use this
		const exec_status = {};

		// Attach target URL BEFORE launching the ticker 
		if (auto_attach){
			// const cmd_exec_reply_attach = await KbAtCMDGateway.exec_cmd(
			exec_status.attach = await KbAtCMDGateway.exec_cmd(
				[self.ip, self.port],
				5,
				[
					self.id,
					ksys.context.global.cache.vmix_ip.split('.').map(function(e){return int(e)}),
					KbAtCMDGateway.vmix_port_as_uint16(),
					self.tgt_url,
				]
			)
		}

		// Actually launch the ticker
		exec_status.start = await self._resume_from_offset(self, self.timings);

		// Subscribe to progression echo
		if (auto_echo_sub){
			exec_status.sub = await self._resub_to_echo(self);
			await self._resub_to_end(self);
			print('Auto sub cmd echo:', exec_status.sub);
		}

		console.warn(
			'KbAtTicker._start: Compound status:', exec_status
		)

		return exec_status;
	}

	async _pause(self){
		const cmd_exec_reply = await KbAtCMDGateway.exec_cmd(
			[self.ip, self.port],
			2,
			[self.id,]
		)

		print('_pause: Pause CMD echo:', cmd_exec_reply);

		return {
			'reply_data': cmd_exec_reply,
			// A very naive status check
			'ok': KbAtTicker.naive_status_ok(cmd_exec_reply)
		};
	}

	async _resume(self){
		const cmd_exec_reply = await KbAtCMDGateway.exec_cmd(
			[self.ip, self.port],
			3,
			[self.id,]
		)

		print('_resume: Resume CMD echo:', cmd_exec_reply);

		return {
			'reply_data': cmd_exec_reply,
			// A very naive status check
			'ok': KbAtTicker.naive_status_ok(cmd_exec_reply)
		};
	}

	async _terminate(self){
		const cmd_exec_reply = await KbAtCMDGateway.exec_cmd(
			[self.ip, self.port],
			4,
			[self.id,]
		)

		self.terminated = true;

		print('_terminate: Terminate CMD echo:', cmd_exec_reply);

		return {
			'reply_data': cmd_exec_reply,
			// A very naive status check
			'ok': KbAtTicker.naive_status_ok(cmd_exec_reply)
		};
	}

	async _get_curtime(self){
		const cmd_exec_reply = await KbAtCMDGateway.exec_cmd(
			[self.ip, self.port],
			6,
			[self.id,]
		)
		print('_get_curtime CMD echo:', cmd_exec_reply);

		const is_ok = KbAtTicker.naive_status_ok(cmd_exec_reply);

		let time = null;

		if (is_ok){
			time = KbAtTicker.exec_reply_buf_to_time_dict(cmd_exec_reply);
		}

		return {
			'reply_data': cmd_exec_reply,
			'ok': is_ok,
			'time': time,
		}
	}

	async _resub_to_echo(self){
		// Try closing previous socket
		try{
			const close_lock = create_promise_lock();
			self.echo_sub_skt.close(
				function(){
					close_lock.release()
				}
			);
			await close_lock.lock;
		}catch(e){
			console.warn(
				'Could not close previous echo listen socket, because', e
			)
		}

		// Create new listen socket
		self.echo_sub_skt = dgram.createSocket('udp4');

		// Bind msg receive
		self.echo_sub_skt.on(
			'message',
			function(msg_buf, rinfo){
				const piped_msg_data = KbAtCMDGateway.msg_in_iff_pipe(msg_buf);
				// debug
				// print('KB AT-AT received timer echo:', msg_buf, piped_msg_data, rinfo);
				if (piped_msg_data == 2){
					self.time.minutes = piped_msg_data[2];
					self.time.seconds = piped_msg_data[3];
				}
				if (!self.terminated){
					self?.echo_callback?.(piped_msg_data, rinfo);
				}else{
					console.warn(
						'Tried executing echo callback on a terminated AT-AT ticker'
					);
				}
			}
		)

		// Bind the socket
		const bind_wait_lock = create_promise_lock();
		self.echo_sub_skt.bind(
			0,
			function(){
				bind_wait_lock.release()
			}
		)
		await bind_wait_lock.lock;


		// Politely (at a gunpoint) ask AT-AT to share its stuff
		const cmd_sub_echo = await KbAtCMDGateway.exec_cmd(
			[self.ip, self.port],
			7,
			[
				// Ticker id
				self.id,

				// Supply this machine's local IPV4 address to the AT-AT
				// (true = as integers, not string)
				// important todo: why is this broken
				ksys.context.global.cache.atat_return_addr || ksys.util.get_local_ipv4_addr(true),
				// [127, 0, 0, 1],

				// Supply the port the UDP receiver is listening on
				// to the AT-AT
				KbAtCMDGateway.uint16_buf(
					self.echo_sub_skt.address().port
				),
			]
		)
		print('Subscribe CMD echo:', cmd_sub_echo);

		return cmd_sub_echo;
	}

	async _resub_to_end(self){
		// Try closing previous socket
		try{
			const close_lock = create_promise_lock();
			self.end_skt.close(
				function(){
					close_lock.release()
				}
			);
			await close_lock.lock;
		}catch(e){
			console.warn(
				'Could not close previous end listen socket, because', e
			)
		}

		// Create new listen socket
		self.end_skt = dgram.createSocket('udp4');

		// Bind msg receive
		self.end_skt.on(
			'message',
			function(msg_buf, rinfo){
				console.error(
					'Received end from AT-AT',
				)
				print('KB AT-AT received timer end:', msg_buf, rinfo);
				if (!self.terminated){
					self?.finish_callback?.(msg_buf, rinfo);
				}else{
					console.warn(
						'Tried executing end callback on a terminated AT-AT ticker'
					);
				}
			}
		)

		// Bind the socket
		const bind_wait_lock = create_promise_lock();
		self.end_skt.bind(
			0,
			function(){
				bind_wait_lock.release()
			}
		)
		await bind_wait_lock.lock;


		// Politely (at a gunpoint) ask AT-AT to share its stuff
		const cmd_exec_reply = await KbAtCMDGateway.exec_cmd(
			[self.ip, self.port],
			8,
			[
				// Ticker id
				self.id,

				// Supply this machine's local IPV4 address to the AT-AT
				// (true = as integers, not strings)
				ksys.context.global.cache.atat_return_addr || ksys.util.get_local_ipv4_addr(true),
				// [127, 0, 0, 1],

				// Supply the port the UDP receiver is listening on
				// to the AT-AT
				KbAtCMDGateway.uint16_buf(
					self.end_skt.address().port
				),
			]
		)
		print('Subscribe CMD echo:', cmd_exec_reply);

		return cmd_exec_reply;
	}

	// This is also used to launch the timer in the first place
	// Have a better name for this function?
	// Please comment on github
	async _resume_from_offset(self, timings){
		return await KbAtCMDGateway.exec_cmd(
			[self.ip, self.port],
			1,
			[
				self.id,
				timings.start,
				timings.end || [255, 59],
			]
		)
	}
}



const _bury_bodies = function(){
	for (const status_watcher of kb_atat_listen_pool){
		if (status_watcher.terminated){
			kb_atat_listen_pool.delete(status_watcher);
		}
	}
}

_ticker.kb_at.clear_receivers = async function(){
	return
	const cmd_exec_reply_clear = await KbAtCMDGateway.exec_cmd(
		[ksys.context.global.cache.vmix_ip, int(ksys.context.global.cache.atat_port)],
		10,
	)
	
	if (!STFU){
		// todo: change to print
		console.error(
			'Commandeered AT-AT to clear all receivers',
			cmd_exec_reply_clear
		)
	}
}

// Perform a couple VERY important actions
_ticker.kb_at.sys_restart = async function(){
	return
	// First - kill all watchers
	for (const status_watcher of kb_atat_listen_pool){
		try{
			status_watcher.terminate();
		}catch(e){}
	}
	_bury_bodies();

	// Now, command the AT-AT to fuckoff
	await _ticker.kb_at.clear_receivers();
}

// NEVER instantiate KbAtStatusWatcher by hand !!
// There are loops, that will keep running forever if you loose
// reference to their terminate function.

// This function ensures, that such phantom problems do not happen.
_ticker.kb_at.StatusWatcher = function(){
	return
	// important todo: does it make sense, that this is here?
	_bury_bodies();

	const the_ticker = new KbAtStatusWatcher(...arguments);
	kb_atat_listen_pool.add(the_ticker);
	return the_ticker
}





// _ticker.kb_at.StatusWatcher = KbAtStatusWatcher;
_ticker.kb_at.AtAtTicker = KbAtTicker;
_ticker.kb_at.AddrPicker = AddrPicker;








// ============================================================
// ------------------------------------------------------------
//               Even Fancier Node IPC Shit
// ------------------------------------------------------------
// ============================================================

const NodeAtAtBundestag = class{
	constructor(pipe){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#AB78FF',
		);

		self.pipe = pipe[0];

		self.nprint('Attached to autobahn', pipe, self);

		self.attachments = {};

		self.pipe.onmessage = function(msg){
			// self.nprint('Got autobahn message:', msg.data);
			self.attachments[msg.data.clock_data.id]?.[msg.data.broadcast_tgt]?.(msg.data.clock_data);
		}
	}

	static async sys_init(){
		return new Promise(function(resolve, reject){
			ipcRenderer.invoke('kbn.atat.autobahn', {
				'cmd_id': 'attach',
				'data': {},
			});

			ipcRenderer.on('kb.atat.accept_autobahn', function(evt, data){
				print('Got attach request', evt, data);
				_ticker.bundestag = new _ticker.NodeAtAtBundestag(evt.ports);
				resolve(true);
			})
		});
	}

	attach(self, params){
		self.nprint('Attached', params, 'to', self);
		let attachment_dict = self.attachments[params.clock_id];
		if (!attachment_dict){
			attachment_dict = {}
			self.attachments[params.clock_id] = attachment_dict;
		}

		attachment_dict.tick = params.tick || attachment_dict.tick;
		attachment_dict.end = params.end || attachment_dict.end;
	}

	create_clock(self, params){
		return ipcRenderer.invoke('kbn.atat.clock', {
			'cmd_id': 'create',
			'data': params,
		});
	}

	edit_clock(self, params){
		return ipcRenderer.invoke('kbn.atat.clock', {
			'cmd_id': 'edit',
			'data': params,
		});
	}

	read_clock(self, clock_id){
		return ipcRenderer.invoke('kbn.atat.clock', {
			'cmd_id': 'read',
			'data': {
				'clock_id': clock_id,
			},
		});
	}

	reset_clock(self, clock_id){
		return ipcRenderer.invoke('kbn.atat.clock', {
			'cmd_id': 'reset',
			'data': {
				'clock_id': clock_id,
			},
		});
	}
}

_ticker.NodeAtAtBundestag = NodeAtAtBundestag;






module.exports = _ticker;

