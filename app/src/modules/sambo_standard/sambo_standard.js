

$this.counter = {};

$this.load = function(){
	$this.main_clock_id = 'sambo.main';
	$this.clock_feed = qsel('#timer_feedback');
	$this.player_data_schema = new Set();
	$this.pair_list = new Map();

	$this.edit_mode_active = false;

	$this.load_schema();

	// $this.add_pair();
	$this.load_pairs();

	$this.color_order = ksys.context.module.cache.color_order;

	// important todo: wtf does colour flip even do ????
	$this.set_color_order($this.color_order);

	$this.redraw_round_switches();

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

	$this.titles = {
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

	// document.querySelector('#image_proxies').checked = !!ksys.context.module.cache.img_proxies_enabled;
	// document.querySelector('#image_proxies_addr').value = ksys.context.module.cache.img_proxy_addr;
	// document.querySelector('#img_proxy_whitelist').value = ksys.db.module.read('proxy_whitelist.kbdata') || '';

	// $this.toggle_image_proxies();

	ksys.ticker.bundestag.attach({
		'clock_id': $this.main_clock_id,
		'tick': $this.clock_tick_event,
		'end': $this.clock_end_event,
	})
}

$this.KBPlayer = class{
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
				$this.save_pairs();
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
				self.score_ctrl.dom.index.surname.textContent = self.surname.upper();
				$this.save_pairs();
			}
			dom.root.setAttribute('preview_hidden', true);
			self.dom.index.player_data.append(dom.elem);
			self.attr_list['surname'] = dom.index.input;
		}


		self.update_schema(self);

		self.dom.elem.onclick = function(){
			if ($this.edit_mode_active){return};
			self.mark_active();
			$this.update_personal_title(self);
		}

		self.score_ctrl = new $this.PlayerScoreControl({
			'tgt_player': self,
		});


		ksys.util.cls_pwnage.remap(self);
	}

	to_dict(self){
		const data = {
			'name': self.name,
			'surname': self.surname,
			'vs_photo_side': self.vs_photo_side,
			'score': self.score_ctrl.score,
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

		for (const schema_data of $this.player_data_schema){
			const [label, suffix, data_id] = schema_data;
			if (!self.attr_list[data_id]){continue};

			self.attr_list[data_id].value = data[data_id] || '';
		}

		self.score_ctrl.score = data.score;
	}

	update_schema(self){
		// Add data entries according to schema
		for (const schema_data of $this.player_data_schema){
			const [label, suffix, data_id, is_image, is_shared] = schema_data;

			const attr_dom = ksys.tplates.index_tplate(
				'#kb_player_data_entry_template',
				{
					'label':  '.data_entry_label',
					'input':  '.data_entry_input',
				}
			);

			if (data_id in self.attr_list){continue};

			attr_dom.index.label.textContent = ksys.util.str_ops.format(label, 1);
			self.dom.index.player_data.append(attr_dom.elem);

			self.attr_list[data_id] = attr_dom.index.input;

			attr_dom.index.input.onchange = function(){
				$this.save_pairs();
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


$this.KBPlayerPair = class{
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
			}
		);

		self.index = null;

		$this.pair_list.set(self.dom.elem, self);

		self.players = {
			'red': new $this.KBPlayer(self),
			'blu': new $this.KBPlayer(self),
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
				$this.msg_warn_need_alt();
				return
			}

			$this.pair_list.delete(self.dom.elem);
			self.dom.elem.remove();
			$this.update_pair_index();
			$this.save_pairs();

			self.players.red.score_ctrl.dom.root.remove();
			self.players.blu.score_ctrl.dom.root.remove();
		}

		self.dom.index.move_up.onclick = function(evt){
			self.move_up();
			$this.update_pair_index();
			$this.save_pairs();
		}
		self.dom.index.move_down.onclick = function(evt){
			self.move_down();
			$this.update_pair_index();
			$this.save_pairs();
		}
		self.dom.index.flip_players.onclick = function(evt){
			self.flip_sides();
			$this.save_pairs();
		}
		self.dom.index.flip_photos.onclick = function(evt){
			self.flip_photos();
			$this.save_pairs();
		}

		self.dom.index.header.onclick = function(evt){
			if ($this.edit_mode_active){return};
			self.mark_active();
			$this.update_vs_title(self);
			$this.update_score(self);
		}

	}

	to_dict(self){
		return {
			'red': self.players.red.to_dict(),
			'blu': self.players.blu.to_dict(),
			'index': self.index,
		}
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
		blu.score_ctrl.dom.root.swapWith(red.score_ctrl.dom.root);

		self.players.blu = red;
		self.players.red = blu;
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

		const score_ctrl = document.querySelector('#score_ctrl');
		score_ctrl.innerHTML = '';

		score_ctrl.append(self.players.blu.score_ctrl.dom.root);
		score_ctrl.append(self.players.red.score_ctrl.dom.root);
	}
}


$this.PlayerScoreControl = class{
	constructor(params){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#66CEFF',
		);

		self.tgt_player = params.tgt_player;
		self._score = params.score || 0;

		self._dom = null;
	}

	$score(self){
		return (self._score || 0)
	}

	$$score(self, tgt_score){
		self._score = int(tgt_score) || 0;
		self._score = self._score.clamp(0, Infinity);
		self.dom.index.input.value = self._score;
	}

	$dom(self){
		if (self._dom){
			return self._dom
		}

		self._dom = ksys.context.tplates.sambo.player_score_ctrl({
			'input':    'input.score_input',
			'surname':  '.pscore_psurname',
		})

		for (const btn_add of self._dom.root.querySelectorAll('.pscore_btn')){
			btn_add.onclick = function(){
				self.score += int(btn_add.getAttribute('score_amount'));
				$this.save_pairs();
				$this.update_score(self.tgt_player.pair);
			}
		}

		self._dom.index.input.onchange = function(){
			self.score = int(self._dom.index.input.value) || 0;
			$this.save_pairs();
			$this.update_score(self.tgt_player.pair);
		}

		self._dom.index.surname.textContent = self.tgt_player.surname.upper();

		return self._dom
	}
}





$this.msg_warn_need_alt = function(){
	ksys.info_msg.send_msg(
		'Hold ALT',
		'warn',
		3000
	);
}






$this.toggle_edit_mode = function(){
	const dom = document.querySelector('kbstandard');
	dom.removeAttribute('data_preview_mode');
	if (dom.hasAttribute('edit_mode')){
		dom.removeAttribute('edit_mode');
		$this.edit_mode_active = false;
	}else{
		dom.setAttribute('edit_mode', true);
		$this.edit_mode_active = true;
	}
}

$this.toggle_preview_mode = function(){
	const dom = document.querySelector('kbstandard');
	dom.removeAttribute('edit_mode');
	$this.edit_mode_active = false;

	if (dom.hasAttribute('data_preview_mode')){
		dom.removeAttribute('data_preview_mode');
	}else{
		dom.setAttribute('data_preview_mode', true);
	}
}




$this.flip_sides = function(){
	for (const pair of $this.pair_list.values()){
		pair.flip_sides();
	}
	$this.save_pairs();
}

$this.flip_photos = function(){
	for (const pair of $this.pair_list.values()){
		pair.flip_photos();
	}
	$this.save_pairs();
}

$this.flip_colors = function(){
	for (const pair of $this.pair_list.values()){
		pair.flip_colors();
	}

	if (document.querySelector('#player_list').classList.contains('red_vs_blu')){
		$('#player_list').removeClass('red_vs_blu');
		$('#player_list').addClass('blu_vs_red');

		$('#score_ctrl').removeClass('red_vs_blu');
		$('#score_ctrl').addClass('blu_vs_red');

		ksys.context.module.prm('color_order', 'blu_vs_red');
		return
	}

	if (document.querySelector('#player_list').classList.contains('blu_vs_red')){
		$('#player_list').removeClass('blu_vs_red');
		$('#player_list').addClass('red_vs_blu');

		$('#score_ctrl').removeClass('blu_vs_red');
		$('#score_ctrl').addClass('red_vs_blu');

		ksys.context.module.prm('color_order', 'red_vs_blu');
		return
	}
}


$this.update_pair_index = function(){
	if (ksys.context.module.cache.pair_ids_frozen){return};

	let pair_index = 0;
	for (const dom of document.querySelectorAll('#player_list > .player_pair')){
		const pair = $this.pair_list.get(dom);
		pair_index += 1;
		pair.index = pair_index;
		pair.dom.index.pair_num.textContent = pair_index;
	}
}


$this.set_color_order = function(order){
	if (order == 'red_vs_blu'){
		$('#player_list').removeClass('blu_vs_red');
		$('#player_list').addClass('red_vs_blu');

		$('#score_ctrl').removeClass('blu_vs_red');
		$('#score_ctrl').addClass('red_vs_blu');
	}else{
		$('#player_list').removeClass('red_vs_blu');
		$('#player_list').addClass('blu_vs_red');

		$('#score_ctrl').removeClass('red_vs_blu');
		$('#score_ctrl').addClass('blu_vs_red');
	}
}


$this.save_schema = function(event){
	ksys.db.module.write(
		'player_data_schema.kbdata',
		JSON.stringify(
			Array.from($this.player_data_schema)
		)
	)

	$this.fwd_update_schema();

	ksys.info_msg.send_msg(`Save OK`, 'ok', 500);
}

$this.load_schema = function(){
	$('#schema_cfg_list').empty();
	let schema_data = ksys.db.module.read('player_data_schema.kbdata');

	if (!schema_data){
		print('No schema save present. Not loading');
		return
	}

	schema_data = JSON.parse(schema_data);

	for (const schema_entry of schema_data){
		$this.add_schema_entry(schema_entry)
	}
}


$this.add_schema_entry = function(data){
	print('Kys pls', data)

	// todo: this || might backfire horrendously
	const schema_data = data || ['', '', '', false, false];

	const schema_dom = ksys.tplates.index_tplate(
		'#schema_list_entry_template',
		{
			'field_label':  '.field_label',
			'suffix':       '.suffix',
			'is_image':     '.is_image',
			'is_shared':    '.is_shared',
			'idname':       '.idname',

			// 'save':         '.save_schema',
		}
	);

	schema_dom.index.field_label.value = schema_data[0];
	schema_dom.index.suffix.value =      schema_data[1];
	schema_dom.index.idname.value =      schema_data[2];
	schema_dom.index.is_image.checked =  schema_data[3];
	schema_dom.index.is_shared.checked = schema_data[4];

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

	schema_dom.elem.oncontextmenu = function(evt){
		if (!evt.altKey){
			$this.msg_warn_need_alt();
			return
		}

		$this.player_data_schema.delete(schema_data);
		schema_dom.elem.remove();
	}

	$this.player_data_schema.add(schema_data);

	$('#schema_cfg_list').append(schema_dom.elem);
}


$this.fwd_update_schema = function(){
	for (const pair of $this.pair_list.values()){
		// todo: move this to player pair class
		pair.players.blu.update_schema();
		pair.players.red.update_schema();
	}
}


$this.save_pairs = function(){
	const save_data = {
		'color_order': $this.color_order,
		'pairs': [],
	};

	for (const dom of document.querySelectorAll('#player_list > .player_pair')){
		const pair_data = $this.pair_list.get(dom);
		save_data.pairs.push(
			pair_data.to_dict()
		)
	}

	ksys.db.module.write(
		'pairs.kbdata',
		JSON.stringify(save_data)
	)
}

$this.load_pairs = function(){
	let pair_list = ksys.db.module.read('pairs.kbdata');
	if (!pair_list){return};

	pair_list = JSON.parse(pair_list);

	$this.set_color_order(pair_list.color_order)

	for (const pair_data of pair_list.pairs){
		const pair = $this.add_pair(true);

		// todo: Add "apply" data to the pair class?
		print('Applying data', )
		pair.players.red.apply_data(pair_data.red);
		pair.players.blu.apply_data(pair_data.blu);
		pair.index = pair_data.index;
		pair.dom.index.pair_num.textContent = pair_data.index;
	}
	$this.update_pair_index();

	for (const pair of $this.pair_list.values()){
		if (pair.index == ksys.context.module.cache.active_pair){
			pair.mark_active();
			break
		}
	}
}


$this.add_pair = function(force_add=false){
	if (ksys.context.module.cache.pair_ids_frozen && !force_add){
		ksys.info_msg.send_msg(
			'Cannot add pair: Photo indexes are bound. Unbind them first',
			'warn',
			6000
		);
		return
	}
	const player = new $this.KBPlayerPair();
	$('#player_list').append(player.dom.elem);
	$this.update_pair_index();
	return player;
}



$this.save_res_path = function(){
	ksys.context.module.prm(
		'resource_path',
		document.querySelector('#param_list input[res_path]').value
	)
}



$this.update_vs_title = async function(tgt_pair){
	if ($this.edit_mode_active){return};

	const frmt = ksys.strf.params.players;

	let label_idx = 0;
	for (const schema_data of $this.player_data_schema){
		// Set label
		label_idx += 1;
		const [label, suffix, data_id, is_image, is_shared] = schema_data;

		// todo: YET ANOTHER BOOTLEG HACK...
		if (is_shared){
			await $this.titles.vs.set_text(
				`shared_attr_val`,
				`${label} ${tgt_pair.players['red'].attr_list[data_id].value.trim()} ${suffix}`.trim(),
			)
			// label_idx -= 1;
			continue
		}
		print('LABEL INDEX:', label_idx, schema_data)
		await $this.titles.vs.set_text(
			`ifb_title_lb_${label_idx}`,
			label,
		)

		// Set data
		for (const side of [['l', 'red'], ['r', 'blu']]){
			const [side_vmix, side_kb] = side;

			if (is_image && data_id == 'flag'){
				const tgt_player = tgt_pair.players[side_kb];

				// TODO: BAD TEMP HACK
				await $this.titles.vs.set_img_src(
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
			await $this.titles.vs.set_text(
				`pname_text_${side_vmix}`,
				frmt.format(
					`${tgt_pair.players[side_kb].name} ${tgt_pair.players[side_kb].surname}`
				),
			)

			// todo: this is a temp solution
			if (ksys.context.module.cache.timer_has_vs){
				await $this.titles.timer.set_text(
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
				await $this.titles.vs.set_text(
					`ifb_text_${side_vmix}_${label_idx}`,
					(field_val + ' ' + suffix).trim()
				)
			}else{
				await $this.titles.vs.set_text(
					`ifb_text_${side_vmix}_${label_idx}`,
					''
				)
			}
		}
	}

	// Set vs image
	// $this.titles.vs.set_img_src(
	// 	'Image1',
	// 	str((Path(ksys.context.module.cache.resource_path))
	// 	.join('pair_pool', `${tgt_pair.index}.png`))
	// 	.replaceAll('/', '\\')
	// )

	for (const side of [['l', 'red'], ['r', 'blu']]){
		const [side_vmix, side_kb] = side;
		const tgt_player = tgt_pair.players[side_kb];

		await $this.titles.vs.set_img_src(
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
				await $this.titles.vs.set_img_src(
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

$this.update_personal_title = async function(tgt_player){
	if ($this.edit_mode_active){return};

	ksys.context.module.prm(
		'active_player',
		tgt_player.side(),
	)

	const frmt = ksys.strf.params.players;
	const title = $this.titles.personal;

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
	for (const schema_data of $this.player_data_schema){
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


$this.update_score = async function(tgt_pair){
	await $this.titles.timer.set_text(
		'score_l',
		tgt_pair.players.red.score_ctrl.score
	)
	await $this.titles.timer.set_text(
		'score_r',
		tgt_pair.players.blu.score_ctrl.score
	)
}




$this.vs_onn = async function(){
	if (ksys.context.module.cache.vs_as_movs){
		await vmix.talker.talk({
			'Function': 'OverlayInput1In',
			'Input': `kbvs_${ksys.context.module.cache.active_pair}.mov`,
		})
		return
	}
	$this.titles.vs.overlay_in(1);
}

$this.vs_off = async function(){
	if (ksys.context.module.cache.vs_as_movs){
		await vmix.talker.talk({
			'Function': 'OverlayInput1Out',
			'Input': `kbvs_${ksys.context.module.cache.active_pair}.mov`,
		})
		return
	}
	$this.titles.vs.overlay_out(1);
}



$this.player_onn = async function(){
	$this.titles.personal.overlay_in(1);
}

$this.player_off = async function(){
	$this.titles.personal.overlay_out(1);
}









// ==============================
//            Timer
// ==============================

$this.clock_pause = async function(){
	await ksys.ticker.bundestag.edit_clock({
		'clock_id': $this.main_clock_id,
		'action': 'pause',
		'data': {}
	})
}

$this.clock_resume = async function(){
	await ksys.ticker.bundestag.edit_clock({
		'clock_id': $this.main_clock_id,
		'action': 'resume',
		'data': {}
	})
}

$this.clock_stop = async function(){
	await ksys.ticker.bundestag.edit_clock({
		'clock_id': $this.main_clock_id,
		'action': 'stop',
		'data': {}
	})
}

$this.clock_reset = async function(){
	await $this.clock_stop();

	const dur = ksys.context.module.cache.round_duration;
	await $this.titles.timer.set_text(
		'clock',
		`${str(dur.minutes).zfill(2)}:${str(dur.seconds).zfill(2)}`
	);

	$('#timer_feedback').text(
		`${str(dur.minutes).zfill(2)}:${str(dur.seconds).zfill(2)}`
	);
}

$this.clock_hide = async function(pause=false){
	if (pause){
		await $this.clock_pause();
	}
	await $this.titles.timer.overlay_out(1);
}

$this.clock_show = async function(resume=true){
	await $this.titles.timer.set_text(
		'info_text',
		`${ksys.context.module.cache.active_round || 1} OF ${ksys.context.module.cache.round_amount}`
	)

	const clock_state = await ksys.ticker.bundestag.read_clock($this.main_clock_id);
	if (!clock_state || clock_state?.stopped){
		$this.clock_fire();
	}
	if (clock_state || clock_state.paused){
		await $this.clock_resume();
	}

	await $this.titles.timer.overlay_in(1);
}

$this.clock_tick_event = async function(data){
	const time = data.time;

	$this.clock_feed.textContent = (
		str(time.clock.minutes).padStart(2, '0') + ':' +
		str(time.clock.seconds).padStart(2, '0')
	);

	// if (time.total.seconds <= 9){
	if (time.tick <= 9){
		await $this.clock_hide();
		await ksys.util.sleep(1500);
		// await $this.clock_stop();
		$this.clock_reset();
	}
}

$this.clock_end_event = async function(){
	$this.clock_reset();
}

$this.set_clock_duration = function(){
	ksys.context.module.prm(
		'round_duration',
		{
			'minutes': int(document.querySelector('#round_duration_cfg_field [minutes]').value) || 1,
			'seconds': int(document.querySelector('#round_duration_cfg_field [seconds]').value) || 0,
		}
	)
}

$this.set_round_amount = function(){
	ksys.context.module.prm(
		'round_amount',
		int(document.querySelector('#round_amount_fields input[round_amount]').value) || 8
	)
	$this.redraw_round_switches();
}

$this.set_round = async function(r, reset=false){
	// store current round number
	ksys.context.module.prm('current_round', r);

	await $this.titles.timer.set_text('round', `ROUND ${str(r).trim()}`);

	if (reset == true){
		await $this.clock_reset();
	}
}

$this.clock_fire = async function(offset=null){
	const dur = ksys.context.module.cache.round_duration;

	await ksys.ticker.bundestag.edit_clock({
		'clock_id': $this.main_clock_id,
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
					'pad': 2,
				}],
			}
		}
	})
}

$this.clock_fire_offset = async function(){
	const dur = ksys.context.module.cache.round_duration;
	const dur_s = (dur.minutes * 60) + dur.seconds;
	const offs_s = (
		(int(document.querySelector('#set_time_minutes').value || 0) * 60) +
		 int(document.querySelector('#set_time_seconds').value || 0)
	)

	await $this.clock_fire(
		dur_s - offs_s
	)
}







/*
$this.timer_callback = async function(ticks){
	const minutes = Math.floor(ticks.global / 60);
	const seconds = ticks.global - (60*minutes);

	if (ticks.global <= 9){
		await $this.timer_hide(true);
		$this.counter.force_kill();
	}

	const timer_text = `${minutes}:${str(seconds).zfill(2)}`;

	await $this.titles.timer.set_text(
		'clock',
		timer_text,
	)

	$('#timer_feedback').text(timer_text);
}

$this.respawn_manager = function(act){
	// onn = the big button onn
	// if there's no timer OR the prev one is dead - create one and start and then show
	// if there's timer and it's alive - unpase and show
	if (!$this.counter.alive){
		$this.respawn_timer(true, true)
	}else{
		if ($this.counter.alive == true){
			// clear pause
			// $this.timer_pause(false)
			$this.timer_show()
		} 
	}
}

$this.respawn_timer = async function(show=false, st=false){
	const ctx = ksys.context.module.cache;

	const round_dur = ctx.round_duration;

	// const minutes = Math.floor(
	// 	(ctx.round_duration / 1000) / 60
	// )
	// const seconds = (ctx.round_duration / 1000) - (60*minutes);

	$this.titles.timer.set_text(
		'clock',
		`${round_dur.minutes}:${str(round_dur.seconds).zfill(2)}`
	);
	$('#timer_feedback').text(
		`${round_dur.minutes}:${str(round_dur.seconds).zfill(2)}`
	);

	// kill previous timer
	try{
		$this.counter.force_kill();
	}catch (error){
		print(error);
	}

	// spawn a timer
	$this.counter = ksys.ticker.spawn({
		'duration': (round_dur.minutes * 60) + round_dur.seconds,
		'name': 'giga_timer',
		'infinite': false,
		'reversed': true,
		'callback': $this.timer_callback,
		'wait': true
	})
	// init and show, if asked
	if (st == true){
		// init
		$this.counter.fire()
		.then(function(_ticker) {
			_ticker.force_kill()
		})
	}

	if (show == true){
		// await ksys.util.sleep(2000)
		await $this.timer_show()
	}
}

$this.timer_pause = function(state=true){
	if ($this.counter){
		$this.counter.pause = state;
	}
}

$this.timer_set_time = function(){
	const round_dur_data = ksys.context.module.cache.round_duration;

	const offset_seconds = (
		(int(document.querySelector('#set_time_minutes').value) * 60) +
		int(document.querySelector('#set_time_seconds').value)
	)

	const round_dur = (round_dur_data.minutes * 60) + round_dur_data.seconds;

	if ($this.counter){
		try{
			$this.counter.force_kill()
		}catch (error){}

		// spawn a timer
		$this.counter = ksys.ticker.spawn({
			'duration': offset_seconds,
			// 'offset': tm,
			'name': 'giga_timer',
			'infinite': false,
			'reversed': true,
			'callback': $this.timer_callback,
			'wait': true
		})
		// init
		$this.counter.fire()
		.then(function(_ticker) {
			_ticker.force_kill()
		})
	}
}
*/











$this.redraw_round_switches = function(){
	$('#round_selector').empty();

	for (const rnum of range(1, (ksys.context.module.cache.round_amount + 1) || 8)){
		const dom = ksys.tplates.index_tplate(
			'#round_selector_item_template',
			{}
		);

		dom.elem.textContent = rnum;

		dom.elem.onclick = function(){
			$this.set_round(rnum, true);
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








$this.bind_photo_ids = function(){
	ksys.context.module.prm('pair_ids_frozen', true);
}

$this.unbind_photo_ids = function(){
	ksys.context.module.prm('pair_ids_frozen', false);
}









/*
$this.update_img_proxy_addr = function(){
	const addr = document.querySelector('#image_proxies_addr').value;

	ksys.context.module.prm(
		'img_proxy_addr',
		addr
	)

	if (vmix.util.global_params.proxy){
		vmix.util.global_params.proxy.own_addr = addr;
	}
}

$this.update_img_proxy_whitelist = function(){
	const whitelist = document.querySelector('#img_proxy_whitelist').value;

	ksys.db.module.write(
		'proxy_whitelist.kbdata',
		whitelist
	)

	if (vmix.util.global_params.proxy){
		vmix.util.global_params.proxy.whitelist = whitelist.split('\n');
	}
}


$this.toggle_image_proxies = function(){
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





