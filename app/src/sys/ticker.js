
const _ticker = {
	sys_pool: {},
	syskill: false,
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



module.exports = _ticker;





