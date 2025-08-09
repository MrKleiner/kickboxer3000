const electron = require('electron');
const cls_pwnage = require('../sys/class_pwnage.js');
const kb_util = require('../kbn/kbn_util.js');


const NodeAtAtInstance = class{
	// Heartbeat in ms
	static IMPULSE_INTERVAL = 100;
	// Don't fuck with this
	static CLOCK_SPEED_FACTOR = 1;

	GTFORMAT = true;

	constructor(init_params){
		const self = kb_util.nprint(cls_pwnage.remap(this));

		// This ticker's ID
		self.clock_id = init_params.clock_id;
		// Bundestag
		self.bundestag = init_params.bundestag;
		// KickBoxerNode
		self.kbn = init_params.kbn;

		// Various callbacks, such as: per-tick, timer end and so on...
		self.callbacks = {
			'tick': null,
			'end': null,
		};

		// Ever increasing progress number (always whole)
		self.tick = 0;
		// Current clock parameters
		self.clock_params = {
			// Clock duration. Everything has a duration
			'duration': 0,
			// Offset, so that the clock starts from n-second
			'offset': 0,
			// Target VMIX fields to be updated
			'vmix_fields': [],
			// Whether the clock should tick in reverse direction
			'reversed': false,
		};

		// Pause promise (if any)
		self.pause_promise = null;
		// Whether the timer is stopped or not
		// A stopped timer cannot be resumed. Only fired
		self.stopped = true;

		// Terminated timers cannot be manipulated in any way
		self.terminated = false;

		// The impulse machine
		self.diesel_engine = false;

		if (!self.clock_id){
			self.nerr('Ticker with no id:', self, init_params);
		}

		self.last_impulse = self.sys_time_s;
	}

	$time(self){
		let tick = self.tick + (self.clock_params.offset || 0);
		if (self.clock_params.reversed){
			tick = (
				self.clock_params.duration
				- (self.tick + (self.clock_params.offset || 0))
			);
		}
		const minutes = Math.floor(tick / 60) || 0;
		const hours = Math.floor(minutes / 60) || 0;
		const seconds = tick % 60;

		/*
		const r_tick = (
			self.clock_params.duration
			- (self.tick + (self.clock_params.offset || 0))
		);
		const r_minutes = Math.floor(r_tick / 60) || 0;
		const r_hours = Math.floor(r_minutes / 60) || 0;
		const r_seconds = r_tick % 60;
		*/

		return {
			'tick': tick,

			'total': {
				minutes,
				hours,
				seconds,
			},
			'clock': {
				'minutes': minutes % 60,
				'hours': hours % 24,
				'seconds': seconds,
			},
			/*
			'reversed': {
				'total': {
					r_minutes,
					r_hours,
					r_seconds,
				},
				'clock': {
					'minutes': r_minutes % 60,
					'hours': r_hours % 24,
					'seconds': r_seconds,
				},
			}
			*/
		}
	}

	// Send HTTP request to VMIX to update target text fields
	async update_vmix(self){
		// const time = self.clock_params.reversed ? self.time.reversed : self.time;
		const time = self.time;
		for (const field of self.clock_params.vmix_fields || []){
			self.kbn.vmix.talk({
				'Function': 'SetText',
				'Value': (
					field.tplate
					.replaceAll('%h%', time[field.count_as || 'clock'].hours.toString().padStart(field.pad, '0'))
					.replaceAll('%m%', time[field.count_as || 'clock'].minutes.toString().padStart(field.pad, '0'))
					.replaceAll('%s%', time[field.count_as || 'clock'].seconds.toString().padStart(field.pad, '0'))
				),
				'Input': field.gtzip_name,
				'SelectedName': field.text_field_name + (self.GTFORMAT ? '.Text' : ''),
			})
		}
	}

	// Send status update to browser windows
	async update_browsers(self, status_type='general'){
		if (status_type == 'tick'){
			self.bundestag.autobahn_broadcast({
				'broadcast_tgt': status_type,
				'clock_data': {
					'id': self.clock_id,
					'paused': !!self.pause_promise,
					'stopped': self.stopped,
					'terminated': self.terminated,
					'params': self.clock_params,
					'tick': self.tick,
					'time': self.time,
				},
			});
		}

		if (status_type == 'end'){
			self.bundestag.autobahn_broadcast({
				'broadcast_tgt': status_type,
				'clock_data': {
					'id': self.clock_id,
					'paused': !!self.pause_promise,
					'stopped': self.stopped,
					'terminated': self.terminated,
					'params': self.clock_params,
					'tick': self.tick,
					'time': self.time,
				},
			});
		}
	}

	// System time in seconds
	$sys_time_s(self){
		return Math.ceil(
			(new Date()).getTime() / (1000 / self.constructor.CLOCK_SPEED_FACTOR)
		)
	}

	// System time in milliseconds
	$sys_time_ms(self){
		return (new Date()).getTime()
	}

	async impulse_machine(self){
		// There can only be one impulse machine per timer
		if (self.diesel_engine){return};
		self.diesel_engine = true;

		// Create starting point
		self.last_impulse = self.sys_time_s;

		while (true){
			try{
				// Wait for pause to resolve (if any)
				await self.pause_promise;

				// Sleep in-between impulses
				await kb_util.sleep(self.constructor.IMPULSE_INTERVAL);

				if (self.terminated){return};

				// todo: Is this really necessary?
				if (self.stopped){continue};

				self.nprint('IMPULSE', self.clock_id);

				// Check if a second has passed
				const current_impulse = self.sys_time_s;
				if (current_impulse > self.last_impulse){
					self.last_impulse = self.sys_time_s;
					self.tick += 1;

					self.nprint('\t\t', self.tick, self.clock_id);

					self.update_vmix();
					self.update_browsers('tick');
				}

				// Check if target duration was reached
				if (self.tick >= (self.clock_params.duration - self.clock_params.offset)){
					// If so - stop and call the callback (if any)
					self.update_browsers('end');
					self.stop();
					// self.callbacks?.end?.(self);
					// self.update_browsers('end');
				}
			}catch(err){
				self.nprint('impulse_machine ERROR:', err);
			}

		}
	}

	// Run the ticker
	fire(self, params=null){
		if (self.terminated){
			self.warn('Manipulations on a terminated timer:', self.clock_id, self);
			return
		}

		self.nprint('Editing clock:', params);

		// Update callbacks
		// self.callbacks.tick = params?.tick_callback;
		// self.callbacks.end = params?.end_callback;

		// Reset progress
		self.tick = 0;

		// Update clock params
		self.clock_params.duration = params?.clock?.duration;
		self.clock_params.offset = params?.clock?.offset || 0;
		self.clock_params.vmix_fields = params?.clock?.vmix_fields;
		self.clock_params.reversed = params?.clock?.reversed || false;

		// The timer is no longer stopped
		// Also, this (.fire()) is the only way to un-stop the timer
		self.stopped = false;

		// Make sure impulse machine is up and running
		self.impulse_machine();

		// Push 0 to VMIX
		self.update_vmix();

		// Start the timer
		self.resume();
	}

	pause(self){
		self.nprint('Pausing')
		// Stopped and terminated timers cannot be paused
		if (self.stopped || self.terminated){return};
		if (!self.pause_promise){
			self.pause_promise = new Promise(function(resolve){
				self.pause_promise_resolve = resolve;
			})
		}
	}

	resume(self){
		self.nprint('Resuming');
		// Stopped and terminated timers cannot be resumed
		if (self.stopped || self.terminated){return};
		// todo: Does this actually RESOLVE or CAUSE issues?
		const resolve = self.pause_promise_resolve;
		self.pause_promise = null;
		self.pause_promise_resolve = null;
		self.last_impulse = self.sys_time_s;
		resolve?.(true);
	}

	stop(self){
		self.stopped = true;
		self.pause();
		self.tick = 0;
	}

	// Terminated timers cannot be started
	terminate(self){
		self.terminated = true;
	}
}


// "Manager" is a bit too low of a profile.
// This shit is just way too important
const NodeAtAtBundestag = class{
	/*
		Mr.Kleiner — 02:27
		What's the name of the german parliament?
		Like, how do you call the building?

		ShiroDkxtro2 — 02:29
		Bundestag?

		Mr.Kleiner — 02:29
		YES THAT
		Image
		Because it does a whole bunch of shit

		ShiroDkxtro2 — 02:29
		Wat
		I refuse to believe the Bundestag does fucking shit
		Its a bunch of thumb fiddling idiots
		They probably can't even tie their own shoes
	*/

	IPC_MAP = Object.freeze([
		['kbn.atat.autobahn', [
			['attach', 'autobahn_attach'],
		]],
		['kbn.atat.clock', [
			['create', 'create_clock'],
			['edit', 'edit_clock'],
			['read', 'read_clock'],
		]],
	]);

	constructor(kbn){
		const self = kb_util.nprint(cls_pwnage.remap(this));

		// The KickBoxer Node shit
		self.kbn = kbn;

		// Clocks
		// clock_id:NodeAtAtInstance
		self.clock_dict = {};

		// This contains autobahns (rapid transit IPC shit)
		// connecting node and browser windows.
		// These autobahns exist separately from anything else for performance reasons
		self.autobahns = new Set();

		self.nprint('Basic init done');
	}

	init_ipc(self){
		for (const ipc_chan of self.IPC_MAP){
			const [chan_id, chan_items] = ipc_chan;

			const chan_dict = {};
			for (const cmd_data of chan_items){
				const [cmd_id, tgt_func] = cmd_data;
				chan_dict[cmd_id] = self[tgt_func];
			}

			electron.ipcMain.handle(chan_id, function(event, msg){
				if (!msg.cmd_id in chan_dict){
					self.nprint(
						'Bad IPC CMD on channel', `>${chan_id}<`,
						'CMD', `>${msg.cmd_id}<`, `Doesn't exist in`, `>${Object.keys(fuck)}<`
					);
					return
				}

				try{
					return (chan_dict[msg.cmd_id]({
						'event': event,
						'data': msg.data,
					}))
				}catch(err){
					self.nprint(
						`Error executing >${chan_id}.${msg.cmd_id}< :`,
						err
					)
				}

			});
		}

		self.nprint('IPC init done');
	}

	// Clean dead autobahns
	autobahn_cleanup(self){
		for (const autobahn of [...self.autobahns]){
			if (autobahn.detached){
				self.nprint('Dead autobahn encountered:', autobahn);
				autobahn.terminate();
				self.autobahns.delete(autobahn);
			}
		}
	}

	// Broadcast a message into all autobahns
	autobahn_broadcast(self, msg){
		for (const autobahn of self.autobahns){
			autobahn.send(msg);
		}
	}

	// Create an autobahn between KBN and a browser window
	autobahn_attach(self, params){
		// Build the autobahn
		const autobahn = new kb_util.Autobahn();
		// Write it down for later access
		self.autobahns.add(autobahn);

		// Reply with the other end of the pipe
		// electron.ipcMain.send(
		self.kbn.main_window.webContents.postMessage(
			'kb.atat.accept_autobahn',
			null,
			[autobahn.pipe_b]
		);

		self.nprint('Attached autobahn to a browser window');
	}

	// Connect a browser window and node with an autobahn
	_autobahn_attach(self, params){
		const autobahn = new kb_util.Autobahn();
		self.autobahns.add(autobahn);
		params.browser_window.webContents.postMessage(
			'node_atat_attach_autobahn',
			null,
			[autobahn.pipe_b],
		)

		self.nprint('Attached browser window to autobahn');

		// Cleanup
		for (const autobahn of [...self.autobahns]){
			if (autobahn.detached){
				autobahn.terminate();
				self.autobahns.delete(autobahn);
			}
		}
	}

	// Create a NodeAtAtInstance class
	create_clock(self, params){
		// Terminate existing clocks with overlapping IDs
		self.clock_dict[params.clock_id]?.terminate?.();

		// Create the new clock
		const clock = new NodeAtAtInstance({
			'bundestag': self,
			'kbn': self.kbn,
			'clock_id': params.clock_id,
		})

		self.clock_dict[params.clock_id] = clock;

		self.nprint('Registered clock', clock.clock_id);

		return clock
	}

	edit_clock(self, params){
		self.nprint('Clock action:', params);
		const clock = self.clock_dict[params.data.clock_id] || self.create_clock({
			'clock_id': params.data.clock_id,
			// 'action': params.action,
			// 'params': params.data,
		});

		clock[params.data.action](params.data.data);
	}

	read_clock(self, params){
		const clock = self.clock_dict[params.data.clock_id];
		if (clock){
			return {
				'time': clock.time,
				'paused': !!clock.pause_promise,
				'stopped': !!clock.stopped,
			}
		}else{
			return false
		}
	}
}



module.exports = {
	NodeAtAtInstance,
	NodeAtAtBundestag,
}



