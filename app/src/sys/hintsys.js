const hintsys_pool = {
	hint_bar: document.querySelector('hintsys-bar #hintsys_bar_hints'),

	modkeys: [
		'Control',
		'Shift',
		'Alt',
	],

	// Modifier keys hints
	mkey_registry_local: {
		'Shift': new Set(),
		'Control': new Set(),
		'Alt': new Set(),
	},
	mkey_registry_global: {
		'Shift': new Set(),
		'Control': new Set(),
		'Alt': new Set(),
	},
};

// todo: stack hints from DOM tree


document.addEventListener('mouseover', evt => {
	const tgt = evt.target.closest('[kbhint]')
	if (!tgt){
		hintsys_pool.hint_bar.innerText = '';
		return
	};

	const attr_text = tgt.getAttribute('kbhint')
	hintsys_pool.hint_bar.innerText = attr_text;
	// hintsys_pool.prev_local_hint = attr_text;
});

/*
document.addEventListener('keydown', evt => {
	if (evt.repeat || !hintsys_pool.modkeys.includes(evt.key)){return};

	let mkey_hint = [];

	const global_hints = Array.from(hintsys_pool.mkey_registry_global[evt.key]).join('; ');
	const local_hints = Array.from(hintsys_pool.mkey_registry_local[evt.key]).join('; ');
	if (global_hints){
		mkey_hint.push(global_hints)
	}
	if (local_hints){
		mkey_hint.push(local_hints)
	}

	mkey_hint = mkey_hint.join('; ');

	hintsys_pool.hint_bar.innerText = mkey_hint + ' ' + hintsys_pool.hint_bar.innerText;
});

document.addEventListener('keyup', evt => {
	hintsys_pool.hint_bar.innerText = hintsys_pool.prev_local_hint;
});
*/

// Register a modifier key hint
// whenever user holds a specified modifier key - hint is displayed
// - modkey: one of:
//     - 'Shift'
//     - 'Control'
//     - 'Alt'
// - local: whether this keybind is local to module. Otherwise - global
hintsys_pool.reg_modkey_hint = function(modkey=null, htext=null, local=true){
	if (!hintsys_pool.modkeys.includes(modkey)){return};

	if (local){
		hintsys_pool.mkey_registry_local[modkey].add(htext);
	}else{
		hintsys_pool.mkey_registry_global[modkey].add(htext);
	}
}

// Clear modifier key hints for the local module
hintsys_pool.wipe_local_modkey_hintpool = function(){
	for (const mk of hintsys_pool.modkeys){
		hintsys_pool.mkey_registry_local[mk].clear()
	}
}

// Clear modifier key hints for the local module
hintsys_pool.wipe_global_modkey_hintpool = function(){
	for (const mk of hintsys_pool.modkeys){
		hintsys_pool.mkey_registry_global[mk].clear()
	}
}


module.exports = hintsys_pool;