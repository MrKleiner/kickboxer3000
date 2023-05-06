

const _ctx_mute = true;



const ctx = {
	global: {
		cache: {},
	},
	module: {
		cache: {},
	},
	module_name: null,
}



// -------------------------------
// 			Global context
// -------------------------------

// save context
ctx.global.save = function(){

	// ensure that the destination folder exists
	const context_file = app_root.join('db', 'global', 'context.ct')
	ksys.util.ensure_folder_exists(context_file)

	// Do save
	context_file.writeSync(JSON.stringify(ksys.context.global.cache, null, 4))
	if(!_ctx_mute){print('Saved Global Context')};
}

// get/set parameter
ctx.global.prm = function(key=null, value=undefined, dosave=true){

	// if value is undefined, then it means that we're only getting a parameter
	if (value == undefined){
		return ksys.context.global.cache[key]
	}

	// if value is defined - update cache and save if asked to
	vmix.app_context[key] = value;
	if (dosave == true){
		ksys.context.global.save()
	}
}


// load fresh context from disk into memory
ctx.global.pull = function(){
	const context_file = app_root.join('db', 'global', 'context.ct');

	if (context_file.existsSync()){
		const fresh_context = JSON.parse(context_file.readFileSync('utf-8'))
		ksys.context.global.cache = fresh_context;
		return fresh_context
	}else{
		console.warn('Tried pulling non-existent global context')
		return {}
	}
}








// -------------------------------
// 			Module context
// -------------------------------

// get/set parameter
ctx.module.prm = function(key=null, value=undefined, dosave=true){

	// if value is undefined, then it means that we're only getting a parameter
	if (value == undefined){
		return ksys.context.module.cache[key]
	}

	// if defined - update cache and save if asked to
	ksys.context.module.cache[key] = value;
	if(!_ctx_mute){print('Incoming params:', key, value)};
	if (dosave == true){
		ksys.context.module.save()
	}
}

// save context to disk
ctx.module.save = function(){
	// construct path pointing to the current module in the database
	const target_folder = app_root.join('db', 'module', ksys.context.module_name)
	// ensure that the destination folders exists
	ksys.util.ensure_folder_exists(target_folder)

	// construct path pointing to the context file
	const ctx_file = target_folder.join('context.ct');
	ctx_file.writeSync(JSON.stringify(ksys.context.module.cache, null, 4))
	if(!_ctx_mute){print('Saved Module Context', ksys.context.module.cache)};
}

// load fresh context from disk into memory
// (pre-cache)
ctx.module.pull = function(){
	const context_file = app_root.join('db', 'module', ksys.context.module_name, 'context.ct');

	// make sure the context file exists
	if (!context_file.existsSync()){
		console.warn('Tried reading non existing module context', context_file)
		return {}
	}

	const fresh_context = JSON.parse(context_file.readFileSync('utf8'))
	ksys.context.module.cache = fresh_context;
	if(!_ctx_mute){print('Pulled Module Context')};
	return {...fresh_context}
}







module.exports = ctx;
