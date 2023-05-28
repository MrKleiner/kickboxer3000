
const _tmpl_util = {};



// idict:

// return selection as raw js:
// {'prop_name':'selector'}

// return selection as jqeury object
// {'prop_name':'$selector'}
_tmpl_util.index_elem = function(tplate, idict){
	const jq_tplate = $(tplate);

	const indexed = {};

	for (const pname in idict){
		const e_selector = idict[pname];
		const elem = (e_selector[0] == '$') ? jq_tplate.find(e_selector) : jq_tplate.find(e_selector)[0]
		if (!elem){
			console.warn('Template indexer: Cannot find', e_selector, 'inside', tsel)
		}

		indexed[pname] = elem;
	}

	return {
		// 'tplate': tplate,
		'elem': tplate,
		index: indexed,
	}

}


_tmpl_util.index_tplate = function(tsel, idict){
	if (!tsel || !idict){
		// console.error('Unable to index a template: Invalid input params', tsel, idict);
		throw new Error('Unable to index a template: Invalid input params', tsel, idict);
	}
	const tplate = document.querySelector(tsel)?.content?.cloneNode(true);

	if (!tplate){
		throw new Error('The template selector returned nothing');
	}

	return _tmpl_util.index_elem(tplate, idict)

}


_tmpl_util.index_attributes = function(_elem, attrs){
	if (!_elem || !attrs){
		// console.error('Unable to index a template: Invalid input params', elem, attrs);
		throw new Error('Unable to index a template: Invalid input params', elem, attrs);
	}

	const elem = $(_elem)[0]

	const outp_dict = {};

	for (const attr_name of attrs){
		outp_dict[attr_name] = elem.getAttribute(attr_name)
	}

	return outp_dict
}
















module.exports = _tmpl_util;