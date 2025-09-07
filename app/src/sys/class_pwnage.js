// No one ever knows what value variable is..
// or what its type is...
// An array is technically just an object
// objects or object..
// null is technically not an object
// but objects can be null, so they technically can be non-objects
// unless they're an object, so technically null is an object


const PURE_PWNAGE = Symbol('[[Cunts]]');


const remap = function(self, exclude){
	const prop_names = Object.getOwnPropertyNames(self.constructor.prototype);

	for (const func_name of prop_names){
		if ( (func_name == 'constructor') || func_name.startsWith('$')){continue};

		if (exclude && exclude.includes(func_name)){continue};

		const original_func = self[func_name];

		if (original_func.constructor.name == 'AsyncFunction'){
			self[func_name] = async function(){
				return await original_func(self, ...arguments)
			}
		}

		if (original_func.constructor.name == 'Function'){
			self[func_name] = function(){
				return original_func(self, ...arguments)
			}
		}

		if (original_func.constructor.name == 'GeneratorFunction'){
			self[func_name] = function(){
				return original_func(self, ...arguments)
			}
		}
	}

	// Experimental: getters and setters
	const gs_dict = {
		// 'getters': {},
		// 'setters': {},
	}

	for (const func_name of prop_names){
		if ( (func_name == 'constructor') || !func_name.startsWith('$') ){continue};

		const real_func_name = func_name.replaceAll('$', '');

		if (!(real_func_name in gs_dict)){
			gs_dict[real_func_name] = {};
		}

		const func = self[func_name];

		if (func_name.startsWith('$$')){
			gs_dict[real_func_name]['set'] = function(){
				return func(self, ...arguments)
			}
			self[func_name] = undefined;
			continue
		}

		if (func_name.startsWith('$')){
			gs_dict[real_func_name]['get'] = function(){
				return func(self, ...arguments)
			}
			self[func_name] = undefined;
			continue
		}
	}

	for (const real_func_name in gs_dict){
		Object.defineProperty(
			self,
			real_func_name,
			gs_dict[real_func_name]
		)
	}

	/*
	for (const func_name of prop_names){
		if ( (func_name == 'constructor') || !func_name.startsWith('$') ){continue};

		const real_func_name = func_name.replaceAll('$', '');
		const prop_params = {};

		if (real_func_name in gs_dict.getters){
			prop_params['get'] = function(){
				return gs_dict.getters[real_func_name](self, ...arguments)
			}
		}
		if (real_func_name in gs_dict.setters){
			prop_params['set'] = function(){
				return gs_dict.setters[real_func_name](self, ...arguments)
			}
		}

		Object.defineProperty(self, real_func_name, prop_params)
	}
	*/

	return self
}


const remap_adv = function(self, exclude){
	// helper: get the first declared parameter name (best-effort)
	const firstParamName = function(fn){
		try {
			const s = fn.toString().trim();
			// covers: function name(a,b), async function name(a), name(a,b){...}, (a,b)=>..., a=>...
			const sig = s.match(/^[^(]*\(\s*([^)]*)\)/) || s.match(/^([^=()]*)=>/);
			if (!sig) { return null; }
			const params = (sig[1] || '').split(',').map(p => p.trim()).filter(Boolean);
			if (params.length === 0) { return null; }
			// strip defaults and rest/destructuring whitespace
			const first = params[0].replace(/=.*$/,'').replace(/^[\s.]*|\s*$/g,'');
			// simple name check
			if (/^[A-Za-z_$][\w$]*$/.test(first)) { return first; }
			return null;
		} catch (e){
			return null;
		}
	};

	// collect functions and accessors from prototype chain (stop at Object.prototype)
	let proto = self.constructor.prototype;
	const seen = new Set();
	const funcs = []; // {name, fn, type, expectsSelfArg}
	const gs_dict = {}; // accumulator for accessors

	while (proto && proto !== Object.prototype){
		const prop_names = Object.getOwnPropertyNames(proto);
		for (const func_name of prop_names){
			if (func_name === 'constructor') { continue; }
			if (seen.has(func_name)) { continue; }
			seen.add(func_name);

			const desc = Object.getOwnPropertyDescriptor(proto, func_name);
			if (!desc) { continue; }

			// value = normal method/function
			if (typeof desc.value === 'function'){
				// skip $-prefixed accessor helpers here; we'll handle them below
				if (!func_name.startsWith('$')){
					const fn = desc.value;
					const type = fn.constructor ? fn.constructor.name : 'Function';
					const first = firstParamName(fn);
					const expectsSelfArg = (first === 'self');
					funcs.push({ name: func_name, fn: fn, type: type, expectsSelfArg: expectsSelfArg });
				}
			}

			// accessor helpers using naming convention ($name or $$name)
			if (func_name.startsWith('$') || func_name.startsWith('$$')){
				const real_name = func_name.replaceAll('$','');
				if (!(real_name in gs_dict)) { gs_dict[real_name] = {}; }

				const helper = proto[func_name];
				if (typeof helper !== 'function') { continue; }

				const first = firstParamName(helper);
				const expectsSelfArg = (first === 'self');

				if (func_name.startsWith('$$')){
					gs_dict[real_name].set = { helper: helper, expectsSelfArg: expectsSelfArg };
				} else {
					gs_dict[real_name].get = { helper: helper, expectsSelfArg: expectsSelfArg };
				}
			}
		}
		proto = Object.getPrototypeOf(proto);
	}

	// install wrappers for normal methods onto the instance
	for (const { name, fn, type, expectsSelfArg } of funcs){
		if (exclude && exclude.includes(name)) { continue; }

		// wrapper should bind `this` correctly so `super` works.
		// If the original declared `self` as first param, pass it as well.
		if (type === 'AsyncFunction'){
			if (expectsSelfArg){
				self[name] = async function(){
					// call with this=self and first arg = self
					return await fn.call(self, self, ...arguments);
				};
			} else {
				self[name] = async function(){
					return await fn.call(self, ...arguments);
				};
			}
		} else if (type === 'GeneratorFunction'){
			if (expectsSelfArg){
				self[name] = function* (){
					return yield* fn.call(self, self, ...arguments);
				};
			} else {
				self[name] = function* (){
					return yield* fn.call(self, ...arguments);
				};
			}
		} else {
			if (expectsSelfArg){
				self[name] = function(){
					return fn.call(self, self, ...arguments);
				};
			} else {
				self[name] = function(){
					return fn.call(self, ...arguments);
				};
			}
		}
	}

	// install getters/setters collected into gs_dict
	for (const real_name in gs_dict){
		const entry = gs_dict[real_name];
		const prop_desc = {};

		if (entry.get){
			const helper = entry.get.helper;
			const expectsSelfArg = entry.get.expectsSelfArg;
			if (expectsSelfArg){
				prop_desc.get = function(){
					return helper.call(self, self);
				};
			} else {
				prop_desc.get = function(){
					return helper.call(self);
				};
			}
		}

		if (entry.set){
			const helper = entry.set.helper;
			const expectsSelfArg = entry.set.expectsSelfArg;
			if (expectsSelfArg){
				prop_desc.set = function(v){
					return helper.call(self, self, v);
				};
			} else {
				prop_desc.set = function(v){
					return helper.call(self, v);
				};
			}
		}

		Object.defineProperty(self, real_name, prop_desc);
	}

	return self;
}


// The PROPER shit, which works with inheritance, preserves private shit and so on.
const pwn = function(self, prms=null){
	let proto = self.constructor.prototype;

	const func_dict = {};
	const real_gs_dict = {};
	const bootleg_gs_dict = {};

	while (proto && proto !== Object.prototype){
		const prop_names = Object.getOwnPropertyNames(proto);

		for (const func_name of prop_names){
			// Obviously, this is obvious
			if (func_name === 'constructor'){continue};

			// JS can actually provide some useful info on object methods
			const desc = Object.getOwnPropertyDescriptor(proto, func_name);
			// Not obviously, this is absolutely not obvious
			if (!desc){continue};

			// Skip already treated things
			if (desc.value?.[PURE_PWNAGE] || desc.get?.[PURE_PWNAGE] || desc.set?.[PURE_PWNAGE]){
				console.log('PWN: Skipping', desc);
				continue
			}

			// Mark as done
			for (const elem of [desc.value, desc.get, desc.set]){
				if (elem){
					elem[PURE_PWNAGE] = true;
				}
			}

			// Whether it's a real get/set
			const is_real_gs = desc.get || desc.set;

			// Determine whether this function is a bootleg get/set thing.
			// It's said, that get/set can be remapped, but paranoia stats
			// are far too high at this point.
			const [is_bootleg_gs, is_bootleg_getter, is_bootleg_setter] = [
				func_name.startsWith('$'),
				func_name.startsWith('$') && !func_name.startsWith('$$'),
				func_name.startsWith('$$'),
			]

			// First of all - Sync/Async/Generator functions
			// $-prefixed shit is handled treated separately
			if ( (typeof desc.value === 'function') && !is_bootleg_gs && !is_real_gs){
				func_dict[func_name] = {
					'func':  desc.value,
					'ftype': (desc?.value?.constructor) ? desc.value.constructor.name : 'Function',
				}
			}

			// Treat real get/set
			if (is_real_gs){
				real_gs_dict[func_name] = desc;
			}

			// Explicit get/set determined by $ prefix
			if (is_bootleg_gs){
				// This function's real name
				const real_name = func_name.replaceAll('$','');
				if (!(real_name in bootleg_gs_dict)){
					bootleg_gs_dict[real_name] = {};
				}

				const tgt_func = proto[func_name];

				if (typeof tgt_func == 'function'){
					if (is_bootleg_setter){
						bootleg_gs_dict[real_name]['set'] = tgt_func;
					}else{
						bootleg_gs_dict[real_name]['get'] = tgt_func;
					}
				}

				delete self[func_name];
			}
		}

		proto = Object.getPrototypeOf(proto);
	}

	// Remap regular functions
	for (const [fname, fdata] of Object.entries(func_dict)){
		const {func, ftype} = fdata;

		if (ftype == 'AsyncFunction'){
			if (prms?.explicit == false){
				self[fname] = async function(){
					return await func.call(self, ...arguments);
				};
			}else{
				self[fname] = async function(){
					return await func.call(self, self, ...arguments);
				};
			}
		}else if(ftype == 'GeneratorFunction'){
			if (prms?.explicit == false){
				self[fname] = function*(){
					return yield* func.call(self, ...arguments);
				};
			}else{
				self[fname] = function*(){
					return yield* func.call(self, self, ...arguments);
				};
			}
		}else{
			if (prms?.explicit == false){
				self[fname] = function(){
					return func.call(self, ...arguments);
				};
			}else{
				self[fname] = function(){
					return func.call(self, self, ...arguments);
				};
			}
		}
	}

	// Bootleg getters and setters
	for (const [gs_name, gs_data] of Object.entries(bootleg_gs_dict)){
		const [gs_get, gs_set] = [gs_data.get, gs_data.set];
		const prop_desc = {};

		if (gs_get){
			prop_desc.get = function(){
				return gs_get.call(self, self);
			};
		}

		if (gs_set){
			prop_desc.set = function(tgt_val){
				return gs_set.call(self, self, tgt_val);
			};
		}

		Object.defineProperty(self, gs_name, prop_desc);
	}

	// Real getters and setters
	for (const [gs_name, gs_data] of Object.entries(real_gs_dict)){
		const [gs_get, gs_set] = [gs_data.get, gs_data.set];

		if (gs_get){
			gs_data.get = function(){
				return gs_get.call(self, self);
			};
		}

		if (gs_set){
			gs_data.set = function(tgt_val){
				return gs_set.call(self, self, tgt_val);
			};
		}

		Object.defineProperty(self, gs_name, gs_data);
	}

	return self;
}


const spawn = function(tgt_cls, ...arguments){
	const cls_inst = new tgt_cls(...arguments);
	remap(cls_inst);
	return cls_inst;
}




module.exports = {
	remap,
	remap_adv,
	spawn,
	pwn,
}
