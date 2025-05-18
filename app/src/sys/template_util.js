

/*
	This function simplifies instantiating HTML templates
	and quickly selecting elements inside them.

	The idea is to pass a dictionary,
	where KEY is a shorthand for the selected element
	and VALUE is a querySelector string.

	A dictionary with the same KEYs will be returned,
	where VALUES were transformed into DOM elements of the
	newly instantiated template.

		- tplate:HTMLstr|DOMElem|JQuery
		    This parameter should either represent a raw HTML string
		    to be evaulated into a real DOMElement
		    OR pre-evaluated DOMElement

		- idict:dict
		    Dictionary used to map querySelectors to simple names.
		        - KEY is the name of the indexed element.
		        - VALUE is querySelector string.
		            Add $ in the beginning of the VALUE for this value
		            to be a JQuery object and not vanilla JS DOM Element
		    Example:
		    {'prop_name':'selector'}
		    Or as JQuery
		    {'prop_name':'$selector'}

		- multipart:bool=false
		  Template consists of multiple elements.
*/

// todo: actually make multipart work
const index_elem = function(tplate, idict, multipart=false){
	const jq_tplate = $(tplate);

	const indexed = {};

	for (const pname in idict){
		const e_selector = idict[pname];
		const elem = (e_selector[0] == '$') ? jq_tplate.find(e_selector) : jq_tplate.find(e_selector)[0]
		if (!elem){
			console.warn('Template indexer: Cannot find', e_selector, 'inside', jq_tplate[0])
		}

		indexed[pname] = elem;
	}

	const dom = multipart ? jq_tplate[0] : jq_tplate[0].firstElementChild;

	return {
		// The DOM element
		'elem': dom,
		'dom': dom,
		'root': dom,
		// Indexed DOM
		'index': indexed,
	}
}

/*
	Same as index_elem, except this function ONLY accepts
	querySelectors pointing to a <template> element
*/
const index_tplate = function(tsel, idict, select_from=null){
	if (!tsel || !idict){
		// console.error('Unable to index a template: Invalid input params', tsel, idict);
		throw new Error('Unable to index a template: Invalid input params:', tsel, idict);
	}
	const tplate = (select_from || document).querySelector(tsel)?.content?.cloneNode(true);

	if (!tplate){
		throw new Error('The template selector returned nothing');
	}

	return index_elem(tplate, idict)
}

/*
	Index element attributes into a dict
*/
const index_attributes = function(_elem, attrs){
	if (!_elem || !attrs){
		// console.error('Unable to index a template: Invalid input params', elem, attrs);
		throw new Error('Unable to index a template: Invalid input params', elem, attrs);
	}

	const elem = $(_elem)[0];

	const outp_dict = {};

	for (const attr_name of attrs){
		outp_dict[attr_name] = elem.getAttribute(attr_name)
	}

	return outp_dict
}


const _sys_tplates = (function(){
	const tplates = {};
	for (const html_file of app_root.join('sys/templates').globSync('*.html')){
		const tplates_html = document.createElement('div');
		tplates_html.innerHTML = str(html_file.readFileSync());
		tplates[html_file.stem] = function(){
			return index_tplate(...arguments, tplates_html);
		}
	}

	Object.freeze(tplates);

	return tplates;
})()


const index_tplate_file = function(fpath){
	const html_file = Path(fpath);

	const tplates_html = document.createElement('div');
	tplates_html.innerHTML = str(html_file.readFileSync());

	const tplates_dict = {};
	for (const tplate of tplates_html.children){
		if (tplate.tagName == 'TEMPLATE'){
			const tplate_id = tplate.id.lower();
			if (!tplate_id){
				console.warn('Sys Template has no ID (ID is mandatory)', tplate);
				continue
			}
			if (tplate_id in tplates_dict){
				console.warn('Duplicate sys template ID:', tplate_id);
				continue
			}
			tplates_dict[tplate_id] = function(idict, multipart=false){
				return index_elem(
					tplate.content.cloneNode(true),
					idict,
					multipart,
				);
			}
		}
	}

	Object.freeze(tplates_dict);

	return tplates_dict;
}


const __sys_tplates = (function(){
	const tplates = {};
	for (const html_file of app_root.join('sys/templates').globSync('*.html')){
		const tplates_html = document.createElement('div');
		tplates_html.innerHTML = str(html_file.readFileSync());

		tplates[html_file.stem] = (function(){
			const tplates_dict = {};
			for (const tplate of tplates_html.children){
				if (tplate.tagName == 'TEMPLATE'){
					const tplate_id = tplate.id.lower();
					if (!tplate_id){
						console.warn('Sys Template has no ID (ID is mandatory)', tplate);
						continue
					}
					if (tplate_id in tplates_dict){
						console.warn('Duplicate sys template ID:', tplate_id);
						continue
					}
					tplates_dict[tplate_id] = function(idict, multipart=false){
						return index_elem(
							tplate.content.cloneNode(true),
							idict,
							multipart,
						);
					}
				}
			}

			Object.freeze(tplates_dict);

			return tplates_dict;
		})()
	}

	Object.freeze(tplates);

	return tplates;
})()


const sys_tplates = (function(){
	const tplates = {};
	for (const html_file of app_root.join('sys/templates').globSync('*.html')){
		tplates[html_file.stem] = index_tplate_file(html_file);
	}
	Object.freeze(tplates);

	return tplates;
})()



const _index_module_templates = function(module_id){
	if (module_id in module_templates){
		return module_templates.module_id;
	}

	// module_templates[html_file.split('.')[0]] = {};
	const tplates = {};
	for (const html_file of app_root.join('modules_c', module_id).globSync('*.tplates.html')){
		tplates[html_file.split('.')[0].trim()] = index_tplate_file(html_file);
	}

	module_templates
}


// Todo: Only make this trigger when a module is accessed ?
const module_templates = {};
const index_module_templates = function(){
	for (const module_path of app_root.join('modules_c').globSync('*')){
		if (!module_path.isDirectorySync()){continue};

		module_templates[module_path.basename] = (function(){
			const tplate_groups = {};

			module_path.walkSync(function(html_file){
				// No isFile() check, because one has to be fucking retarded to name a dir like that
				if (!html_file.basename.endsWith('.tplates.html')){return};

				tplate_groups[html_file.basename.split('.')[0].trim()] = index_tplate_file(html_file);
			})

			/*
			for (const html_file of module_path.globSync('*.tplates.html')){
				tplate_groups[html_file.split('.')[0].trim()] = index_tplate_file(html_file);
			}
			*/

			return Object.freeze(tplate_groups);
		})()
	}

	Object.freeze(module_templates);
}


module.exports = {
	index_elem,
	index_tplate,
	index_attributes,
	sys_tplates,
	module_templates,
	index_module_templates,
};






