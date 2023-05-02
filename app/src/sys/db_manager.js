
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

	if (!fname || !data){
		console.warn('Tried writing invalid data to the module db', fname, data)
		return false
	}

	ksys.ensure_folder_exists(module_folder)

	module_folder.join(fname).writeSync(data)
}



module.exports = {
	module: {
		read: db_module_read_file,
		write: db_module_write_file,
	}
}