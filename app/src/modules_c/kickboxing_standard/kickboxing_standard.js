
if(!window.kbmodules){window.kbmodules={}};
if(!window.kbmodules.kickboxing_standard){window.kbmodules.kickboxing_standard={}};


window.kbmodules.kickboxing_standard.counter = {};

window.kbmodules.kickboxing_standard.load = function(){
	window.kbmodules.kickboxing_standard.player_data_schema = new Set();
	window.kbmodules.kickboxing_standard.pair_list = new Map();

	window.kbmodules.kickboxing_standard.edit_mode_active = false;

	window.kbmodules.kickboxing_standard.load_schema();

	// window.kbmodules.kickboxing_standard.add_pair();
	window.kbmodules.kickboxing_standard.load_pairs();

	window.kbmodules.kickboxing_standard.color_order = ksys.context.module.cache.color_order;

	// important todo: wtf does colour flip even do ????
	window.kbmodules.kickboxing_standard.set_color_order(window.kbmodules.kickboxing_standard.color_order);

	window.kbmodules.kickboxing_standard.redraw_round_switches();

	document.querySelector('#param_list input[res_path]').value = ksys.context.module.cache.resource_path || '';

	document.querySelector('#round_duration_cfg_field input[minutes]').value =
		ksys.context.module.cache?.round_duration?.minutes || '';
	document.querySelector('#round_duration_cfg_field input[seconds]').value =
		ksys.context.module.cache?.round_duration?.seconds || '';

	document.querySelector('#round_amount_fields input[round_amount]').value = 
		ksys.context.module.cache.round_amount || '';


	window.kbmodules.kickboxing_standard.titles = {
		'personal': new vmix.title({
			'title_name': 'personal.gtzip',
		}),

		'vs': new vmix.title({
			'title_name': 'vs_main.gtzip',
		}),

		'timer': new vmix.title({
			'title_name': 'timer.gtzip',
		}),

		'lower': new vmix.title({
			'title_name': 'midfight_lower.gtzip',
		}),
	}
}

window.kbmodules.kickboxing_standard.KBPlayer = class{
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
				window.kbmodules.kickboxing_standard.save_pairs();
			}
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
				window.kbmodules.kickboxing_standard.save_pairs();
			}
			self.dom.index.player_data.append(dom.elem);
			self.attr_list['surname'] = dom.index.input;
		}


		self._update_schema(self);

		self.dom.elem.onclick = function(){
			if (window.kbmodules.kickboxing_standard.edit_mode_active){return};
			self.mark_active();
			window.kbmodules.kickboxing_standard.update_personal_title(self);
		}

		{
			self.to_dict = function(){
				return self._to_dict(self);
			}
			self.apply_data = function(data){
				return self._apply_data(self, data);
			}
			self.update_schema = function(){
				return self._update_schema(self);
			}
			self.side = function(){
				return self._side(self);
			}
			self.mark_active = function(){
				return self._mark_active(self);
			}
		}
	}

	_to_dict(self){
		const data = {
			'name': self.name,
			'surname': self.surname,
		};
		for (const data_id in self.attr_list){
			data[data_id] = self.attr_list[data_id].value;
		}

		return data;
	}

	_apply_data(self, data){
		self.name = data.name;
		self.surname = data.surname;

		self.attr_list.name.value = data.name;
		self.attr_list.surname.value = data.surname;

		self.dom.index.vis_display.textContent = `${self.name} ${self.surname}`;

		for (const schema_data of window.kbmodules.kickboxing_standard.player_data_schema){
			const [label, suffix, data_id] = schema_data;
			if (!self.attr_list[data_id]){continue};

			self.attr_list[data_id].value = data[data_id] || '';
		}
	}

	_update_schema(self){
		// Add data entries according to schema
		for (const schema_data of window.kbmodules.kickboxing_standard.player_data_schema){
			const attr_dom = ksys.tplates.index_tplate(
				'#kb_player_data_entry_template',
				{
					'label':  '.data_entry_label',
					'input':  '.data_entry_input',
				}
			);

			const [label, suffix, data_id] = schema_data;

			if (data_id in self.attr_list){continue};

			attr_dom.index.label.textContent = ksys.util.str_ops.format(label, 1);
			self.dom.index.player_data.append(attr_dom.elem);

			self.attr_list[data_id] = attr_dom.index.input;

			attr_dom.index.input.onchange = function(){
				window.kbmodules.kickboxing_standard.save_pairs();
			}
		}
	}

	_side(self){
		return (self.pair.players['red'] == self) ? 'red' : 'blu'
	}

	_mark_active(self){
		ksys.context.module.prm('active_player', self.side());
		$('#player_list .player_pair .kb_player').removeClass('active_player');
		self.dom.elem.classList.add('active_player');
	}
}


window.kbmodules.kickboxing_standard.KBPlayerPair = class{
	constructor(){
		const self = this;

		self.dom = ksys.tplates.index_tplate(
			'#kb_player_pair_template',
			{
				'header':        '.pair_header',

				'pair_num':      '.pair_num',
				'flip_players':  '.flip_players',
				'del_pair':      '.del_pair',

				'move_up':       '.move_pair_up',
				'move_down':     '.move_pair_down',

				'pair_players':  '.pair_players',
			}
		);

		self.index = null;

		window.kbmodules.kickboxing_standard.pair_list.set(self.dom.elem, self);

		self.players = {
			'red': new window.kbmodules.kickboxing_standard.KBPlayer(self),
			'blu': new window.kbmodules.kickboxing_standard.KBPlayer(self),
		}

		self.dom.index.pair_players.append(
			self.players.red.dom.elem
		)
		self.dom.index.pair_players.append(
			self.players.blu.dom.elem
		)

		self.dom.index.del_pair.onclick = function(evt){
			if (!evt.altKey){
				window.kbmodules.kickboxing_standard.msg_warn_need_alt();
				return
			}

			window.kbmodules.kickboxing_standard.pair_list.delete(self.dom.elem);
			self.dom.elem.remove();
			window.kbmodules.kickboxing_standard.update_pair_index();
			window.kbmodules.kickboxing_standard.save_pairs();
		}

		self.dom.index.move_up.onclick = function(evt){
			self.move_up();
			window.kbmodules.kickboxing_standard.update_pair_index();
			window.kbmodules.kickboxing_standard.save_pairs();
		}
		self.dom.index.move_down.onclick = function(evt){
			self.move_down();
			window.kbmodules.kickboxing_standard.update_pair_index();
			window.kbmodules.kickboxing_standard.save_pairs();
		}
		self.dom.index.flip_players.onclick = function(evt){
			self.flip_sides();
			window.kbmodules.kickboxing_standard.save_pairs();
		}

		self.dom.index.header.onclick = function(evt){
			if (window.kbmodules.kickboxing_standard.edit_mode_active){return};
			self.mark_active();
			window.kbmodules.kickboxing_standard.update_vs_title(self);
		}


		{
			self.to_dict = function(){
				return self._to_dict(self);
			}
			self.move_up = function(){
				return self._move_up(self);
			}
			self.move_down = function(){
				return self._move_down(self);
			}
			self.flip_sides = function(){
				return self._flip_sides(self);
			}
			self.flip_colors = function(){
				return self._flip_colors(self);
			}
			self.mark_active = function(){
				return self._mark_active(self);
			}
		}

	}

	_to_dict(self){
		return {
			'red': self.players.red.to_dict(),
			'blu': self.players.blu.to_dict(),
		}
	}

	// important todo: account for active pairs
	_move_up(self){
		const prev_sibling = self.dom.elem.previousSibling;
		if (!prev_sibling || ['#text', 'sysbtn'].includes(prev_sibling.nodeName.lower())){return};
		// todo: this assumes that the parent element is the list itself
		self.dom.elem.parentElement.insertBefore(self.dom.elem, prev_sibling);
	}

	_move_down(self){
		const next_sibling = self.dom.elem?.nextSibling?.nextSibling;
		if (!next_sibling || next_sibling.nodeName.lower() == '#text'){
			self.dom.elem.parentElement.append(self.dom.elem);
		};
		// todo: this assumes that the parent element is the list itself
		self.dom.elem.parentElement.insertBefore(self.dom.elem, next_sibling);
	}

	// important todo: account for active players
	_flip_sides(self){
		const blu = self.players.blu;
		const red = self.players.red;

		blu.dom.elem.swapWith(red.dom.elem);

		self.players.blu = red;
		self.players.red = blu;
	}

	_flip_colors(self){
		const blu = self.players.blu;
		const red = self.players.red;

		self.players.blu = red;
		self.players.red = blu;
	}

	_mark_active(self){
		ksys.context.module.prm('active_pair', self.index);
		$('#player_list .player_pair').removeClass('active_pair');
		self.dom.elem.classList.add('active_pair');
	}
}


window.kbmodules.kickboxing_standard.msg_warn_need_alt = function(){
	ksys.info_msg.send_msg(
		'Hold ALT',
		'warn',
		3000
	);
}






window.kbmodules.kickboxing_standard.toggle_edit_mode = function(){
	const dom = document.querySelector('kbstandard');
	if (dom.hasAttribute('edit_mode')){
		dom.removeAttribute('edit_mode');
		window.kbmodules.kickboxing_standard.edit_mode_active = false;
	}else{
		dom.setAttribute('edit_mode', true);
		window.kbmodules.kickboxing_standard.edit_mode_active = true;
	}
}


window.kbmodules.kickboxing_standard.flip_sides = function(){
	for (const pair of window.kbmodules.kickboxing_standard.pair_list.values()){
		pair.flip_sides();
	}
}

window.kbmodules.kickboxing_standard.flip_colors = function(){
	print('Kys pls?')
	for (const pair of window.kbmodules.kickboxing_standard.pair_list.values()){
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


window.kbmodules.kickboxing_standard.update_pair_index = function(){
	let pair_index = 0;
	for (const dom of document.querySelectorAll('#player_list > .player_pair')){
		const pair = window.kbmodules.kickboxing_standard.pair_list.get(dom);
		pair_index += 1;
		pair.index = pair_index;
		pair.dom.index.pair_num.textContent = pair_index;
	}
}


window.kbmodules.kickboxing_standard.set_color_order = function(order){
	if (order == 'red_vs_blu'){
		$('#player_list').removeClass('blu_vs_red');
		$('#player_list').addClass('red_vs_blu');
	}else{
		$('#player_list').removeClass('red_vs_blu');
		$('#player_list').addClass('blu_vs_red');
	}
}


window.kbmodules.kickboxing_standard.save_schema = function(event){
	ksys.db.module.write(
		'player_data_schema.kbdata',
		JSON.stringify(Array.from(window.kbmodules.kickboxing_standard.player_data_schema))
	)

	window.kbmodules.kickboxing_standard.fwd_update_schema();

	ksys.info_msg.send_msg(`Save OK`, 'ok', 500);
}

window.kbmodules.kickboxing_standard.load_schema = function(){
	$('#schema_cfg_list').empty();
	let schema_data = ksys.db.module.read('player_data_schema.kbdata');

	if (!schema_data){
		print('No schema save present. Not loading');
		return
	}

	schema_data = JSON.parse(schema_data);

	for (const schema_entry of schema_data){
		window.kbmodules.kickboxing_standard.add_schema_entry(schema_entry)
	}
}


window.kbmodules.kickboxing_standard.add_schema_entry = function(data){
	print('Kys pls', data)

	// todo: this || might backfire horrendously
	const schema_data = data || ['', '', '', false];

	const schema_dom = ksys.tplates.index_tplate(
		'#schema_list_entry_template',
		{
			'field_label':  '.field_label',
			'suffix':       '.suffix',
			'is_image':     '.is_image',
			'idname':       '.idname',

			// 'save':         '.save_schema',
		}
	);

	schema_dom.index.field_label.value = schema_data[0];
	schema_dom.index.suffix.value =      schema_data[1];
	schema_dom.index.idname.value =      schema_data[2];
	schema_dom.index.is_image.checked =  schema_data[3];

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

	schema_dom.elem.oncontextmenu = function(evt){
		if (!evt.altKey){
			window.kbmodules.kickboxing_standard.msg_warn_need_alt();
			return
		}

		window.kbmodules.kickboxing_standard.player_data_schema.delete(schema_data);
		schema_dom.elem.remove();
	}

	window.kbmodules.kickboxing_standard.player_data_schema.add(schema_data);

	$('#schema_cfg_list').append(schema_dom.elem);
}


window.kbmodules.kickboxing_standard.fwd_update_schema = function(){
	for (const pair of window.kbmodules.kickboxing_standard.pair_list.values()){
		// todo: move this to player pair class
		pair.players.blu.update_schema();
		pair.players.red.update_schema();
	}
}


window.kbmodules.kickboxing_standard.save_pairs = function(){
	const save_data = {
		'color_order': window.kbmodules.kickboxing_standard.color_order,
		'pairs': [],
	};

	for (const dom of document.querySelectorAll('#player_list > .player_pair')){
		const pair_data = window.kbmodules.kickboxing_standard.pair_list.get(dom);
		save_data.pairs.push(
			pair_data.to_dict()
		)
	}

	ksys.db.module.write(
		'pairs.kbdata',
		JSON.stringify(save_data)
	)
}

window.kbmodules.kickboxing_standard.load_pairs = function(){
	let pair_list = ksys.db.module.read('pairs.kbdata');
	if (!pair_list){return};

	pair_list = JSON.parse(pair_list);

	window.kbmodules.kickboxing_standard.set_color_order(pair_list.color_order)

	for (const pair_data of pair_list.pairs){
		const pair = window.kbmodules.kickboxing_standard.add_pair();

		// todo: Add "apply" data to the pair class?
		print('Applying data', )
		pair.players.red.apply_data(pair_data.red);
		pair.players.blu.apply_data(pair_data.blu);
	}
	window.kbmodules.kickboxing_standard.update_pair_index();

	for (const pair of window.kbmodules.kickboxing_standard.pair_list.values()){
		if (pair.index == ksys.context.module.cache.active_pair){
			pair.mark_active();
			break
		}
	}
}


window.kbmodules.kickboxing_standard.add_pair = function(){
	const player = new window.kbmodules.kickboxing_standard.KBPlayerPair();
	$('#player_list').append(player.dom.elem);
	window.kbmodules.kickboxing_standard.update_pair_index();
	return player;
}



window.kbmodules.kickboxing_standard.save_res_path = function(){
	ksys.context.module.prm(
		'resource_path',
		document.querySelector('#param_list input[res_path]').value
	)
}



window.kbmodules.kickboxing_standard.update_vs_title = async function(tgt_pair){
	if (window.kbmodules.kickboxing_standard.edit_mode_active){return};

	const frmt = ksys.strf.params.players;

	let label_idx = 0;
	for (const schema_data of window.kbmodules.kickboxing_standard.player_data_schema){
		// Set label
		label_idx += 1;
		const [label, suffix, data_id, is_image] = schema_data;
		await window.kbmodules.kickboxing_standard.titles.vs.set_text(
			`ifb_title_lb_${label_idx}`,
			label,
		)

		// Set data
		for (const side of [['l', 'red'], ['r', 'blu']]){
			const [side_vmix, side_kb] = side;

			// Set name/surname
			await window.kbmodules.kickboxing_standard.titles.vs.set_text(
				`pname_text_${side_vmix}`,
				frmt.format(
					`${tgt_pair.players[side_kb].name} ${tgt_pair.players[side_kb].surname}`
				),
			)

			// Set other data
			await window.kbmodules.kickboxing_standard.titles.vs.set_text(
				`ifb_text_${side_vmix}_${label_idx}`,
				frmt.format(tgt_pair.players[side_kb].attr_list[data_id].value.trim()) + suffix
			)
		}
	}

	// Set vs image
	window.kbmodules.kickboxing_standard.titles.vs.set_img_src(
		'Image1',
		str((Path(ksys.context.module.cache.resource_path))
		.join('pair_pool', `${tgt_pair.index}.png`))
		.replaceAll('/', '\\')
	)
}

window.kbmodules.kickboxing_standard.update_personal_title = async function(tgt_player){
	if (window.kbmodules.kickboxing_standard.edit_mode_active){return};

	ksys.context.module.prm(
		'active_player',
		tgt_player.side(),
	)

	const frmt = ksys.strf.params.players;
	const title = window.kbmodules.kickboxing_standard.titles.personal;

	// Set name/surname
	await title.set_text(
		'name',
		frmt.format(tgt_player.name)
	);
	await title.set_text(
		'surname',
		frmt.format(tgt_player.surname)
	);

	// Set other data
	let label_idx = 0;
	for (const schema_data of window.kbmodules.kickboxing_standard.player_data_schema){
		label_idx += 1;
		const [label, suffix, data_id, is_image] = schema_data;

		await title.set_text(`attr_${label_idx}_label`, label)
		await title.set_text(
			`attr_${label_idx}_val`,
			tgt_player.attr_list[data_id].value.trim() + suffix,
		)
	}

}



window.kbmodules.kickboxing_standard.vs_onn = async function(){
	window.kbmodules.kickboxing_standard.titles.vs.overlay_in(1);
}

window.kbmodules.kickboxing_standard.vs_off = async function(){
	window.kbmodules.kickboxing_standard.titles.vs.overlay_out(1);
}



window.kbmodules.kickboxing_standard.player_onn = async function(){
	window.kbmodules.kickboxing_standard.titles.personal.overlay_in(1);
}

window.kbmodules.kickboxing_standard.player_off = async function(){
	window.kbmodules.kickboxing_standard.titles.personal.overlay_out(1);
}












window.kbmodules.kickboxing_standard.set_round = async function(r, resetround=false){
	// store current round number
	ksys.context.module.prm('current_round', r);

	await window.kbmodules.kickboxing_standard.titles.timer.set_text('round', `ROUND ${str(r).trim()}`);

	// reset round if asked
	if (resetround == true){
		window.kbmodules.kickboxing_standard.respawn_timer(false, false);
	}
}


window.kbmodules.kickboxing_standard.timer_callback = async function(ticks){
	const minutes = Math.floor(ticks.global / 60);
	const seconds = ticks.global - (60*minutes);

	if (ticks.global <= 9){
		await window.kbmodules.kickboxing_standard.timer_hide(true);
		window.kbmodules.kickboxing_standard.counter.force_kill();
	}

	await window.kbmodules.kickboxing_standard.titles.timer.set_text(
		'clock',
		`${minutes}:${str(seconds).zfill(2)}`,
	)
}

window.kbmodules.kickboxing_standard.respawn_manager = function(act){
	// onn = the big button onn
	// if there's no timer OR the prev one is dead - create one and start and then show
	// if there's timer and it's alive - unpase and show
	if (!window.kbmodules.kickboxing_standard.counter.alive){
		window.kbmodules.kickboxing_standard.respawn_timer(true, true)
	}else{
		if (window.kbmodules.kickboxing_standard.counter.alive == true){
			// clear pause
			// window.kbmodules.kickboxing_standard.timer_pause(false)
			window.kbmodules.kickboxing_standard.timer_show()
		} 
	}
}

window.kbmodules.kickboxing_standard.respawn_timer = async function(show=false, st=false){
	const ctx = ksys.context.module.cache;

	const round_dur = ctx.round_duration;

	// const minutes = Math.floor(
	// 	(ctx.round_duration / 1000) / 60
	// )
	// const seconds = (ctx.round_duration / 1000) - (60*minutes);

	window.kbmodules.kickboxing_standard.titles.timer.set_text(
		'clock',
		`${round_dur.minutes}:${str(round_dur.seconds).zfill(2)}`
	);

	// kill previous timer
	try{
		window.kbmodules.kickboxing_standard.counter.force_kill();
	}catch (error){
		print(error);
	}

	// spawn a timer
	window.kbmodules.kickboxing_standard.counter = ksys.ticker.spawn({
		'duration': (round_dur.minutes * 60) + round_dur.seconds,
		'name': 'giga_timer',
		'infinite': false,
		'reversed': true,
		'callback': window.kbmodules.kickboxing_standard.timer_callback,
		'wait': true
	})
	// init and show, if asked
	if (st == true){
		// init
		window.kbmodules.kickboxing_standard.counter.fire()
		.then(function(_ticker) {
			_ticker.force_kill()
		})
	}

	if (show == true){
		// await ksys.util.sleep(2000)
		await window.kbmodules.kickboxing_standard.timer_show()
	}
}

window.kbmodules.kickboxing_standard.timer_hide = async function(dopause=false){
	window.kbmodules.kickboxing_standard.timer_pause(dopause);
	await window.kbmodules.kickboxing_standard.titles.timer.overlay_out(1);
}

window.kbmodules.kickboxing_standard.timer_show = async function(unpause=true){
	window.kbmodules.kickboxing_standard.timer_pause(!unpause)
	await window.kbmodules.kickboxing_standard.titles.timer.set_text(
		'info_text',
		`${ksys.context.module.cache.active_round || 1} OF ${ksys.context.module.cache.round_amount}`
	)
	await window.kbmodules.kickboxing_standard.titles.timer.overlay_in(1)
}

window.kbmodules.kickboxing_standard.timer_pause = function(state=true){
	if (window.kbmodules.kickboxing_standard.counter){
		window.kbmodules.kickboxing_standard.counter.pause = state;
	}
}

window.kbmodules.kickboxing_standard.timer_set_time = function(){
	const round_dur_data = ksys.context.module.cache.round_duration;

	const offset_seconds = (
		(int(document.querySelector('#set_time_minutes').value) * 60) +
		int(document.querySelector('#set_time_seconds').value)
	)

	const round_dur = (round_dur_data.minutes * 60) + round_dur_data.seconds;

	if (window.kbmodules.kickboxing_standard.counter){
		try{
			window.kbmodules.kickboxing_standard.counter.force_kill()
		}catch (error){}

		// spawn a timer
		window.kbmodules.kickboxing_standard.counter = ksys.ticker.spawn({
			'duration': offset_seconds,
			// 'offset': tm,
			'name': 'giga_timer',
			'infinite': false,
			'reversed': true,
			'callback': window.kbmodules.kickboxing_standard.timer_callback,
			'wait': true
		})
		// init
		window.kbmodules.kickboxing_standard.counter.fire()
		.then(function(_ticker) {
			_ticker.force_kill()
		})
	}
}



window.kbmodules.kickboxing_standard.set_round_duration = function(){
	ksys.context.module.prm(
		'round_duration',
		{
			'minutes': int(document.querySelector('#round_duration_cfg_field [minutes]').value) || 1,
			'seconds': int(document.querySelector('#round_duration_cfg_field [seconds]').value) || 0,
		}
	)
}


window.kbmodules.kickboxing_standard.set_round_amount = function(){
	ksys.context.module.prm(
		'round_amount',
		int(document.querySelector('#round_amount_fields input[round_amount]').value) || 8
	)
	window.kbmodules.kickboxing_standard.redraw_round_switches();
}







window.kbmodules.kickboxing_standard.redraw_round_switches = function(){
	$('#round_selector').empty();

	for (const rnum of range(1, (ksys.context.module.cache.round_amount + 1) || 8)){
		const dom = ksys.tplates.index_tplate(
			'#round_selector_item_template',
			{}
		);

		dom.elem.textContent = rnum;

		dom.elem.onclick = function(){
			window.kbmodules.kickboxing_standard.set_round(rnum, true);
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





