

// This is basically a replacement for default HTML radio buttons.
// Default HTML radio buttons have a few retarded cock blocks:
// - Each radio button set requires a unique ID.
//   Trust me, this is VERY often NOT ideal AT ALL.
// - It's impossible to uncheck a checked radio button,
//   so that the set has no active buttons at all.
// - Awfull CSS appearence.

// This module aims to fix all the issues mentioned above.

// Meet the:
// - Radio button sets, that do not require unique IDs,
//   but can also have unique IDs where they're needed.
// - Easy CSS styling.
// - Multiple built-in styles, easily selected via attributes.
// - Radio behaviour, while also being able to uncheck all buttons.
// - Configurable switch state autosave and autoload.

// Todo: as of now this is a VERY limited default radio buttons restyle.
// But the underlying logic allows implementing all the benefits mentioned above.


const _switches = {
	'entries': {},
	'ctrl': {},
};


const KBRadioSwitch = class{
	// Switch dom is EITHER a selector OR DOM element
	// tgt_active is the id of the switch param
	constructor(switch_dom, _tgt_active=null, callback=null){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		const tgt_dom = $(switch_dom)[0];

		// Get switch config
		const cfg = ksys.tplates.index_attributes(
			tgt_dom,
			[
				'kb_style',
				'kb_layout',
				'kb_default',
				'display_name',
				'kb_switch_id',
				'mod_key',
			]
		)

		tgt_dom.setAttribute('indexed', true)

		self.switch_id = cfg.kb_switch_id.trim().lower();

		self.mod_key = cfg.mod_key;

		// Index params
		self.param_dom_index = {};

		let fallback_default = null;

		self.active_entry_id = null;

		for (const switch_entry of tgt_dom.querySelectorAll('kb-radio-switch-entry')){
			const param_id = switch_entry.getAttribute('kb_param_id');
			fallback_default = param_id;
			self.param_dom_index[param_id] = switch_entry;
			switch_entry.onclick = function(evt){
				if ( (self.mod_key && !evt[self.mod_key]) || (self.active_entry_id == param_id) ){return};
				self.active_entry_id = param_id;
				self.set_active(param_id, true);
				callback?.(param_id);
			}
		}

		// Set active, or default, if no active was supplied
		const tgt_active = _tgt_active || cfg.kb_default || fallback_default;
		if (!tgt_active){
			throw new Error('Radio Switch with id', cfg.kb_switch_id, 'has no entries');
		}
		self.set_active(tgt_active, false);
	}

	set_active(self, tgt_id, trigger_save=true){
		// Remove styling from all
		for (const entry_id in self.param_dom_index){
			const param_dom = self.param_dom_index[entry_id];
			param_dom.classList.remove('kb_radio_switch_active');
		}
		_switches.entries[self.switch_id] = tgt_id;
		// Add styling to the target entry
		self.param_dom_index[tgt_id].classList.add('kb_radio_switch_active');

		if (trigger_save){
			_switches.save_switch_states();
		}
	}

	get_active(self, tgt_id, trigger_save=true){}
}



_switches.save_switch_states = function(){
	console.time('Saved Radio Switch States In');

	ksys.db.module.write(
		'_kb_radio_switches_cfg.kbcfg',
		JSON.stringify(_switches.entries)
	);

	console.timeEnd('Saved Radio Switch States In');
}

_switches.resync = function(){
	print('Resyncing switches')
	const switches_cfg = ksys.db.module.read('_kb_radio_switches_cfg.kbcfg', 'json');
	print('Got saved switch config', switches_cfg)

	for (const tgt_switch of document.querySelectorAll('kb-radio-switch:not([indexed])')){
		new KBRadioSwitch(
			tgt_switch,
			switches_cfg ? switches_cfg[tgt_switch.getAttribute('kb_switch_id')] : null,
			tgt_switch.onchange || null,
		);
	}
}


module.exports = _switches;








