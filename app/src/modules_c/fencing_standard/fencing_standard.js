
if(!window.kbmodules){window.kbmodules={}};
if(!window.kbmodules.fencing_standard){window.kbmodules.fencing_standard={}};



window.kbmodules.fencing_standard.load = async function(){
	window.kbmodules.fencing_standard.titles = {
		// Lower title with player stuff
		'fight_tracker': new vmix.title({
			'title_name': 'fight_tracker_team.gtzip',
			'default_overlay': 1,
			'timings': {
				'fps': 50,
				'frames_in': 200,
				'margin': 50,
			},
		}),
	}

	// Fresh module context cache
	const mctx = ksys.context.module;

	// Deathmatch server shit. No teams
	window.kbmodules.fencing_standard.chaotic_pairs = new Set();

	window.kbmodules.fencing_standard.edit_mode_active = false;

	window.kbmodules.fencing_standard.current_pair = null;

	// Load bootleg team index
	{
		window.kbmodules.fencing_standard.team_index = ksys.db.module.read('bootleg_team_index.kbsave', 'json') || {};
	}

	// Load pairs
	{
		// Chaotic deathmatch pair
		const dm_pairs = ksys.db.module.read('chaotic_pairs_data.kbsave', 'json') || {'pairs': []};
		for (const pair_data of dm_pairs.pairs){
			window.kbmodules.fencing_standard.create_chaotic_pair(pair_data)
		}

		// Set active pair, if any
		if (mctx.cache.active_pair >= 0){
			const tgt_pair = window.kbmodules.fencing_standard.chaotic_pairs.at(mctx.cache.active_pair);
			if (tgt_pair){
				window.kbmodules.fencing_standard.select_pair(tgt_pair);
			}
		}

		window.kbmodules.fencing_standard.push_scores_to_vmix();
	}
}

window.kbmodules.fencing_standard.ChaoticPlayerInstance = class {
	constructor(_input_data=null, change_callback=null){
		const self = this;
		const input_data = _input_data || {};

		this.data_inputs = {};

		this.score = input_data.score || 0;

		// Not really an index.
		// Tis function also instantiates the template in the proper way
		// this is why it's used here
		this.pdata_dom = ksys.tplates.index_tplate(
			'#pair_player_template',
			{}
		)

		// index the stuff and fill it, if possible
		for (const data_input of this.pdata_dom.elem.querySelectorAll('input[data_link]')){
			const link_id = data_input.getAttribute('data_link');

			this.data_inputs[link_id] = data_input;

			data_input.value = input_data[link_id] || '';

			data_input.onchange = function(){
				if (change_callback){
					change_callback(self, link_id)
				}
			}
		}
	}
}


window.kbmodules.fencing_standard.ChaoticPair = class {
	constructor(_input_data=null){
		const self = this;
		const input_data = _input_data || {};

		print('Pair input data raw:', _input_data)

		window.kbmodules.fencing_standard.chaotic_pairs.add(self);

		// Pair control root
		this.ctrl_base_dom = ksys.tplates.index_tplate(
			'#pair_template',
			{
				// Vis feed
				'pname_left':   '.vis_feed_pname_left',
				'pname_right':   '.vis_feed_pname_right',

				// Player pair
				'pair_players':  '.pair_entry_config',

				// Swap button
				'swap_btn':      '.vis_feed_vs_sign sysbtn',
			}
		);

		// Handle pair removal
		this.ctrl_base_dom.elem.oncontextmenu = function(evt){
			if (evt.altKey && window.kbmodules.fencing_standard.edit_mode_active){
				// self kill self
				// javascript moment...
				self.kill(self)
				return
			}

			window.kbmodules.fencing_standard.select_pair(self)
		}

		this.ctrl_base_dom.index.swap_btn.onclick = function(){
			self.swap(self);
			self.update_vis_feed(self);
			window.kbmodules.fencing_standard.select_pair(self);
			window.kbmodules.fencing_standard.save_player_base();
		}

		// Left and Right side
		this.players = {};

		// Create both players
		for (const side of ['left', 'mid', 'right',]){
			if (side == 'mid'){
				this.ctrl_base_dom.index.pair_players.append(
					$('<div class="editor_data_separator">VS</div>')[0]
				)
				continue
			}
			const player_instance = new window.kbmodules.fencing_standard.ChaoticPlayerInstance(
				input_data[side],
				function(){
					self.update_vis_feed(self);
					window.kbmodules.fencing_standard.save_player_base();
				}
			)

			this.players[side] = player_instance;

			// Append player DOM to the pair
			this.ctrl_base_dom.index.pair_players.append(
				player_instance.pdata_dom.elem
			)
		}

		this.update_vis_feed(self);

		// Append self to the pair list DOM
		$('#pair_pool_entries').append(this.ctrl_base_dom.elem);
	}

	// Completely remove the pair from everywhere
	kill(self){
		// todo: also delete controls from DOM

		// Remove self from the pair pool
		window.kbmodules.fencing_standard.chaotic_pairs.delete(self);
		// Remove the corresponding DOM
		self.ctrl_base_dom.elem.remove()
		// Trigger a save
		window.kbmodules.fencing_standard.save_player_base()
	}

	update_vis_feed(self){
		// todo: nice formatting
		// todo: also, this is retarded
		self.ctrl_base_dom.index.pname_left.textContent = (
			// `${self.players.left.data_inputs.player_name.value} ${self.players.left.data_inputs.player_surname.value}`
			`${self.players.left.data_inputs.player_surname.value}`
		)
		self.ctrl_base_dom.index.pname_right.textContent = (
			// `${self.players.right.data_inputs.player_name.value} ${self.players.right.data_inputs.player_surname.value}`
			`${self.players.right.data_inputs.player_surname.value}`
		)
	}

	swap(self){
		print('Swapping')
		const swap_entries = [
			'player_name',
			'player_surname',
			'team_alias',
		];

		const opposite = {
			'left': 'right',
			'right': 'left',
		};

		const save_data = {};

		for (const side of ['left', 'right']){
			save_data[side] = {};
			for (const data_entry of swap_entries){
				save_data[side][data_entry] = self.players[side].data_inputs[data_entry].value;
			}
		}
		print('Save data:', save_data)
		for (const side of ['left', 'right']){
			for (const data_entry of swap_entries){
				// print(opposite[side], )
				self.players[side].data_inputs[data_entry].value = save_data[opposite[side]][data_entry];
			}
		}
	}
}

window.kbmodules.fencing_standard.ChaoticPlayerFightControl = class{
	constructor(tgt_player){
		const self = this;

		const math_steps = [1, 2, 3];

		this.tgt_player = tgt_player;

		this.tplate = ksys.tplates.index_tplate(
			'#player_fight_ctrl_template',
			{
				'player_name':  '.fight_vis_feed_player_name',
				'player_score': '.fight_vis_feed_player_score',

				'manual_score_input': '.fight_score_manual_input input',

				'add_scores':       '.add_score',
				'subtract_scores':  '.subtract_score',

				'team_score_input': '.player_team_score_input',
			}
		)

		// Fill data
		// todo: nice formatting
		this.tplate.index.player_name.textContent = (
			`${tgt_player.data_inputs.player_name.value} ${tgt_player.data_inputs.player_surname.value}`
		)
		this.tplate.index.player_score.textContent = tgt_player.score;
		this.tplate.index.manual_score_input.value = tgt_player.score;

		// Add buttons
		// todo: duplicate code
		for (const mstep of math_steps){

			const btn_add = $(`<vmixbtn>+${mstep}</vmixbtn>`)[0];
			btn_add.onclick = function(){
				tgt_player.score += mstep;
				window.kbmodules.fencing_standard.team_index[tgt_player.data_inputs.team_alias.value.trim().lower()] += mstep;
				window.kbmodules.fencing_standard.team_index[tgt_player.data_inputs.team_alias.value.trim().lower()] = (
					Math.max(0, window.kbmodules.fencing_standard.team_index[tgt_player.data_inputs.team_alias.value.trim().lower()])
				)
				if (tgt_player.score < 0){
					tgt_player.score = 0
				}
				self.update_vis_feedback(self);
				window.kbmodules.fencing_standard.push_scores_to_vmix()
				window.kbmodules.fencing_standard.save_player_base();
			}
			this.tplate.index.add_scores.append(btn_add);


			const btn_subt = $(`<vmixbtn>-${mstep}</vmixbtn>`)[0];
			btn_subt.onclick = function(){
				tgt_player.score -= mstep;
				window.kbmodules.fencing_standard.team_index[tgt_player.data_inputs.team_alias.value.trim().lower()] -= mstep;
				window.kbmodules.fencing_standard.team_index[tgt_player.data_inputs.team_alias.value.trim().lower()] = (
					Math.max(0, window.kbmodules.fencing_standard.team_index[tgt_player.data_inputs.team_alias.value.trim().lower()])
				)
				if (tgt_player.score < 0){
					tgt_player.score = 0
				}
				self.update_vis_feedback(self);
				window.kbmodules.fencing_standard.push_scores_to_vmix();
				window.kbmodules.fencing_standard.save_player_base();
			}
			this.tplate.index.subtract_scores.append(btn_subt);

		}

		this.tplate.index.manual_score_input.onchange = function(){
			tgt_player.score = int(self.tplate.index.manual_score_input.value);
			self.update_vis_feedback(self);
			window.kbmodules.fencing_standard.push_scores_to_vmix();
			window.kbmodules.fencing_standard.save_player_base();
		}

		this.tplate.index.team_score_input.onchange = function(){
			window.kbmodules.fencing_standard.team_index[tgt_player.data_inputs.team_alias.value.trim().lower()] = int(self.tplate.index.team_score_input.value);
			self.update_vis_feedback(self);
			window.kbmodules.fencing_standard.push_scores_to_vmix();
			window.kbmodules.fencing_standard.save_player_base();
		}

		this.tplate.index.team_score_input.value = int(window.kbmodules.fencing_standard.team_index[tgt_player.data_inputs.team_alias.value.trim().lower()])

		ksys.btns.resync()
	}

	// Vis feedback basically means anything in the DOM
	update_vis_feedback(self){
		self.tplate.index.manual_score_input.value = self.tgt_player.score;
		self.tplate.index.player_score.textContent = self.tgt_player.score;
		self.tplate.index.team_score_input.value = window.kbmodules.fencing_standard.team_index[self.tgt_player.data_inputs.team_alias.value.trim().lower()];
	}
}


window.kbmodules.fencing_standard.create_chaotic_pair = function(pair_data=null){
	window.kbmodules.fencing_standard.chaotic_pairs.add(
		new window.kbmodules.fencing_standard.ChaoticPair(pair_data)
	)
}

window.kbmodules.fencing_standard.rebuild_team_index = function(){
	for (const pair of window.kbmodules.fencing_standard.chaotic_pairs){

		let team_id = pair.players.left.data_inputs.team_alias.value.trim().lower();
		if (!window.kbmodules.fencing_standard.team_index[team_id]){
			window.kbmodules.fencing_standard.team_index[team_id] = 0;
		}

		team_id = pair.players.right.data_inputs.team_alias.value.trim().lower();
		if (!window.kbmodules.fencing_standard.team_index[team_id]){
			window.kbmodules.fencing_standard.team_index[team_id] = 0;
		}
	}
}

window.kbmodules.fencing_standard.save_player_base = function(){
	print('Saving player base');
	const data = {
		// todo: active pair. Somehow ????
		// 'active_pair': window.kbmodules.fencing_standard.chaotic_pairs.indexof(window.kbmodules.fencing_standard.active_pair),
		'pairs': [],
	}

	for (const pair of window.kbmodules.fencing_standard.chaotic_pairs){
		data.pairs.push({
			'left': {
				'player_name': pair.players.left.data_inputs.player_name.value,
				'player_surname': pair.players.left.data_inputs.player_surname.value,
				'team_alias': pair.players.left.data_inputs.team_alias.value,
				'score': pair.players.left.score,
			},
			'right': {
				'player_name': pair.players.right.data_inputs.player_name.value,
				'player_surname': pair.players.right.data_inputs.player_surname.value,
				'team_alias': pair.players.right.data_inputs.team_alias.value,
				'score': pair.players.right.score,
			}
		})
	}

	ksys.db.module.write(
		'chaotic_pairs_data.kbsave',
		JSON.stringify(data, null, '\t')
	)

	// Rebuild team index
	window.kbmodules.fencing_standard.rebuild_team_index()
	ksys.db.module.write(
		'bootleg_team_index.kbsave',
		JSON.stringify(window.kbmodules.fencing_standard.team_index, null, '\t')
	)
}

window.kbmodules.fencing_standard.toggle_edit_mode = function(){
	window.kbmodules.fencing_standard.edit_mode_active = !window.kbmodules.fencing_standard.edit_mode_active;
	$('[tabid="ctrl_base"]').attr('edit_mode', window.kbmodules.fencing_standard.edit_mode_active);

}

window.kbmodules.fencing_standard.push_scores_to_vmix = async function(){
	print('Pushing scores to vmix');
	window.kbmodules.fencing_standard.titles.fight_tracker.set_text(
		'fight_score_l',
		window.kbmodules.fencing_standard.current_pair.players.left.score
	)
	window.kbmodules.fencing_standard.titles.fight_tracker.set_text(
		'fight_score_r',
		window.kbmodules.fencing_standard.current_pair.players.right.score
	)

	window.kbmodules.fencing_standard.titles.fight_tracker.set_text(
		'team_score_l',
		window.kbmodules.fencing_standard.team_index[window.kbmodules.fencing_standard.current_pair.players.left.data_inputs.team_alias.value.lower().trim()]
		
	)
	window.kbmodules.fencing_standard.titles.fight_tracker.set_text(
		'team_score_r',
		window.kbmodules.fencing_standard.team_index[window.kbmodules.fencing_standard.current_pair.players.right.data_inputs.team_alias.value.lower().trim()]
	)
}

window.kbmodules.fencing_standard.push_current_players_to_vmix = async function(){
	print('Pushing players to vmix');
	window.kbmodules.fencing_standard.titles.fight_tracker.set_text(
		'player_name_l',
		(
			ksys.strf.params.player_names.format(window.kbmodules.fencing_standard.current_pair.players.left.data_inputs.player_name.value)
			+
			' '
			+
			ksys.strf.params.player_names.format(window.kbmodules.fencing_standard.current_pair.players.left.data_inputs.player_surname.value)
		)
	)
	window.kbmodules.fencing_standard.titles.fight_tracker.set_text(
		'player_name_r',
		(
			ksys.strf.params.player_names.format(window.kbmodules.fencing_standard.current_pair.players.right.data_inputs.player_name.value)
			+
			' '
			+
			ksys.strf.params.player_names.format(window.kbmodules.fencing_standard.current_pair.players.right.data_inputs.player_surname.value)
		)
	)
}

window.kbmodules.fencing_standard.push_team_names_to_vmix = function(){
	window.kbmodules.fencing_standard.titles.fight_tracker.set_text(
		'team_name_l',
		ksys.strf.params.team_alias.format(
			window.kbmodules.fencing_standard.current_pair.players.left.data_inputs.team_alias.value
		)
	)
	window.kbmodules.fencing_standard.titles.fight_tracker.set_text(
		'team_name_r',
		ksys.strf.params.team_alias.format(
			window.kbmodules.fencing_standard.current_pair.players.right.data_inputs.team_alias.value
		)
	)
}

// Activate controls for the target pair
window.kbmodules.fencing_standard.select_pair = function(tgt_pair=null, upd_vmix=true){
	window.kbmodules.fencing_standard.current_pair = tgt_pair;

	// Push data to vmix
	if (upd_vmix){
		window.kbmodules.fencing_standard.push_current_players_to_vmix();
		window.kbmodules.fencing_standard.push_scores_to_vmix();
		window.kbmodules.fencing_standard.push_team_names_to_vmix();
	}

	// Save current pair index to context
	ksys.context.module.prm('active_pair', window.kbmodules.fencing_standard.chaotic_pairs.indexof(window.kbmodules.fencing_standard.current_pair))

	// Create control classes
	const player_left = new window.kbmodules.fencing_standard.ChaoticPlayerFightControl(tgt_pair.players.left);
	const player_right = new window.kbmodules.fencing_standard.ChaoticPlayerFightControl(tgt_pair.players.right);

	// Clear the space
	$('#player_ctrl_left, #player_ctrl_right').empty();

	// Append panels to the DOM
	$('#player_ctrl_left').append(player_left.tplate.elem);
	$('#player_ctrl_right').append(player_right.tplate.elem);

	// Mark pair as active
	$('#pair_pool_entries .pair_entry').removeClass('active_pair');
	tgt_pair.ctrl_base_dom.elem.classList.add('active_pair');
}


window.kbmodules.fencing_standard.fight_tracker_vis_ctrl = function(state){
	if (state == true){
		window.kbmodules.fencing_standard.titles.fight_tracker.overlay_in(1);
	}
	if (state == false){
		window.kbmodules.fencing_standard.titles.fight_tracker.overlay_out(1);
	}
}












