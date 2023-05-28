
//
// module-level
//

// read file
// Load as: 'text' | 'buffer' | 'json' (deafult to 'text')
const db_module_read_file = function(fname=null, load_as='text'){

	const target_file = app_root.join('db', 'module', ksys.context.module_name, fname)

	// ensure that the destination file exists
	if (!target_file.existsSync()){
		console.warn('Requested to read invalid file from module database:', fname)
		return null
	}

	if (load_as == 'buffer'){
		return target_file.readFileSync()
	}

	if (load_as == 'json'){
		return JSON.parse(target_file.readFileSync())
	}

	return target_file.readFileSync('utf-8')
}

// write file
const db_module_write_file = function(fname=null, data=null){
	const module_folder = app_root.join('db', 'module', ksys.context.module_name)
	// obviously, both filename and data should be present and valid
	if (!fname || !data){
		console.warn('Tried writing invalid data to the module db', fname, data)
		return false
	}
	// ensure that the target module folder exists
	ksys.util.ensure_folder_exists(module_folder)
	// write the desired file to the module folder
	module_folder.join(fname).writeSync(data)
}

// read file
// Load as: 'text' | 'buffer' | 'json' (deafult to 'text')
const db_global_read_file = function(fname=null, load_as='text'){

	const target_file = app_root.join('db', 'global', fname)

	// ensure that the destination file exists
	if (!target_file.existsSync()){
		console.warn('Requested to read invalid file from global database:', fname)
		return null
	}

	if (load_as == 'buffer'){
		return target_file.readFileSync()
	}

	if (load_as == 'json'){
		return JSON.parse(target_file.readFileSync())
	}

	return target_file.readFileSync('utf-8')
}

// write file
const db_global_write_file = function(fname=null, data=null){
	const global_folder = app_root.join('db', 'global')
	// obviously, both filename and data should be present and valid
	if (!fname || !data){
		console.warn('Tried writing invalid data to the global db', fname, data)
		return false
	}
	// ensure that the target module folder exists
	ksys.util.ensure_folder_exists(global_folder)
	// write the desired file to the module folder
	global_folder.join(fname).writeSync(data)
}



module.exports = {
	module: {
		read: db_module_read_file,
		write: db_module_write_file,
	},
	global: {
		read: db_global_read_file,
		write: db_global_write_file,
	},
}


