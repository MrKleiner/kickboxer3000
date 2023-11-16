
const _tmpl_util = {};




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
_tmpl_util.index_elem = function(tplate, idict, multipart=false){
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

	return {
		// The DOM element
		elem:  multipart ? jq_tplate[0] : jq_tplate[0].firstElementChild,
		// elem: jq_tplate[0],
		// Element index
		index: indexed,
	}

}

/*
Same as index_elem, except this function ONLY accepts
querySelectors pointing to a <template> element
*/
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

/*
Index element attributes into a dict
*/
_tmpl_util.index_attributes = function(_elem, attrs){
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








module.exports = _tmpl_util;






