
const _tmpl_util = {};



// idict:

// return selection as raw js:
// prop_name:selector

// return selection as jqeury object
// prop_name:$selector
_tmpl_util.index_tplate = function(tsel, idict){
	if (!tsel || !idict){
		// console.error('Unable to index a template: Invalid input params', tsel, idict);
		throw new Error('Unable to index a template: Invalid input params', tsel, idict);
	}
	const tplate = document.querySelector(tsel)?.content?.cloneNode(true);

	if (!tplate){
		throw new Error('The template selector returned nothing');
	}

	const jq_tplate = $(tplate);

	const indexed = {};

	for (const pname in idict){
		const e_selector = idict[pname];
		const elem = (e_selector[0] == '$') ? jq_tplate.find(e_selector) : tplate.querySelector(e_selector)
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



















module.exports = _tmpl_util;