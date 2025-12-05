
if(!window.kbmodules){window.kbmodules={}};
if(!window.kbmodules.kickboxing_advanced){window.kbmodules.kickboxing_advanced={}};


window.kbmodules.kickboxing_advanced.counter = {};

window.kbmodules.kickboxing_advanced.load = function(){
	window.kbmodules.kickboxing_advanced.clock_feed = document.querySelector('#timer_feedback');
	window.kbmodules.kickboxing_advanced.main_clock_id = 'kbs.main';
	window.kbmodules.kickboxing_advanced.player_data_schema = new Set();
	window.kbmodules.kickboxing_advanced.pair_list = new Map();

	window.kbmodules.kickboxing_advanced.edit_mode_active = false;

	window.kbmodules.kickboxing_advanced.load_schema();

	// window.kbmodules.kickboxing_advanced.add_pair();
	window.kbmodules.kickboxing_advanced.load_pairs();

	window.kbmodules.kickboxing_advanced.color_order = ksys.context.module.cache.color_order;

	// important todo: wtf does colour flip even do ????
	window.kbmodules.kickboxing_advanced.set_color_order(window.kbmodules.kickboxing_advanced.color_order);

	window.kbmodules.kickboxing_advanced.redraw_round_switches();

	document.querySelector('#param_list input[res_path]').value = ksys.context.module.cache.resource_path || '';

	document.querySelector('#round_duration_cfg_field input[minutes]').value =
		ksys.context.module.cache?.round_duration?.minutes || '';
	document.querySelector('#round_duration_cfg_field input[seconds]').value =
		ksys.context.module.cache?.round_duration?.seconds || '';

	document.querySelector('#round_amount_fields input[round_amount]').value = 
		ksys.context.module.cache.round_amount || '';

	const timer_has_vs = document.querySelector('#param_list input[timer_has_vs]');
	timer_has_vs.checked = ksys.context.module.cache.timer_has_vs || false;
	timer_has_vs.onchange = function(){
		ksys.context.module.prm('timer_has_vs', timer_has_vs.checked);
	}

	const vs_as_movs = document.querySelector('#param_list input[vs_as_movs]');
	vs_as_movs.checked = ksys.context.module.cache.vs_as_movs || false;
	vs_as_movs.onchange = function(){
		ksys.context.module.prm('vs_as_movs', vs_as_movs.checked);
	}

	window.kbmodules.kickboxing_advanced.titles = {
		'personal': new vmix.title({
			'title_name': 'personal.gtzip',
			'default_overlay': 2,
		}),

		'vs': new vmix.title({
			'title_name': 'vs_main.gtzip',
			'default_overlay': 2,
		}),

		'timer': new vmix.title({
			'title_name': 'timer.gtzip',
			'default_overlay': 1,
		}),

		'lower': new vmix.title({
			'title_name': 'midfight_lower.gtzip',
			'default_overlay': 2,
		}),

		'main_event': new vmix.title({
			'title_name': 'main_event.gtzip',
			'default_overlay': 2,
		}),

		'comain_event': new vmix.title({
			'title_name': 'comain_event.gtzip',
			'default_overlay': 2,
		}),

		'main_w_comain': new vmix.title({
			'title_name': 'main_w_comain.gtzip',
			'default_overlay': 2,
		}),

		'undercard': new vmix.title({
			'title_name': 'undercard.gtzip',
			'default_overlay': 2,
		}),

		'winner': new vmix.title({
			'title_name': 'winner.gtzip',
			'default_overlay': 2,
		}),

		'judges': new vmix.title({
			'title_name': 'judges.gtzip',
			'default_overlay': 2,
		}),
		'referee': new vmix.title({
			'title_name': 'referee.gtzip',
			'default_overlay': 2,
		}),

		'upcoming_center': new vmix.title({
			'title_name': 'coming_up_center.gtzip',
			'default_overlay': 2,
		}),
		'upcoming_corner': new vmix.title({
			'title_name': 'coming_up_corner.gtzip',
			'default_overlay': 2,
		}),
	}

	// document.querySelector('#image_proxies').checked = !!ksys.context.module.cache.img_proxies_enabled;
	// document.querySelector('#image_proxies_addr').value = ksys.context.module.cache.img_proxy_addr;
	// document.querySelector('#img_proxy_whitelist').value = ksys.db.module.read('proxy_whitelist.kbdata') || '';

	// window.kbmodules.kickboxing_advanced.toggle_image_proxies();

	ksys.ticker.bundestag.attach({
		'clock_id': window.kbmodules.kickboxing_advanced.main_clock_id,
		'tick':     window.kbmodules.kickboxing_advanced.clock_tick_event,
		'end':      window.kbmodules.kickboxing_advanced.clock_end_event,
	})
}

window.kbmodules.kickboxing_advanced.KBPlayer = class{
	constructor(parent_pair){
		const self = this;

		self.pair = parent_pair;

		self.dom = ksys.tplates.index_tplate(
			'#kb_player_template',
			{
				'vis_display':  '.vis_display',
				'pair_num':     '.pair_num',
				'player_data':  '.player_data',
			}
		);

		self.vs_photo_side = 'l';

		self.attr_list = {};

		self.name = '';
		self.surname = '';

		// Add name/surname
		{
			const dom = ksys.tplates.index_tplate(
				'#kb_player_data_entry_template',
				{
					'label':  '.data_entry_label',
					'input':  '.data_entry_input',
				}
			);
			dom.index.label.textContent = 'Name';
			dom.index.input.onchange = function(){
				self.name = dom.index.input.value;
				self.dom.index.vis_display.textContent = `${self.name} ${self.surname}`;
				window.kbmodules.kickboxing_advanced.save_pairs();
			}
			dom.root.setAttribute('preview_hidden', true);
			self.dom.index.player_data.append(dom.elem);

			self.attr_list['name'] = dom.index.input;
		}

		{
			const dom = ksys.tplates.index_tplate(
				'#kb_player_data_entry_template',
				{
					'label':  '.data_entry_label',
					'input':  '.data_entry_input',
				}
			);
			dom.index.label.textContent = 'Surname';
			dom.index.input.onchange = function(){
				self.surname = dom.index.input.value;
				self.dom.index.vis_display.textContent = `${self.name} ${self.surname}`;
				window.kbmodules.kickboxing_advanced.save_pairs();
			}
			dom.root.setAttribute('preview_hidden', true);
			self.dom.index.player_data.append(dom.elem);
			self.attr_list['surname'] = dom.index.input;
		}


		self.update_schema(self);

		self.dom.elem.onclick = function(){
			if (window.kbmodules.kickboxing_advanced.edit_mode_active){return};
			self.mark_active();
			window.kbmodules.kickboxing_advanced.update_personal_title(self);
		}

		ksys.util.cls_pwnage.remap(self);
	}

	to_dict(self){
		const data = {
			'name': self.name,
			'surname': self.surname,
			'vs_photo_side': self.vs_photo_side,
		};
		for (const data_id in self.attr_list){
			data[data_id] = self.attr_list[data_id].value;
		}

		return data;
	}

	apply_data(self, data){
		self.name = data.name;
		self.surname = data.surname;

		self.vs_photo_side = data.vs_photo_side || 'l';

		self.attr_list.name.value = data.name;
		self.attr_list.surname.value = data.surname;

		self.dom.index.vis_display.textContent = `${self.name} ${self.surname}`;

		for (const schema_data of window.kbmodules.kickboxing_advanced.player_data_schema){
			const [label, suffix, data_id] = schema_data;
			if (!self.attr_list[data_id]){continue};

			self.attr_list[data_id].value = data[data_id] || '';
		}
	}

	update_schema(self){
		// Add data entries according to schema
		for (const schema_data of window.kbmodules.kickboxing_advanced.player_data_schema){
			const [label, suffix, data_id, is_image, is_shared, is_text_area] = schema_data;

			let attr_dom = ksys.tplates.index_tplate(
				'#kb_player_data_entry_template',
				{
					'label':  '.data_entry_label',
					'input':  '.data_entry_input',
				}
			);

			if (is_text_area){
				attr_dom = ksys.tplates.index_tplate(
					'#kb_player_data_entry_template_text_area',
					{
						'label':  '.data_entry_label',
						'input':  '.data_entry_input',
					}
				);
			}

			if (data_id in self.attr_list){continue};

			attr_dom.index.label.textContent = ksys.util.str_ops.format(label, 1);
			self.dom.index.player_data.append(attr_dom.elem);

			self.attr_list[data_id] = attr_dom.index.input;

			attr_dom.index.input.onchange = function(){
				window.kbmodules.kickboxing_advanced.save_pairs();
			}
		}
	}

	side(self){
		return (self.pair.players['red'] == self) ? 'red' : 'blu'
	}

	mark_active(self){
		ksys.context.module.prm('active_player', self.side());
		$('#player_list .player_pair .kb_player').removeClass('active_player');
		self.dom.elem.classList.add('active_player');
	}
}


window.kbmodules.kickboxing_advanced.KBPlayerPair = class{
	constructor(){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.dom = ksys.tplates.index_tplate(
			'#kb_player_pair_template',
			{
				'header':        '.pair_header',

				'pair_num':      '.pair_num',
				'flip_players':  '.flip_players',
				'flip_photos':   '.flip_photos',
				'del_pair':      '.del_pair',

				'move_up':       '.move_pair_up',
				'move_down':     '.move_pair_down',

				'pair_players':  '.pair_players',

				'round_amount':  '.round_amount',
			}
		);

		self.index = null;

		window.kbmodules.kickboxing_advanced.pair_list.set(self.dom.elem, self);

		self.players = {
			'red': new window.kbmodules.kickboxing_advanced.KBPlayer(self),
			'blu': new window.kbmodules.kickboxing_advanced.KBPlayer(self),
		}

		// todo: this is basically a hack
		self.players.red.vs_photo_side = 'l';
		self.players.blu.vs_photo_side = 'r';

		self.dom.index.pair_num.textContent = self.index;

		self.dom.index.pair_players.append(
			self.players.red.dom.elem
		)
		self.dom.index.pair_players.append(
			self.players.blu.dom.elem
		)

		self.dom.index.del_pair.onclick = function(evt){
			if (!evt.altKey){
				window.kbmodules.kickboxing_advanced.msg_warn_need_alt();
				return
			}

			window.kbmodules.kickboxing_advanced.pair_list.delete(self.dom.elem);
			self.dom.elem.remove();
			window.kbmodules.kickboxing_advanced.update_pair_index();
			window.kbmodules.kickboxing_advanced.save_pairs();
		}

		self.dom.index.move_up.onclick = function(evt){
			self.move_up();
			window.kbmodules.kickboxing_advanced.update_pair_index();
			window.kbmodules.kickboxing_advanced.save_pairs();
		}
		self.dom.index.move_down.onclick = function(evt){
			self.move_down();
			window.kbmodules.kickboxing_advanced.update_pair_index();
			window.kbmodules.kickboxing_advanced.save_pairs();
		}
		self.dom.index.flip_players.onclick = function(evt){
			self.flip_sides();
			window.kbmodules.kickboxing_advanced.save_pairs();
		}
		self.dom.index.flip_photos.onclick = function(evt){
			self.flip_photos();
			window.kbmodules.kickboxing_advanced.save_pairs();
		}
		self.dom.index.round_amount.onchange = function(evt){
			window.kbmodules.kickboxing_advanced.save_pairs();
		}

		self.dom.index.header.onclick = function(evt){
			if (window.kbmodules.kickboxing_advanced.edit_mode_active){return};
			self.mark_active();
			window.kbmodules.kickboxing_advanced.update_vs_title({
				'tgt_pair': self,
				'update_timer': true,
			});
		}

	}

	to_dict(self){
		return {
			'red': self.players.red.to_dict(),
			'blu': self.players.blu.to_dict(),
			'index': self.index,
			'round_amount': self.dom.index.round_amount.value,
		}
	}

	apply_data(self, pair_data){
		self.dom.index.round_amount.value = pair_data.round_amount || 0;
	}

	// important todo: account for active pairs
	move_up(self){
		const prev_sibling = self.dom.elem.previousSibling;
		if (!prev_sibling || ['#text', 'sysbtn'].includes(prev_sibling.nodeName.lower())){return};
		// todo: this assumes that the parent element is the list itself
		self.dom.elem.parentElement.insertBefore(self.dom.elem, prev_sibling);
	}

	move_down(self){
		const next_sibling = self.dom.elem?.nextSibling?.nextSibling;
		if (!next_sibling || next_sibling.nodeName.lower() == '#text'){
			self.dom.elem.parentElement.append(self.dom.elem);
		};
		// todo: this assumes that the parent element is the list itself
		self.dom.elem.parentElement.insertBefore(self.dom.elem, next_sibling);
	}

	// important todo: account for active players
	flip_sides(self){
		const blu = self.players.blu;
		const red = self.players.red;

		blu.dom.elem.swapWith(red.dom.elem);

		self.players.blu = red;
		self.players.red = blu;

		self.prepare_winners();
	}

	// important todo: account for active players
	flip_photos(self){
		const blu_side = self.players.blu.vs_photo_side;
		const red_side = self.players.red.vs_photo_side;

		self.players.blu.vs_photo_side = red_side;
		self.players.red.vs_photo_side = blu_side;
	}

	flip_colors(self){
		const blu = self.players.blu;
		const red = self.players.red;

		self.players.blu = red;
		self.players.red = blu;
	}

	mark_active(self){
		ksys.context.module.prm('active_pair', self.index);
		$('#player_list .player_pair').removeClass('active_pair');
		self.dom.elem.classList.add('active_pair');

		qsel('#round_amount_fields input[round_amount]').value = self.dom.index.round_amount.value;
		window.kbmodules.kickboxing_advanced.set_round_amount();

		self.prepare_winners();

		window.kbmodules.kickboxing_advanced.current_pair = self;
	}

	prepare_winners(self){
		const red_btn = qsel('[btname="winner_red"]');
		const blu_btn = qsel('[btname="winner_blu"]');

		qsel('[btname="winner_red"] span').innerHTML = `${self.players.red.name} <br> ${self.players.red.surname}`;
		qsel('[btname="winner_blu"] span').innerHTML = `${self.players.blu.name} <br> ${self.players.blu.surname}`;

		red_btn.onclick = function(){
			window.kbmodules.kickboxing_advanced.show_winner(self.players.red);
		}

		blu_btn.onclick = function(){
			window.kbmodules.kickboxing_advanced.show_winner(self.players.blu);
		}
	}
}


window.kbmodules.kickboxing_advanced.msg_warn_need_alt = function(){
	ksys.info_msg.send_msg(
		'Hold ALT',
		'warn',
		3000
	);
}






window.kbmodules.kickboxing_advanced.toggle_edit_mode = function(){
	const dom = document.querySelector('kbstandard');
	dom.removeAttribute('data_preview_mode');
	if (dom.hasAttribute('edit_mode')){
		dom.removeAttribute('edit_mode');
		window.kbmodules.kickboxing_advanced.edit_mode_active = false;
	}else{
		dom.setAttribute('edit_mode', true);
		window.kbmodules.kickboxing_advanced.edit_mode_active = true;
	}
}

window.kbmodules.kickboxing_advanced.toggle_preview_mode = function(){
	const dom = document.querySelector('kbstandard');
	dom.removeAttribute('edit_mode');
	window.kbmodules.kickboxing_advanced.edit_mode_active = false;

	if (dom.hasAttribute('data_preview_mode')){
		dom.removeAttribute('data_preview_mode');
	}else{
		dom.setAttribute('data_preview_mode', true);
	}
}




window.kbmodules.kickboxing_advanced.flip_sides = function(){
	for (const pair of window.kbmodules.kickboxing_advanced.pair_list.values()){
		pair.flip_sides();
	}
	window.kbmodules.kickboxing_advanced.save_pairs();
}

window.kbmodules.kickboxing_advanced.flip_photos = function(){
	for (const pair of window.kbmodules.kickboxing_advanced.pair_list.values()){
		pair.flip_photos();
	}
	window.kbmodules.kickboxing_advanced.save_pairs();
}

window.kbmodules.kickboxing_advanced.flip_colors = function(){
	print('Kys pls?')
	for (const pair of window.kbmodules.kickboxing_advanced.pair_list.values()){
		pair.flip_colors();
	}

	if (document.querySelector('#player_list').classList.contains('red_vs_blu')){
		$('#player_list').removeClass('red_vs_blu');
		$('#player_list').addClass('blu_vs_red');

		ksys.context.module.prm('color_order', 'blu_vs_red');
		return
	}

	if (document.querySelector('#player_list').classList.contains('blu_vs_red')){
		$('#player_list').removeClass('blu_vs_red');
		$('#player_list').addClass('red_vs_blu');

		ksys.context.module.prm('color_order', 'red_vs_blu');
		return
	}
}


window.kbmodules.kickboxing_advanced.update_pair_index = function(){
	if (ksys.context.module.cache.pair_ids_frozen){return};

	let pair_index = 0;
	for (const dom of document.querySelectorAll('#player_list > .player_pair')){
		const pair = window.kbmodules.kickboxing_advanced.pair_list.get(dom);
		pair_index += 1;
		pair.index = pair_index;
		pair.dom.index.pair_num.textContent = pair_index;
	}
}


window.kbmodules.kickboxing_advanced.set_color_order = function(order){
	if (order == 'red_vs_blu'){
		$('#player_list').removeClass('blu_vs_red');
		$('#player_list').addClass('red_vs_blu');
	}else{
		$('#player_list').removeClass('red_vs_blu');
		$('#player_list').addClass('blu_vs_red');
	}
}


window.kbmodules.kickboxing_advanced.save_schema = function(event){
	ksys.db.module.write(
		'player_data_schema.kbdata',
		JSON.stringify(
			Array.from(window.kbmodules.kickboxing_advanced.player_data_schema)
		)
	)

	window.kbmodules.kickboxing_advanced.fwd_update_schema();

	ksys.info_msg.send_msg(`Save OK`, 'ok', 500);
}

window.kbmodules.kickboxing_advanced.load_schema = function(){
	$('#schema_cfg_list').empty();
	let schema_data = ksys.db.module.read('player_data_schema.kbdata');

	if (!schema_data){
		print('No schema save present. Not loading');
		return
	}

	schema_data = JSON.parse(schema_data);

	for (const schema_entry of schema_data){
		window.kbmodules.kickboxing_advanced.add_schema_entry(schema_entry)
	}
}


window.kbmodules.kickboxing_advanced.add_schema_entry = function(data){
	print('Kys pls', data)

	// todo: this || might backfire horrendously
	const schema_data = data || ['', '', '', false, false, false];

	const schema_dom = ksys.tplates.index_tplate(
		'#schema_list_entry_template',
		{
			'field_label':  '.field_label',
			'suffix':       '.suffix',
			'is_image':     '.is_image',
			'is_shared':    '.is_shared',
			'is_text_area': '.is_text_area',
			'idname':       '.idname',

			// 'save':         '.save_schema',
		}
	);

	schema_dom.index.field_label.value = schema_data[0];
	schema_dom.index.suffix.value =      schema_data[1];
	schema_dom.index.idname.value =      schema_data[2];
	schema_dom.index.is_image.checked =  schema_data[3];
	schema_dom.index.is_shared.checked = schema_data[4];
	schema_dom.index.is_text_area.checked = schema_data[5];

	schema_dom.index.field_label.onchange = function(){
		schema_data[0] = schema_dom.index.field_label.value.trim();
	}
	schema_dom.index.suffix.onchange = function(){
		schema_data[1] = schema_dom.index.suffix.value.trim();
	}
	schema_dom.index.idname.onchange = function(){
		schema_data[2] = schema_dom.index.idname.value;
	}
	schema_dom.index.is_image.onchange = function(){
		schema_data[3] = schema_dom.index.is_image.checked;
	}
	schema_dom.index.is_shared.onchange = function(){
		print('SHARED CHANGED?')
		schema_data[4] = schema_dom.index.is_shared.checked;
	}
	schema_dom.index.is_text_area.onchange = function(){
		schema_data[5] = schema_dom.index.is_text_area.checked;
	}


	schema_dom.elem.oncontextmenu = function(evt){
		if (!evt.altKey){
			window.kbmodules.kickboxing_advanced.msg_warn_need_alt();
			return
		}

		window.kbmodules.kickboxing_advanced.player_data_schema.delete(schema_data);
		schema_dom.elem.remove();
	}

	window.kbmodules.kickboxing_advanced.player_data_schema.add(schema_data);

	$('#schema_cfg_list').append(schema_dom.elem);
}


window.kbmodules.kickboxing_advanced.fwd_update_schema = function(){
	for (const pair of window.kbmodules.kickboxing_advanced.pair_list.values()){
		// todo: move this to player pair class
		pair.players.blu.update_schema();
		pair.players.red.update_schema();
	}
}


window.kbmodules.kickboxing_advanced.save_pairs = function(){
	const save_data = {
		'color_order': window.kbmodules.kickboxing_advanced.color_order,
		'pairs': [],
	};

	for (const dom of document.querySelectorAll('#player_list > .player_pair')){
		const pair_data = window.kbmodules.kickboxing_advanced.pair_list.get(dom);
		save_data.pairs.push(
			pair_data.to_dict()
		)
	}

	ksys.db.module.write(
		'pairs.kbdata',
		JSON.stringify(save_data)
	)
}

window.kbmodules.kickboxing_advanced.load_pairs = function(){
	let pair_list = ksys.db.module.read('pairs.kbdata');
	if (!pair_list){return};

	pair_list = JSON.parse(pair_list);

	window.kbmodules.kickboxing_advanced.set_color_order(pair_list.color_order)

	for (const pair_data of pair_list.pairs){
		const pair = window.kbmodules.kickboxing_advanced.add_pair(true);

		// todo: Add "apply" data to the pair class?
		print('Applying data', )
		pair.players.red.apply_data(pair_data.red);
		pair.players.blu.apply_data(pair_data.blu);
		pair.apply_data(pair_data);
		pair.index = pair_data.index;
		pair.dom.index.pair_num.textContent = pair_data.index;
	}
	window.kbmodules.kickboxing_advanced.update_pair_index();

	for (const pair of window.kbmodules.kickboxing_advanced.pair_list.values()){
		if (pair.index == ksys.context.module.cache.active_pair){
			pair.mark_active();
			break
		}
	}
}


window.kbmodules.kickboxing_advanced.add_pair = function(force_add=false){
	if (ksys.context.module.cache.pair_ids_frozen && !force_add){
		ksys.info_msg.send_msg(
			'Cannot add pair: Photo indexes are bound. Unbind them first',
			'warn',
			6000
		);
		return
	}
	const player = new window.kbmodules.kickboxing_advanced.KBPlayerPair();
	$('#player_list').append(player.dom.elem);
	window.kbmodules.kickboxing_advanced.update_pair_index();
	return player;
}



window.kbmodules.kickboxing_advanced.save_res_path = function(){
	ksys.context.module.prm(
		'resource_path',
		document.querySelector('#param_list input[res_path]').value
	)
}



window.kbmodules.kickboxing_advanced._update_vs_title = async function(tgt_pair){
	if (window.kbmodules.kickboxing_advanced.edit_mode_active){return};

	const frmt = ksys.strf.params.players;

	let label_idx = 0;
	for (const schema_data of window.kbmodules.kickboxing_advanced.player_data_schema){
		// Set label
		label_idx += 1;
		const [label, suffix, data_id, is_image, is_shared, is_text_area] = schema_data;

		// todo: YET ANOTHER BOOTLEG HACK...
		if (is_shared){
			await window.kbmodules.kickboxing_advanced.titles.vs.set_text(
				`shared_attr_val`,
				`${label} ${tgt_pair.players['red'].attr_list[data_id].value.trim()} ${suffix}`.trim(),
			)
			// label_idx -= 1;
			continue
		}
		print('LABEL INDEX:', label_idx, schema_data)
		await window.kbmodules.kickboxing_advanced.titles.vs.set_text(
			`ifb_title_lb_${label_idx}`,
			label,
		)

		// Set data
		for (const side of [['l', 'red'], ['r', 'blu']]){
			const [side_vmix, side_kb] = side;

			if (is_image && data_id == 'flag'){
				const tgt_player = tgt_pair.players[side_kb];

				// TODO: BAD TEMP HACK
				await window.kbmodules.kickboxing_advanced.titles.vs.set_img_src(
					`country_${side_vmix}`,
					str(
						Path(ksys.context.module.cache.resource_path)
						.join(tgt_player.attr_list[data_id].value.trim())
					)
					.replaceAll('/', '\\')
				)
				continue
			}

			// Set name/surname
			await window.kbmodules.kickboxing_advanced.titles.vs.set_text(
				`pname_text_${side_vmix}`,
				frmt.format(
					`${tgt_pair.players[side_kb].name} ${tgt_pair.players[side_kb].surname}`
				),
			)

			// todo: this is a temp solution
			if (ksys.context.module.cache.timer_has_vs){
				await window.kbmodules.kickboxing_advanced.titles.timer.set_text(
					`player_${side_vmix}`,
					frmt.format(
						`${tgt_pair.players[side_kb].name} ${tgt_pair.players[side_kb].surname}`
					),
				)
			}

			// Set other data
			let field_val = frmt.format(tgt_pair.players[side_kb].attr_list[data_id].value.trim());
			if (data_id == 'record'){
				field_val = field_val.replaceAll(':', '-');
			}
			if (field_val.trim()){
				await window.kbmodules.kickboxing_advanced.titles.vs.set_text(
					`ifb_text_${side_vmix}_${label_idx}`,
					(field_val + ' ' + suffix).trim()
				)
			}else{
				await window.kbmodules.kickboxing_advanced.titles.vs.set_text(
					`ifb_text_${side_vmix}_${label_idx}`,
					''
				)
			}
		}
	}

	// Set vs image
	// window.kbmodules.kickboxing_advanced.titles.vs.set_img_src(
	// 	'Image1',
	// 	str((Path(ksys.context.module.cache.resource_path))
	// 	.join('pair_pool', `${tgt_pair.index}.png`))
	// 	.replaceAll('/', '\\')
	// )

	for (const side of [['l', 'red'], ['r', 'blu']]){
		const [side_vmix, side_kb] = side;
		const tgt_player = tgt_pair.players[side_kb];

		await window.kbmodules.kickboxing_advanced.titles.vs.set_img_src(
			`player_photo_${side_vmix}`,
			str(
				Path(ksys.context.module.cache.resource_path)
				.join('pair_pool', `${tgt_pair.index}_${tgt_player.vs_photo_side}.png`)
			)
			.replaceAll('/', '\\')
		)
	}

	/*
	for (const side of ['l', 'r']){
		for (const player_col in tgt_pair.players){
			const tgt_player = tgt_pair.players[player_col];
			if (tgt_player.vs_photo_side == side){
				print('kys????', tgt_player, side)
				await window.kbmodules.kickboxing_advanced.titles.vs.set_img_src(
					`player_photo_${side}`,
					str(
						Path(ksys.context.module.cache.resource_path)
						.join('pair_pool', `${tgt_pair.index}_${side}.png`)
					)
					.replaceAll('/', '\\')
				)
			}
		}
	}
	*/

}




window.kbmodules.kickboxing_advanced.update_vs_title = async function(vs_params){
	if (window.kbmodules.kickboxing_advanced.edit_mode_active){return};

	const tgt_pair = vs_params.tgt_pair;
	const field_suffix = vs_params.field_suffix || '';
	const photo_src = vs_params.photo_src || 'pair_pool';
	const tgt_title = vs_params.tgt_title || window.kbmodules.kickboxing_advanced.titles.vs;
	const update_timer = vs_params.update_timer || false;

	const frmt = ksys.strf.params.players;

	let label_idx = 0;
	for (const schema_data of window.kbmodules.kickboxing_advanced.player_data_schema){
		// Set label
		label_idx += 1;
		const [label, suffix, data_id, is_image, is_shared, is_text_area] = schema_data;

		// todo: YET ANOTHER BOOTLEG HACK...
		if (is_shared){
			await tgt_title.set_text(
				`shared_attr_val` + field_suffix,
				`${label} ${tgt_pair.players['red'].attr_list[data_id].value.trim()} ${suffix}`.trim(),
			)
			// label_idx -= 1;
			continue
		}
		print('LABEL INDEX:', label_idx, schema_data)
		await tgt_title.set_text(
			`ifb_title_lb_${label_idx}` + field_suffix,
			label,
		)

		// Set data
		for (const side of [['l', 'red'], ['r', 'blu']]){
			const [side_vmix, side_kb] = side;

			if (is_image && data_id == 'flag'){
				const tgt_player = tgt_pair.players[side_kb];

				// TODO: BAD TEMP HACK
				await tgt_title.set_img_src(
					`country_${side_vmix}` + field_suffix,
					str(
						Path(ksys.context.module.cache.resource_path)
						.join(tgt_player.attr_list[data_id].value.trim())
					)
					.replaceAll('/', '\\')
				)
				continue
			}

			// Set name/surname
			await tgt_title.set_text(
				`pname_text_${side_vmix}` + field_suffix,
				frmt.format(
					`${tgt_pair.players[side_kb].name} ${tgt_pair.players[side_kb].surname}`
				),
			)
			await tgt_title.set_text(
				`name_${side_vmix}` + field_suffix,
				frmt.format(
					tgt_pair.players[side_kb].name
				),
			)
			await tgt_title.set_text(
				`surname_${side_vmix}` + field_suffix,
				frmt.format(
					tgt_pair.players[side_kb].surname
				),
			)

			// todo: this is a temp solution
			if (ksys.context.module.cache.timer_has_vs && update_timer){
				await window.kbmodules.kickboxing_advanced.titles.timer.set_text(
					`player_${side_vmix}` + field_suffix,
					frmt.format(
						`${tgt_pair.players[side_kb].name} ${tgt_pair.players[side_kb].surname}`
					),
				)
				await window.kbmodules.kickboxing_advanced.titles.timer.set_text(
					`pname_text_${side_vmix}` + field_suffix,
					frmt.format(
						`${tgt_pair.players[side_kb].name.trim()} ${tgt_pair.players[side_kb].surname.trim()}`
					),
				)
			}

			// Set other data
			let field_val = frmt.format(tgt_pair.players[side_kb].attr_list[data_id].value.trim());
			if (data_id == 'record'){
				field_val = field_val.replaceAll(':', '-');
			}
			if (field_val.trim()){
				await tgt_title.set_text(
					`ifb_text_${side_vmix}_${label_idx}` + field_suffix,
					(field_val + ' ' + suffix).trim()
				)
			}else{
				await tgt_title.set_text(
					`ifb_text_${side_vmix}_${label_idx}` + field_suffix,
					''
				)
			}
		}
	}

	// Set vs image
	// window.kbmodules.kickboxing_advanced.titles.vs.set_img_src(
	// 	'Image1',
	// 	str((Path(ksys.context.module.cache.resource_path))
	// 	.join('pair_pool', `${tgt_pair.index}.png`))
	// 	.replaceAll('/', '\\')
	// )

	for (const side of [['l', 'red'], ['r', 'blu']]){
		const [side_vmix, side_kb] = side;
		const tgt_player = tgt_pair.players[side_kb];

		await tgt_title.set_img_src(
			`player_photo_${side_vmix}` + field_suffix,
			str(
				Path(ksys.context.module.cache.resource_path)
				.join(photo_src, `${tgt_pair.index}_${tgt_player.vs_photo_side}.png`)
			)
			.replaceAll('/', '\\')
		)
	}


	// Round amount
	await tgt_title.set_text(
		'round_count' + field_suffix,
		tgt_pair.dom.index.round_amount.value + ' ' + 'ROUNDS',
	)


	/*
	for (const side of ['l', 'r']){
		for (const player_col in tgt_pair.players){
			const tgt_player = tgt_pair.players[player_col];
			if (tgt_player.vs_photo_side == side){
				print('kys????', tgt_player, side)
				await window.kbmodules.kickboxing_advanced.titles.vs.set_img_src(
					`player_photo_${side}`,
					str(
						Path(ksys.context.module.cache.resource_path)
						.join('pair_pool', `${tgt_pair.index}_${side}.png`)
					)
					.replaceAll('/', '\\')
				)
			}
		}
	}
	*/

}




window.kbmodules.kickboxing_advanced.main_event_vis = async function(){
	await window.kbmodules.kickboxing_advanced.update_vs_title({
		'tgt_pair': window.kbmodules.kickboxing_advanced.pair_list.get(
			[...qselAll('#player_list > .player_pair')].at(-1)
		),
		'update_timer': false,
		'tgt_title': window.kbmodules.kickboxing_advanced.titles.main_event,
		'photo_src': 'pair_pool_rect',
	})

	ksys.btns.adv_timeout({
		'main_event_onn':          window.kbmodules.kickboxing_advanced.titles.main_event.anim_durations[null],
		'comain_event_onn':        window.kbmodules.kickboxing_advanced.titles.main_event.anim_durations[null],
		'main_w_comain_event_onn': window.kbmodules.kickboxing_advanced.titles.main_event.anim_durations[null],
	})

	await window.kbmodules.kickboxing_advanced.titles.main_event.overlay_in();
}

window.kbmodules.kickboxing_advanced.comain_event_vis = async function(){
	await window.kbmodules.kickboxing_advanced.update_vs_title({
		'tgt_pair': window.kbmodules.kickboxing_advanced.pair_list.get(
			[...qselAll('#player_list > .player_pair')].at(-2)
		),
		'update_timer': false,
		'tgt_title': window.kbmodules.kickboxing_advanced.titles.comain_event,
		'photo_src': 'pair_pool_rect',
	})

	ksys.btns.adv_timeout({
		'main_event_onn':          window.kbmodules.kickboxing_advanced.titles.comain_event.anim_durations[null],
		'comain_event_onn':        window.kbmodules.kickboxing_advanced.titles.comain_event.anim_durations[null],
		'main_w_comain_event_onn': window.kbmodules.kickboxing_advanced.titles.comain_event.anim_durations[null],
	})

	await window.kbmodules.kickboxing_advanced.titles.comain_event.overlay_in();
}

window.kbmodules.kickboxing_advanced.main_w_comain_event_vis = async function(){
	await window.kbmodules.kickboxing_advanced.update_vs_title({
		'tgt_pair': window.kbmodules.kickboxing_advanced.pair_list.get(
			[...qselAll('#player_list > .player_pair')].at(-1)
		),
		'update_timer': false,
		'tgt_title': window.kbmodules.kickboxing_advanced.titles.main_w_comain,
		'field_suffix': '_1',
		'photo_src': 'pair_pool_rect',
	})
	await window.kbmodules.kickboxing_advanced.update_vs_title({
		'tgt_pair': window.kbmodules.kickboxing_advanced.pair_list.get(
			[...qselAll('#player_list > .player_pair')].at(-2)
		),
		'update_timer': false,
		'tgt_title': window.kbmodules.kickboxing_advanced.titles.main_w_comain,
		'field_suffix': '_2',
		'photo_src': 'pair_pool_rect',
	})

	ksys.btns.adv_timeout({
		'main_event_onn':          window.kbmodules.kickboxing_advanced.titles.main_w_comain.anim_durations[null],
		'comain_event_onn':        window.kbmodules.kickboxing_advanced.titles.main_w_comain.anim_durations[null],
		'main_w_comain_event_onn': window.kbmodules.kickboxing_advanced.titles.main_w_comain.anim_durations[null],
	})

	await window.kbmodules.kickboxing_advanced.titles.main_w_comain.overlay_in();
}

window.kbmodules.kickboxing_advanced.hide_events = async function(){
	ksys.btns.toggle({
		'main_event_onn':          false,
		'comain_event_onn':        false,
		'main_w_comain_event_onn': false,
		'all_events_off':          false,
	})

	await window.kbmodules.kickboxing_advanced.titles.main_event.overlay_out_all();
	await window.kbmodules.kickboxing_advanced.titles.comain_event.overlay_out_all();
	await window.kbmodules.kickboxing_advanced.titles.main_w_comain.overlay_out_all();

	ksys.btns.toggle({
		'main_event_onn':          true,
		'comain_event_onn':        true,
		'main_w_comain_event_onn': true,
		'all_events_off':          true,
	})
}



window.kbmodules.kickboxing_advanced.undercard_show = async function(offs=0){
	const per_page = 4;
	const pairs = [...qselAll('#player_list > .player_pair')];

	ksys.btns.toggle({
		'undercard_onn_1': false,
		'undercard_onn_2': false,
	})

	for (const idx of range(per_page)){
		const tgt_pair = window.kbmodules.kickboxing_advanced.pair_list.get(
			pairs[(per_page * offs) + idx]
		)

		await window.kbmodules.kickboxing_advanced.update_vs_title({
			'tgt_pair': tgt_pair,
			'update_timer': false,
			'tgt_title': window.kbmodules.kickboxing_advanced.titles.undercard,
			'photo_src': 'pair_pool_sq',
			'field_suffix': `_${idx+1}`,
		})
	}

	ksys.btns.adv_timeout({
		'undercard_onn_1': window.kbmodules.kickboxing_advanced.titles.undercard.anim_durations[null],
		'undercard_onn_2': window.kbmodules.kickboxing_advanced.titles.undercard.anim_durations[null],
	})

	await window.kbmodules.kickboxing_advanced.titles.undercard.overlay_in();

	ksys.btns.toggle({
		'undercard_onn_1': true,
		'undercard_onn_2': true,
	})
}

window.kbmodules.kickboxing_advanced.undercard_hide = async function(){
	ksys.btns.toggle({
		'undercard_onn_1': false,
		'undercard_onn_2': false,
		'undercard_off':   false,
	})

	await window.kbmodules.kickboxing_advanced.titles.undercard.overlay_out_all();

	ksys.btns.toggle({
		'undercard_onn_1': true,
		'undercard_onn_2': true,
		'undercard_off':   true,
	})
}



window.kbmodules.kickboxing_advanced.show_judges = async function(){

	let judges = [];
	for (const player_data of Object.values(window.kbmodules.kickboxing_advanced.current_pair.players)){
		if (player_data.attr_list?.judges?.value){
			judges = player_data.attr_list.judges.value?.trim?.()?.split?.('\n');
			judges.shift()
		}
	}

	for (const idx of range(3)){
		await window.kbmodules.kickboxing_advanced.titles.judges.set_text(
			`name_${idx+1}`,
			(judges[idx] || '').upper()
		)
	}

	ksys.btns.adv_timeout({
		'judges_onn':      window.kbmodules.kickboxing_advanced.titles.judges.anim_durations[null],
		'referee_onn':     window.kbmodules.kickboxing_advanced.titles.judges.anim_durations[null],
		'upcoming_center': window.kbmodules.kickboxing_advanced.titles.judges.anim_durations[null],
		'upcoming_corner': window.kbmodules.kickboxing_advanced.titles.judges.anim_durations[null],
	})

	await window.kbmodules.kickboxing_advanced.titles.judges.overlay_in();
}

window.kbmodules.kickboxing_advanced.show_referee = async function(){
	let referee = '';
	for (const player_data of Object.values(window.kbmodules.kickboxing_advanced.current_pair.players)){
		if (player_data.attr_list?.judges?.value){
			referee = player_data.attr_list.judges.value?.trim?.()?.split?.('\n')?.shift?.();
		}
	}

	await window.kbmodules.kickboxing_advanced.titles.referee.set_text(
		'name',
		referee.upper().replace('Р.', '').replace('P.', '').trim()
	)

	ksys.btns.adv_timeout({
		'judges_onn':      window.kbmodules.kickboxing_advanced.titles.referee.anim_durations[null],
		'referee_onn':     window.kbmodules.kickboxing_advanced.titles.referee.anim_durations[null],
		'upcoming_center': window.kbmodules.kickboxing_advanced.titles.referee.anim_durations[null],
		'upcoming_corner': window.kbmodules.kickboxing_advanced.titles.referee.anim_durations[null],
	})

	await window.kbmodules.kickboxing_advanced.titles.referee.overlay_in();
}

window.kbmodules.kickboxing_advanced.upcoming_show = async function(variant){
	const title = (variant == 'center') ? window.kbmodules.kickboxing_advanced.titles.upcoming_center : window.kbmodules.kickboxing_advanced.titles.upcoming_corner;

	await window.kbmodules.kickboxing_advanced.update_vs_title({
		'tgt_pair': window.kbmodules.kickboxing_advanced.pair_list.get(
			window.kbmodules.kickboxing_advanced.current_pair.dom.root.nextSibling
		),
		'update_timer': false,
		'tgt_title': title,
		'photo_src': 'pair_pool_sq',
	})

	ksys.btns.adv_timeout({
		'upcoming_center': title.anim_durations[null],
		'upcoming_corner': title.anim_durations[null],
	})

	await title.overlay_in();
}

window.kbmodules.kickboxing_advanced.judges_off = async function(){
	ksys.btns.toggle({
		'judges_onn':      false,
		'referee_onn':     false,
		'upcoming_center': false,
		'upcoming_corner': false,
		'judges_off':      false,
	})

	await window.kbmodules.kickboxing_advanced.titles.judges.overlay_out_all();
	await window.kbmodules.kickboxing_advanced.titles.referee.overlay_out_all();

	await window.kbmodules.kickboxing_advanced.titles.upcoming_center.overlay_out_all();
	await window.kbmodules.kickboxing_advanced.titles.upcoming_corner.overlay_out_all();

	ksys.btns.toggle({
		'judges_onn':      true,
		'referee_onn':     true,
		'upcoming_center': true,
		'upcoming_corner': true,
		'judges_off':      true,
	})
}




window.kbmodules.kickboxing_advanced.update_personal_title = async function(tgt_player){
	if (window.kbmodules.kickboxing_advanced.edit_mode_active){return};

	ksys.context.module.prm(
		'active_player',
		tgt_player.side(),
	)

	const frmt = ksys.strf.params.players;
	const title = window.kbmodules.kickboxing_advanced.titles.personal;

	// Set name/surname
	await title.set_text(
		'name',
		frmt.format(tgt_player.name)
	);
	await title.set_text(
		'surname',
		frmt.format(tgt_player.surname)
	);

	// Set name/surname
	await title.set_text(
		'full_name',
		frmt.format(
			`${tgt_player.name} ${tgt_player.surname}`
		)
	);

	// Set other data
	let label_idx = 0;
	for (const schema_data of window.kbmodules.kickboxing_advanced.player_data_schema){
		label_idx += 1;
		const [label, suffix, data_id, is_image] = schema_data;

		await title.set_text(`attr_${label_idx}_label`, label);

		if (is_image){
			await title.set_img_src(
				`attr_${label_idx}_val`,
				str(
					Path(ksys.context.module.cache.resource_path)
					.join(tgt_player.attr_list[data_id].value.trim())
				)
				.replaceAll('/', '\\')
			)
		}else{
			let field_val = tgt_player.attr_list[data_id].value.trim();
			if (data_id == 'record'){
				field_val = str(field_val).upper().replaceAll(':', '-');
			}

			if (field_val){
				await title.set_text(
					`attr_${label_idx}_val`,
					(str(field_val).upper() + ' ' + suffix).trim(),
				)
			}else{
				await title.set_text(
					`attr_${label_idx}_val`,
					'',
				)
			}

		}

	}

}



window.kbmodules.kickboxing_advanced.show_winner = async function(tgt_player){
	const title = window.kbmodules.kickboxing_advanced.titles.winner;
	const frmt = ksys.strf.params.players;


	await title.set_text(
		'full_name',
		frmt.format(
			`${tgt_player.name} ${tgt_player.surname}`
		)
	);

	ksys.btns.adv_timeout({
		'winner_red': window.kbmodules.kickboxing_advanced.titles.winner.anim_durations[null],
		'winner_blu': window.kbmodules.kickboxing_advanced.titles.winner.anim_durations[null],
	})

	await title.overlay_in();
}

window.kbmodules.kickboxing_advanced.hide_winner = async function(){
	ksys.btns.toggle({
		'winner_red': false,
		'winner_blu': false,
		'winner_off': false,
	})

	await window.kbmodules.kickboxing_advanced.titles.winner.overlay_out_all();

	ksys.btns.toggle({
		'winner_red': true,
		'winner_blu': true,
		'winner_off': true,
	})
}



window.kbmodules.kickboxing_advanced.vs_onn = async function(){
	if (ksys.context.module.cache.vs_as_movs){
		await vmix.talker.talk({
			'Function': 'OverlayInput1In',
			'Input': `kbvs_${ksys.context.module.cache.active_pair}.mov`,
		})
		return
	}
	ksys.btns.adv_timeout({
		'vs_onn': window.kbmodules.kickboxing_advanced.titles.vs.anim_durations[null],
	})

	await window.kbmodules.kickboxing_advanced.titles.vs.overlay_in(1);
}

window.kbmodules.kickboxing_advanced.vs_off = async function(){
	if (ksys.context.module.cache.vs_as_movs){
		await vmix.talker.talk({
			'Function': 'OverlayInput1Out',
			'Input': `kbvs_${ksys.context.module.cache.active_pair}.mov`,
		})
		return
	}

	ksys.btns.adv_timeout({
		'vs_off': window.kbmodules.kickboxing_advanced.titles.vs.anim_durations['TransitionOut'],
	})

	await window.kbmodules.kickboxing_advanced.titles.vs.overlay_out(1);
}



window.kbmodules.kickboxing_advanced.player_onn = async function(){
	ksys.btns.adv_timeout({
		'player_onn': window.kbmodules.kickboxing_advanced.titles.personal.anim_durations[null],
	})

	await window.kbmodules.kickboxing_advanced.titles.personal.overlay_in(1);
}

window.kbmodules.kickboxing_advanced.player_off = async function(){
	ksys.btns.adv_timeout({
		'player_off': window.kbmodules.kickboxing_advanced.titles.personal.anim_durations['TransitionOut'],
	})

	await window.kbmodules.kickboxing_advanced.titles.personal.overlay_out(1);
}









// ==============================
//            Timer
// ==============================

window.kbmodules.kickboxing_advanced.clock_pause = async function(){
	await ksys.ticker.bundestag.edit_clock({
		'clock_id': window.kbmodules.kickboxing_advanced.main_clock_id,
		'action': 'pause',
		'data': {}
	})
}

window.kbmodules.kickboxing_advanced.clock_resume = async function(){
	await ksys.ticker.bundestag.edit_clock({
		'clock_id': window.kbmodules.kickboxing_advanced.main_clock_id,
		'action': 'resume',
		'data': {}
	})
}

window.kbmodules.kickboxing_advanced.clock_stop = async function(){
	await ksys.ticker.bundestag.edit_clock({
		'clock_id': window.kbmodules.kickboxing_advanced.main_clock_id,
		'action': 'stop',
		'data': {}
	})
}

window.kbmodules.kickboxing_advanced.clock_reset = async function(){
	await window.kbmodules.kickboxing_advanced.clock_stop();

	const dur = ksys.context.module.cache.round_duration;
	await window.kbmodules.kickboxing_advanced.titles.timer.set_text(
		'clock',
		`${str(dur.minutes).zfill(0)}:${str(dur.seconds).zfill(2)}`
	);

	$('#timer_feedback').text(
		`${str(dur.minutes).zfill(2)}:${str(dur.seconds).zfill(2)}`
	);
}

window.kbmodules.kickboxing_advanced.clock_hide = async function(pause=false){
	if (pause){
		await window.kbmodules.kickboxing_advanced.clock_pause();
	}
	await window.kbmodules.kickboxing_advanced.titles.timer.overlay_out(1);
}

window.kbmodules.kickboxing_advanced.clock_show = async function(resume=true){
	await window.kbmodules.kickboxing_advanced.titles.timer.set_text(
		'info_text',
		`ROUND ${ksys.context.module.cache.active_round || 1}/${ksys.context.module.cache.round_amount}`
	)

	const clock_state = await ksys.ticker.bundestag.read_clock(window.kbmodules.kickboxing_advanced.main_clock_id);
	if (!clock_state || clock_state?.stopped){
		window.kbmodules.kickboxing_advanced.clock_fire();
	}
	if (clock_state || clock_state.paused){
		await window.kbmodules.kickboxing_advanced.clock_resume();
	}

	await window.kbmodules.kickboxing_advanced.titles.timer.overlay_in(1);
}

window.kbmodules.kickboxing_advanced.clock_tick_event = async function(data){
	const time = data.time;

	// window.kbmodules.kickboxing_advanced.clock_feed.textContent = (
	// 	str(time.clock.minutes).padStart(2, '0') + ':' +
	// 	str(time.clock.seconds).padStart(2, '0') + '.' +
	// 	str(time.clock.ms)
	// );

	window.kbmodules.kickboxing_advanced.clock_feed.textContent = (
		str(time.clock.minutes).padStart(2, '0') + ':' +
		str(time.clock.seconds).padStart(2, '0')
	);

	// if (time.total.seconds <= 9){
	if (time.tick <= 9){
		await window.kbmodules.kickboxing_advanced.clock_hide();
		await ksys.util.sleep(1500);
		// await window.kbmodules.kickboxing_advanced.clock_stop();
		window.kbmodules.kickboxing_advanced.clock_reset();
	}
}

window.kbmodules.kickboxing_advanced.clock_end_event = async function(){
	window.kbmodules.kickboxing_advanced.clock_reset();
}

window.kbmodules.kickboxing_advanced.set_clock_duration = function(){
	ksys.context.module.prm(
		'round_duration',
		{
			'minutes': int(document.querySelector('#round_duration_cfg_field [minutes]').value) || 1,
			'seconds': int(document.querySelector('#round_duration_cfg_field [seconds]').value) || 0,
		}
	)
}

window.kbmodules.kickboxing_advanced.set_round_amount = function(){
	ksys.context.module.prm(
		'round_amount',
		int(document.querySelector('#round_amount_fields input[round_amount]').value) || 8
	)
	window.kbmodules.kickboxing_advanced.redraw_round_switches();
}

window.kbmodules.kickboxing_advanced.set_round = async function(r, reset=false){
	// store current round number
	ksys.context.module.prm('current_round', r);

	await window.kbmodules.kickboxing_advanced.titles.timer.set_text('round', `ROUND ${str(r).trim()}`);

	if (reset == true){
		await window.kbmodules.kickboxing_advanced.clock_reset();
	}
}

window.kbmodules.kickboxing_advanced.clock_fire = async function(offset=null){
	const dur = ksys.context.module.cache.round_duration;

	await ksys.ticker.bundestag.edit_clock({
		'clock_id': window.kbmodules.kickboxing_advanced.main_clock_id,
		'action': 'fire',
		'data': {
			'clock': {
				'duration': (dur.minutes * 60) + dur.seconds,
				'offset': offset,
				'reversed': true,
				'vmix_fields': [{
					'count_as': 'clock',
					'tplate': '%m%:%s%',
					'gtzip_name': 'timer.gtzip',
					'text_field_name': 'clock',
					'pad_m': 0,
					'pad_s': 2,
				}],
			}
		}
	})
}

window.kbmodules.kickboxing_advanced.clock_fire_offset = async function(){
	const dur = ksys.context.module.cache.round_duration;
	const dur_s = (dur.minutes * 60) + dur.seconds;
	const offs_s = (
		(int(document.querySelector('#set_time_minutes').value || 0) * 60) +
		 int(document.querySelector('#set_time_seconds').value || 0)
	)

	await window.kbmodules.kickboxing_advanced.clock_fire(
		dur_s - offs_s
	)
}







/*
window.kbmodules.kickboxing_advanced.timer_callback = async function(ticks){
	const minutes = Math.floor(ticks.global / 60);
	const seconds = ticks.global - (60*minutes);

	if (ticks.global <= 9){
		await window.kbmodules.kickboxing_advanced.timer_hide(true);
		window.kbmodules.kickboxing_advanced.counter.force_kill();
	}

	const timer_text = `${minutes}:${str(seconds).zfill(2)}`;

	await window.kbmodules.kickboxing_advanced.titles.timer.set_text(
		'clock',
		timer_text,
	)

	$('#timer_feedback').text(timer_text);
}

window.kbmodules.kickboxing_advanced.respawn_manager = function(act){
	// onn = the big button onn
	// if there's no timer OR the prev one is dead - create one and start and then show
	// if there's timer and it's alive - unpase and show
	if (!window.kbmodules.kickboxing_advanced.counter.alive){
		window.kbmodules.kickboxing_advanced.respawn_timer(true, true)
	}else{
		if (window.kbmodules.kickboxing_advanced.counter.alive == true){
			// clear pause
			// window.kbmodules.kickboxing_advanced.timer_pause(false)
			window.kbmodules.kickboxing_advanced.timer_show()
		} 
	}
}

window.kbmodules.kickboxing_advanced.respawn_timer = async function(show=false, st=false){
	const ctx = ksys.context.module.cache;

	const round_dur = ctx.round_duration;

	// const minutes = Math.floor(
	// 	(ctx.round_duration / 1000) / 60
	// )
	// const seconds = (ctx.round_duration / 1000) - (60*minutes);

	window.kbmodules.kickboxing_advanced.titles.timer.set_text(
		'clock',
		`${round_dur.minutes}:${str(round_dur.seconds).zfill(2)}`
	);
	$('#timer_feedback').text(
		`${round_dur.minutes}:${str(round_dur.seconds).zfill(2)}`
	);

	// kill previous timer
	try{
		window.kbmodules.kickboxing_advanced.counter.force_kill();
	}catch (error){
		print(error);
	}

	// spawn a timer
	window.kbmodules.kickboxing_advanced.counter = ksys.ticker.spawn({
		'duration': (round_dur.minutes * 60) + round_dur.seconds,
		'name': 'giga_timer',
		'infinite': false,
		'reversed': true,
		'callback': window.kbmodules.kickboxing_advanced.timer_callback,
		'wait': true
	})
	// init and show, if asked
	if (st == true){
		// init
		window.kbmodules.kickboxing_advanced.counter.fire()
		.then(function(_ticker) {
			_ticker.force_kill()
		})
	}

	if (show == true){
		// await ksys.util.sleep(2000)
		await window.kbmodules.kickboxing_advanced.timer_show()
	}
}

window.kbmodules.kickboxing_advanced.timer_pause = function(state=true){
	if (window.kbmodules.kickboxing_advanced.counter){
		window.kbmodules.kickboxing_advanced.counter.pause = state;
	}
}

window.kbmodules.kickboxing_advanced.timer_set_time = function(){
	const round_dur_data = ksys.context.module.cache.round_duration;

	const offset_seconds = (
		(int(document.querySelector('#set_time_minutes').value) * 60) +
		int(document.querySelector('#set_time_seconds').value)
	)

	const round_dur = (round_dur_data.minutes * 60) + round_dur_data.seconds;

	if (window.kbmodules.kickboxing_advanced.counter){
		try{
			window.kbmodules.kickboxing_advanced.counter.force_kill()
		}catch (error){}

		// spawn a timer
		window.kbmodules.kickboxing_advanced.counter = ksys.ticker.spawn({
			'duration': offset_seconds,
			// 'offset': tm,
			'name': 'giga_timer',
			'infinite': false,
			'reversed': true,
			'callback': window.kbmodules.kickboxing_advanced.timer_callback,
			'wait': true
		})
		// init
		window.kbmodules.kickboxing_advanced.counter.fire()
		.then(function(_ticker) {
			_ticker.force_kill()
		})
	}
}
*/











window.kbmodules.kickboxing_advanced.redraw_round_switches = function(){
	$('#round_selector').empty();

	for (const rnum of range(1, (ksys.context.module.cache.round_amount + 1) || 8)){
		const dom = ksys.tplates.index_tplate(
			'#round_selector_item_template',
			{}
		);

		dom.elem.textContent = rnum;

		dom.elem.onclick = function(){
			window.kbmodules.kickboxing_advanced.set_round(rnum, true);
			$('#round_selector .round_selector_item').removeClass('active_round');
			dom.elem.classList.add('active_round');
			ksys.context.module.prm('active_round', rnum);
		}

		if (ksys.context.module.cache.active_round == rnum){
			$('#round_selector .round_selector_item').removeClass('active_round');
			dom.elem.classList.add('active_round');
		}

		$('#round_selector').append(dom.elem);
	}
}








window.kbmodules.kickboxing_advanced.bind_photo_ids = function(){
	ksys.context.module.prm('pair_ids_frozen', true);
}

window.kbmodules.kickboxing_advanced.unbind_photo_ids = function(){
	ksys.context.module.prm('pair_ids_frozen', false);
}









/*
window.kbmodules.kickboxing_advanced.update_img_proxy_addr = function(){
	const addr = document.querySelector('#image_proxies_addr').value;

	ksys.context.module.prm(
		'img_proxy_addr',
		addr
	)

	if (vmix.util.global_params.proxy){
		vmix.util.global_params.proxy.own_addr = addr;
	}
}

window.kbmodules.kickboxing_advanced.update_img_proxy_whitelist = function(){
	const whitelist = document.querySelector('#img_proxy_whitelist').value;

	ksys.db.module.write(
		'proxy_whitelist.kbdata',
		whitelist
	)

	if (vmix.util.global_params.proxy){
		vmix.util.global_params.proxy.whitelist = whitelist.split('\n');
	}
}


window.kbmodules.kickboxing_advanced.toggle_image_proxies = function(){
	const state = document.querySelector('#image_proxies').checked;

	ksys.context.module.prm('img_proxies_enabled', state);

	if (state){
		vmix.util.enable_image_proxy(
			document.querySelector('#image_proxies_addr').value,
			document.querySelector('#img_proxy_whitelist').value.split('\n'),
		);
	}else{
		vmix.util.disable_image_proxy();
	}
}
*/





