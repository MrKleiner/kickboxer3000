

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

const KBSwitch = class{
	// - multichoice
	//     Whether this switch can have multiple items active at once.
	//     Default to false.
	// - set_default
	//     Item to set as default. None by default.
	//     When "can_be_empty" is false - this gets automatically
	//     set to the first available item.
	// - can_be_empty
	//     Whether nothing can be selected at all or not.
	//     Default to false.
	// - highlight_class
	//     Class to add to active items.
	//     Default to "kbs_selected".
	// - dom_array
	//     Bind to the provided array of DOM elements, in a format of:
	//         - id: Unique id of this item in the switch.
	//         - dom: The DOM element itself.
	// - callback
	//     Function to execute when the switch changes states.
	//     Passed params are: (self, switch item's ID, click event)

	MOD_KEY_DICT = {
		'ctrlKey': 'CTRL',
		'altKey':  'ALT',
	}

	constructor(cfg=null){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.cfg = cfg || {};

		self.multichoice = self.cfg.multichoice || false;
		self.set_default = self.cfg.set_default || null;
		self.can_be_empty = self.cfg.can_be_empty || false;
		self.highlight_class = self.cfg.highlight_class || 'kbs_selected';

		self.switch_dict = {};

		if (self.cfg.dom_array){
			self.bind_dom_array(self.cfg.dom_array);
		}

		if (self.set_default){
			self.select(self.set_default)
		}

		if (!self.can_be_empty && !self.set_default){
			self.select(
				Object.keys(self.switch_dict)[0]
			)
		}
	}

	$selected(self){
		const active_items = [];
		for (const [id, item_data] of Object.entries(self.switch_dict)){
			if (item_data.active){
				active_items.push(id);
			}
		}

		if (self.multichoice){
			return active_items
		}else{
			return active_items[0] || null;
		}
	}

	$$selected(self, tgt_id=null){
		if (!tgt_id || (!self.multichoice && !(tgt_id in self.switch_dict))){
			return
		}

		for (const item_data of Object.values(self.switch_dict)){
			item_data.active = false;
		}

		if (self.multichoice){
			for (const id of tgt_id){
				if (id in self.switch_dict){
					self.switch_dict[id].active = true;
				}
			}
		}else{
			self.switch_dict[tgt_id].active = true;
		}

		self.render();
	}

	render(self){
		for (const item_data of Object.values(self.switch_dict)){
			if (item_data.active){
				item_data.dom.classList.add(self.highlight_class);
			}else{
				item_data.dom.classList.remove(self.highlight_class);
			}
		}
	}

	select(self, tgt_id=null){
		print('Setting tgt_id', tgt_id);
		if (!tgt_id){
			console.error('Fatal: No ID supplied to switch selector', tgt_id, self);
			return
		}
		if (!self.switch_dict[tgt_id]){
			console.error(
				`Fatal: Supplied ID doesn't exist in the switch dict`,
				tgt_id,
				self
			);
			return
		}

		const tgt_item = self.switch_dict[tgt_id];

		const active_items = self.selected;

		if (self.multichoice){
			if (self.can_be_empty){
				tgt_item.active = !tgt_item.active;
			}else{
				if (active_items.length == 1 && active_items[0] == tgt_id){}else{
					tgt_item.active = !tgt_item.active;
				}
			}
		}else{
			if (self.can_be_empty){
				for (const item_data of Object.values(self.switch_dict)){
					if (tgt_id != active_items){
						item_data.active = false;
					}
				}
				tgt_item.active = !tgt_item.active;
			}else{
				if (active_items != tgt_id){
					for (const item_data of Object.values(self.switch_dict)){
						item_data.active = false;
					}
					tgt_item.active = !tgt_item.active;
				}
			}
		}

		self.render();
	}

	add_entry(self, entry_data, selected=false){
		if (!entry_data.id){
			throw new Error('No ID supplied to the new item:', entry_data);
		}
		if (entry_data.id in self.switch_dict){
			throw new Error('Duplicate IDs cannot be re-added', entry_data);
		}

		// Binding already existing DOM elements
		if (entry_data.dom){
			const id = entry_data.id;
			const dom = entry_data.dom;

			self.switch_dict[id] = {
				'dom': dom,
			}
			dom.onclick = function(event){
				if (self.cfg.mod_key && !event[self.cfg.mod_key]){
					ksys.info_msg.send_msg(
						`Please hold ${self.MOD_KEY_DICT[self.cfg.mod_key]}`,
						'warn',
						4000
					);
					return
				}
				self.select(id);
				self.exec_callback(id, event);
			}
			if (selected){
				self.select(id);
			}
		}
	}

	exec_callback(self, id, event){
		return self.cfg?.callback?.(self, id, event)
	}

	bind_dom_array(self, dom_array=null){
		if (!dom_array){
			throw new Error('Invalid array supplied:', dom_array);
		}

		for (const switch_item of dom_array){
			self.add_entry({
				'id': switch_item.id,
				'dom': switch_item.dom,
			})
		}
	}
}





const save_switch_states = function(){
	console.time('Saved Radio Switch States In');

	ksys.db.module.write(
		'_kb_radio_switches_cfg.kbcfg',
		JSON.stringify(_switches.entries)
	);

	console.timeEnd('Saved Radio Switch States In');
}

const resync = function(){
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


module.exports = {
	KBRadioSwitch,
	save_switch_states,
	resync,
	KBSwitch,
}








