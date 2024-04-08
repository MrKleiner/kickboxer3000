
const _ticker = {
	sys_pool: {},
	syskill: false,
	kb_at: {
		'server_service': null,
	},
};

const _stfu = true;

class _kb_ticker{
	constructor(params){

		if (!params){
			console.error('Ticker: Invalid params', params)
			return
		}

		const defprms= {
			'duration':     7,
			'name':         null,
			'infinite':     false,
			'offset':       0,
			'speed':        250,
			'round':        false,
			'wait':         false,
			'callback':     null,
			'reversed':     false,
			'loopcallback': null,
		}

		const config = { ...defprms, ...params };

		this.duration 	=           config['duration'];
		this.timer_name =           config['name'];
		this.infinite =             config['infinite'];
		this.offset =               config['offset'];
		// this.tickspeed =            config['speed'];
		this.heartbeat =            250;
		this.round =                config['round'];
		this.wait_for_callback =    config['wait'];
		this.callback_func =        config['callback'];
		this.reversed =             config['reversed'];


		// sys shit
		this.alive = true;
		this.killed = false;
		this.paused = false;
		this.fired = false;
		// the Promise to await inside pause
		this.pause_promise = null;
		// the resolve function to resolve the awaited Promise
		this.pause_promise_resolve = null;


		// tick
		// this.global_tick = 0 + this.offset;
		this.global_tick = 0;
	}

	fire(){
		// useless safety margins ?
		if (!this.callback_func || this.fired == true){
			console.warn('Invalid timer config', this)
			return 'dead_timer'
		}
		
		// mark this timer as fired. It's impossible to call fire() if the timer was already fired
		this.fired = true;

		// the holy hand grenade
		// important todo: so should it be let or const ?
		const self = this;

		// The timer has a heartbeat of 250ms between pulses
		// Each one of these ticks returns the actual time
		// by subtracting the newly constructed date from the zero mark
		this.zero = (new Date()).getTime();

		if(!_stfu){print('zero and offs:', this.timer_name, (new Date()).getTime(), this.zero, this.offset)};

		return new Promise(async function(resolve, reject){
			let last_tick = self.global_tick;

			// wait for callback function to complete, if asked
			// if (self.wait_for_callback == true){
			// 	await self.callback_func(self.tick)
			// }else{
			// 	self.callback_func(self.tick)
			// }

			while (self.alive == true && ((self.global_tick < self.duration) || self.infinite == true)){

				// global timer
				let new_tick = Math.ceil(
					((new Date()).getTime() - self.zero) / 1000
				);

				if (self.paused == true){
					await self.pause_promise
					self.zero = (new Date()).getTime();
					new_tick = Math.ceil(
						((new Date()).getTime() - self.zero) / 1000
					);
					last_tick = 0;
				}

				if(!_stfu){print('New tick:', new_tick, self.global_tick)};

				// only trigger callback if 1 second has passed
				if(!_stfu){print('Last and New:', last_tick, new_tick)};
				if (last_tick != new_tick){
					// wait for callback function to complete, if asked
					if (self.wait_for_callback == true){
						await self.callback_func(self.tick)
					}else{
						self.callback_func(self.tick)
					}

					self.global_tick += 1;
					last_tick += 1;
				}

				// wait before executing next iteration
				await ksys.util.sleep(self.heartbeat)
			}

			if(!_stfu){print('terminating timer:', self.timer_name, self.alive, self.zero, self.offset, self.global_tick, self.duration)};
			if(!_stfu){print('while status:', (self.alive == true && ((self.global_tick < self.duration) || self.infinite == true)))};

			self.alive = false;
			if(!_stfu){print('whoami', self)};
			resolve(self)
			return
		});
	}


	force_kill(){
		if(!_stfu){print('ROOT OF THE FUCKING PROBLEM', this)};
		if(!_stfu){console.trace()};
		
		this.alive = false;
		this.killed = true;
		// delete window.ksys.ticker.sys_pool[this.timer_name];
		return null
	}

	get pause(){
		return this.paused;
	}

	_pause(){
		// todo: Fuck javascript. Retarded shit
		const self = this;
		// important: overwriting unresolved pause promise with a new one will fuck everything up
		if (!this.paused){
			this.pause_promise = 
			new Promise(function(resolve, reject){
				self.pause_promise_resolve = resolve;
			});
		}
		this.paused = true;
	}

	_resume(){
		if (this.fired == false){
			this.fire()
		}
		this.paused = false;
		if (this.pause_promise_resolve){
			this.pause_promise_resolve()
		}
	}

	// todo: does it really has to be a property ?
	// What would be a use case for this ?
	set pause(state='toggle'){
		if (state == 'toggle'){
			if (this.paused){
				this._resume()
			}else{
				this._pause()
			}
		}

		// todo: paranoid...
		if (state == true){
			this._pause()
		}
		// todo: paranoid...
		if (state == false){
			this._resume()
		}
	}

	get callback(){
		return this.callback_func;
	}

	set callback(cb){
		if (cb){
			this.callback_func = cb;
		}else{
			console.error('Tried setting invalid callback function for ticker');
		}
	}

	get timer_duration(){
		return this.duration;
	}

	get tick(){
		if (this.reversed){
			return {
				'global':    ((this.duration - this.global_tick) + this.offset) - 1,
				'iteration': (((this.duration - this.global_tick) + this.offset) % this.duration) - 1,
				'loops':     Math.floor((this.global_tick + this.offset) / this.duration),
				'all':       this,
			}
		}else{
			return {
				'global':    (this.global_tick + this.offset) + 1,
				'iteration': ((this.global_tick + this.offset) % this.duration) + 1,
				'loops':     Math.floor((this.global_tick + this.offset) / this.duration),
				'all':       this,
			}
		}

	}

	set_global_tick(tick, trigger_callback=false){
		if (tick){
			this.global_tick = this.reversed ? (this.duration - tick) : tick;
			if (trigger_callback == true){
				this.callback_func(this.tick)
			}
		}
	}

}



_ticker.spawn = function(params)
{
	return new _kb_ticker(params)
}

_ticker.kill_all = function()
{
	return
	for (let tm in ksys.ticker.sys_pool){
		try{
			ksys.ticker.sys_pool[tm].force_kill()
			delete ksys.ticker.sys_pool[tm]
		}catch (error){}
	}
}


_ticker.pool = function()
{
	return
	var pl = {};
	for (let tm of ksys.ticker.sys_pool){
		try{
			pl[tm.name] = tm
		}catch (error){

		}
	}
	return pl
}








// ============================================================
// ------------------------------------------------------------
//                   Fancy UDP integration
// ------------------------------------------------------------
// ============================================================

// Spoiler: everything below will work exponentially worse,
// than the previous ticker


const valid_commands_list = [
	0, 1, 2, 3, 4, 5, 6, 7, 8, 9
];



// This function creates a promise
// and returns a dict with two keys:
//     - 'lock':     Promise itself
//     - 'release':  Its resolve function

// This does nothing, but help avoid 2 extra
// levels of identation

// Todo: this is a bootleg hack
const create_promise_lock = function(){
	let release = null;
	const p_lock = new Promise(
		function(resolve, reject){
			release = resolve;
		}
	)

	return {
		'release': release,
		'lock': p_lock,
	}
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
//   during execution.

const KbAtCMDGateway = class{
	// This is useless, but at the same time rather important:
	// This is JS execution timeout
	static js_execution_timeout = 9000;

	static recv_timeout = 800;

	// todo: is this the right place for these functions ?

	// Convert an array of uint16 numbers to electron Buffer class
	// OR a single number
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

		print('send_cmd: CMD constructed payload:', payload)

		// This is returned by this function
		// 'error' key will appear, if there's an error
		const cmd_status = {
			'sent': false,
		};

		// Avoiding 666 levels of nesting
		// (see definition for descirption)
		const linear_lock = create_promise_lock();

		// Execute the command
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
					print('send_cmd: CMD Send ok');
					cmd_status.sent = true;
				}

				linear_lock.release();
			}
		)

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
		for (const retry of range(2)){
			console.warn(
				'exec_cmd: retry №', retry + 1, 'of', 2,
				'Sending cmd', cmd_id,
				'With data', data_chunks,
			);

			const linear_lock = create_promise_lock();
			const skt = dgram.createSocket('udp4');

			const recv_status = {
				'received': false,
				'msg_data': null,
			}

			skt.on(
				'message',
				function(msg_buf, rinfo){
					console.warn(
						'exec_cmd: received a reply on retry №', retry + 1, 'of', 2,
						'With the following data', msg_buf, rinfo
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
						console.error(
							'exec_cmd: Timed out on waiting for the reply',
							'on retry №', retry + 1, 'of', 2
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
	static recv_timeout = 800;

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
				print('KB AT-AT status watcher received message:', msg_buf, rinfo);
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
					if (!recv_status.received){
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

	terminate(self){
		self.terminated = true;
	}
}


// Class for direct manipulations with ticker
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
		}

	}

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
			'minutes': cmd_exec_reply_data.msg_data.data_buff[4],
			'seconds': cmd_exec_reply_data.msg_data.data_buff[5],
		}
	}

	// auto_attach = automatically attach target URL
	// auto_sub = automatically sub to timer progress echo
	async _start(self, auto_attach=true, auto_echo_sub=true){
		// Contains cmd_exec_reply_* dicts:
		// attach
		// start
		// sub
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
		exec_status.start = await KbAtCMDGateway.exec_cmd(
			[self.ip, self.port],
			1,
			[
				self.id,
				self.timings.start,
				self.timings.end || [255, 59],
			]
		)

		// Subscribe to progression echo
		if (auto_echo_sub){
			exec_status.sub = await self._resub_to_echo(self);
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
			'ok': self.naive_status_ok(cmd_exec_reply)
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
			'ok': self.naive_status_ok(cmd_exec_reply)
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
			'ok': self.naive_status_ok(cmd_exec_reply)
		};
	}

	async _get_curtime(self){
		const cmd_exec_reply = await KbAtCMDGateway.exec_cmd(
			[self.ip, self.port],
			4,
			[self.id,]
		)
		print('Terminate CMD echo:', cmd_exec_reply);

		const is_ok = self.naive_status_ok(cmd_exec_reply);

		let time = null;

		if (is_ok){
			time = self.exec_reply_buf_to_time_dict(cmd_exec_reply);
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
				print('KB AT-AT received timer echo:', msg_buf, rinfo);
				self?.echo_callback?.(msg_buf, rinfo);
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
				ksys.util.get_local_ipv4_addr(true),
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
				print('KB AT-AT received timer end:', msg_buf, rinfo);
				self?.finish_callback?.(msg_buf, rinfo);
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
				ksys.util.get_local_ipv4_addr(true),
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
}



/*

// --------------------------
//       Bad garbage
// --------------------------

const KbAtServerService = class{
	constructor(listen_port=null){
		const self = this;

		if (listen_port && !Number.isInteger(listen_port)){
			throw new Error(
				'Invalid port suplied to KB AT-AT Server Service:', listen_port
			);
		}

		self.port = listen_port;

		self.skt = dgram.createSocket('udp4');

		self.callback = null;

		self.skt.on(
			'message',
			function(msg, rinfo){
				print('KB AT-AT Server Service received message:', msg, rinfo);
				if (!self.callback){
					console.warn(
						'KB AT-AT Server Service receined a message, but no callback was scheduled',
						self.callback
					)
					return
				}
				self.callback(msg, rinfo)
			}
		)
	}

	async start_service(self){
		const service_promise = new Promise(
			function(resolve, reject){
				print('KYS PLEASE')
				// self.skt.bind(
				// 	self.port || 0,
				// 	function(){
				// 		print('Bro???')
				// 		resolve()
				// 	}
				// )
				resolve()
			}
		)

		await service_promise;

		// if no target port was provided - get the one assigned
		// automatically
		if (!self.port){
			self.port = self.skt.address().port;
		}
	}
}

// Persistent receiver is basically a UDP server
// With callbacks for any received messages

const KbAtPersistentReceiver = class{
	constructor(callback=null){
		const self = this;

		if (!callback){
			throw new Error(
				'Fatal internal error: Tried creating KB AT-AT Persistent UDP Receiver with invalid callback function', callback
			);
		}

		// Store callback function
		self.callback = callback;

		// Create socket object
		self.skt = dgram.createSocket('udp4');

		// Process incoming messages
		self.skt.on(
			'message',
			function(msg, rinfo){
				self.msg_in_processor(self, msg, rinfo)
			}
		)
	}

	msg_in_processor(self, msg, rinfo){
		print('KB AT-AT Persistent received a message:', msg, rinfo);
		self.callback(msg, rinfo, self);
	}
}

// Kick Boxer Advanced Ticker
// The magic UDP .exe integration
_ticker.KbAt = class {
	constructor(ticker_id=null, tgt_ip=null, tgt_port=null){
		const self = this;

		if (!tgt_port || !tgt_ip){
			throw new Error(
				'Invalid port/IP supplied for KB AT-AT:', tgt_port, ':', tgt_ip
			);
		}

		if (!ticker_id || !Number.isInteger(ticker_id)){
			throw new Error(
				'Invalid ticker ID provided for the KB AT-AT class:', ticker_id
			);
		}

		self.tgt_port = tgt_port;
		self.tgt_addr = tgt_ip;
		self.cmd_timeout = 500;

		self.skt = null;
		self.recv_callback = null;

		// Header identificators
		// Important todo: make sure these buffers are not modified by anything
		// (solution: use get)
		self.iff_out = Buffer.from([73, 73]);
		self.iff_in = Buffer.from([37, 37]);

		// Command schedule, because UDP is retarded.
		// Place your bets on how fast this would break.
		// + 20 points to failure probability
		
		// Schedule record struct:
		// {
		// 	'cmd_id': 0,
		// 	'callback': function(response_msg, rinfo){},
		// 	'data_chunks': [],
		// }
		self.cmd_sched = [];

		self.respawn_skt(self);

		// A lock implemented through Promises
		// + 4 points to failure probability
		self.sched_lock = null;
		self.sched_lock_release = null;

		// Create initial lock.
		// ?????
		// + 1 point to failure probability
		self.create_sched_lock(self);



		// Launch the schedule loop
		self.sched_loop(self);
	}

	respawn_skt(self){
		self.skt = dgram.createSocket('udp4');

		// Listen for returning messages
		self.skt.on(
			'message',
			function(msg, rinfo){
				print('KB AT-AT received a message:', msg, rinfo);
				if (!self.recv_callback){
					console.warn(
						'KB AT-AT receined a message, but no callback was scheduled',
						self.recv_callback
					)
					return
				}
				self.recv_callback(msg, rinfo)
			}
		)
	}

	create_sched_lock(self){
		self.sched_lock = new Promise(
			function(_resolve, _reject){
				self.sched_lock_release = _resolve;
			}
		)
	}

	async sched_loop(self){
		print('Creating schedule loop');
		// Infinite fail-unsafe while true.
		// + 40 points to failure probability
		// Bonus: Global system crash chance
		while (true){
			let cmd_data = self.cmd_sched.pop();

			if (!cmd_data){
				print('Sched Loop: Awaiting next lock release');
				self.create_sched_lock(self);
				await self.sched_lock;
			}

			// Important todo:
			// Since everything is async af -
			// THE ORDER OF THESE WARNINGS AND ACTIONS MATTERS A FUCKING LOT
			if (!cmd_data){
				cmd_data = self.cmd_sched.pop();
			}

			if (self.cmd_sched.length <= 0){
				// console.error(
				// 	'Fatal Integrity Error: The schedule lock was released,',
				// 	'but the schedule length remained 0'
				// )
			}

			if (!cmd_data){
				console.error(
					'Got invalid command from command schedule:', cmd_data
				)
				continue
			}

			// if (!cmd_data || self.cmd_sched.length <= 0){
			// if (!cmd_data){
			// 	continue
			// }

			// Schedule current callback for execution
			// todo: When would be the best time to check the callback
			// for validity?
			const linear_lock = create_promise_lock();
			self.recv_callback = function(msg, rinfo){
				// Todo: should the real callback be async or sync?
				// Also, in which order should things be executed?
				// Real callback first or lock release first ?

				// Once the command went through - first execute the real callback
				new Promise(
					function(){
						cmd_data.callback(msg, rinfo);
					}
				)

				print('Sched recv callback msg:', msg)
				if (!msg.status_ok && msg.error == 'timed_out'){
					self.respawn_skt(self);
				}

				// Now release the lock, thus resuming the schedule
				linear_lock.release();
			}

			// SEND the target command to the AT-AT
			self.send_cmd(
				self,
				cmd_data.cmd_id,
				cmd_data.data_chunks
			)

			// Await AT-AT response
			await linear_lock.lock;
		}
	}

	// Command execution with timeouts
	// This ONLY sends commands
	// todo: is this utterly fucking retarded?
	// or just javascript moment?
	async send_cmd(self, cmd_id, data_chunks){
		// Useful info
		if (!valid_commands_list.includes(cmd_id)){
			console.warn(
				'Command with an ID of',
				cmd_id,
				'was not found in the command registry.',
				'This does not affect the current execution.'
			)
		}

		// Command ID is a single byte signed int,
		// which means it cannot be greater than 255 or less than 0
		if (cmd_id > 255 || cmd_id < 0){
			throw new Error(
				'Fatal Error: Invalid command ID', cmd_id
			);
		}

		// First, create the payload
		const buffer_array = [
			self.iff_out,
			Buffer.from([cmd_id]),
		];

		// Convert input data to Buffer classes
		for (const chunk of (data_chunks || [])){
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

		// Actually execute the command
		const timeout_promise = new Promise(
			function(resolve, reject){
				let payload_sent = false;

				self.skt.send(
					payload,
					self.tgt_port,
					self.tgt_addr,
					function(err){
						print('CMD Has Error', err)
						if (err){
							resolve({
								'status_ok': false,
								'error': err,
							})
						}else{
							payload_sent = true;
							resolve({
								'status_ok': true,
							})
						}
					}
				)

				setTimeout(
					function(){
						if (!payload_sent){
							resolve({
								'status_ok': false,
								'error': 'timed_out',
							})
						}
					},
					self.cmd_timeout
				)
			}
		)

		const tpromise = await timeout_promise;
		print('CMD Timeout promise:', tpromise);

		return tpromise
	}

	// Create a schedule record
	add_sched_record(self, cfg){
		// Register the command for execution
		self.cmd_sched.push(cfg);
		// Release the schedule lock and therefore
		// resume the schedule execution loop
		self.sched_lock_release();
	}

	// A set of actions to properly execute the command
	// todo: use linear lock ?
	async exec_cmd(self, cfg){
		return new Promise(
			function(resolve, reject){
				let response_received = false;
				// todo: for now - direct resolve (testing)

				// 1 - create execution echo callback
				const exec_echo_callback = function(msg, rinfo){
					response_received = true;
					print('exec_cmd -> exec_echo_callback 1');
					resolve({
						'status_ok': true,
						'msg': msg,
						'rinfo': rinfo,
					})
				}

				// 2 - schedule the command for execution
				self.add_sched_record(
					self,
					{
						'cmd_id': cfg.cmd_id,
						'data_chunks': cfg.data_chunks,
						'callback': exec_echo_callback,
					}
				)

				setTimeout(
					function(){
						if (!response_received){
							console.error('Ticker response timed out');
							resolve({
								'status_ok': false,
								'error': 'timed_out',
							})
						}
					},
					self.cmd_timeout
				)
			}
		)
	}

	// cfg struct is:
	// {
	// 	'ticker_id': 1,
	// 	'start': [255, 59],
	// 	'end': [255, 59],
	// }
	async start_ticker(self, cfg){
		// todo: Process the response
		return await self.exec_cmd(
			self,
			{
				'cmd_id': 1,
				'data_chunks': [
					cfg.ticker_id,
					cfg.start,
					cfg.end || [255, 59],
				]
			}
		)
	}


	async pause_ticker(self, ticker_id){
		// todo: Process the response
		return await self.exec_cmd(
			self,
			{
				'cmd_id': 2,
				'data_chunks': [ticker_id,],
			}
		)
	}


	async resume_ticker(self, ticker_id){
		// todo: Process the response
		return await self.exec_cmd(
			self,
			{
				'cmd_id': 3,
				'data_chunks': [ticker_id,],
			}
		)
	}

	async kill_ticker(self, ticker_id){
		// todo: Process the response
		return await self.exec_cmd(
			self,
			{
				'cmd_id': 4,
				'data_chunks': [ticker_id,],
			}
		)
	}

	// cfg struct is:
	// {
	// 	'ticker_id': 1,
	// 	'tgt_ip':    [192, 168, 1, 53],
	// 	'tgt_port':  65534,
	// 	'url_str':   '?fuckshit=nen',
	// }
	// todo: type cheks and so on
	async attach_url(self, cfg){
		// todo: Process the response
		return await self.exec_cmd(
			self,
			{
				'cmd_id': 5,
				'data_chunks': [
					cfg.ticker_id,

					cfg.tgt_ip[0],
					cfg.tgt_ip[1],
					cfg.tgt_ip[2],
					cfg.tgt_ip[3],
					cfg.tgt_port,

					cfg.url_str,
					'\0',
				],
			}
		)
	}

	async reachable(self){
		const status = await self.exec_cmd(
			self,
			{
				'cmd_id': 9,
				'data_chunks': [],
			}
		)

		try{
			return status.msg[2] === 0;
		}catch(e){
			return false
		}
	}

}

*/







_ticker.kb_at.StatusWatcher = KbAtStatusWatcher;
_ticker.kb_at.AtAtTicker = KbAtTicker;










module.exports = _ticker;





