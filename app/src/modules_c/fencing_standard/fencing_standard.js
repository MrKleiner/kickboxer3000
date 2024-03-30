
if(!kbmodules){kbmodules={}};

if(!kbmodules.fencing_standard){kbmodules.fencing_standard={}};



kbmodules.fencing_standard.load = async function(){
	kbmodules.fencing_standard.titles = {
		// Lower title with player stuff
		'fight_tracker': new vmix.title({
			'title_name': 'fight_tracker.gtzip',
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
	kbmodules.fencing_standard.chaotic_pairs = new Set();

	kbmodules.fencing_standard.edit_mode_active = false;

	kbmodules.fencing_standard.current_pair = null;

	// Load pairs
	{
		// Chaotic deathmatch pair
		const dm_pairs = ksys.db.module.read('chaotic_pairs_data.kbsave', 'json') || {'pairs': []};
		for (const pair_data of dm_pairs.pairs){
			kbmodules.fencing_standard.create_chaotic_pair(pair_data)
		}

		// Set active pair, if any
		if (mctx.cache.active_pair >= 0){
			const tgt_pair = kbmodules.fencing_standard.chaotic_pairs.at(mctx.cache.active_pair);
			if (tgt_pair){
				kbmodules.fencing_standard.select_pair(tgt_pair);
			}
		}

		kbmodules.fencing_standard.push_scores_to_vmix();
	}
}

kbmodules.fencing_standard.ChaoticPlayerInstance = class {
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


kbmodules.fencing_standard.ChaoticPair = class {
	constructor(_input_data=null){
		const self = this;
		const input_data = _input_data || {};

		print('Pair input data raw:', _input_data)

		kbmodules.fencing_standard.chaotic_pairs.add(self);

		// Pair control root
		this.ctrl_base_dom = ksys.tplates.index_tplate(
			'#pair_template',
			{
				// Vis feed
				'pname_left':   '.vis_feed_pname_left',
				'pname_right':   '.vis_feed_pname_right',

				// Player pair
				'pair_players':  '.pair_entry_config',
			}
		);

		// Handle pair removal
		this.ctrl_base_dom.elem.oncontextmenu = function(evt){
			if (evt.altKey && kbmodules.fencing_standard.edit_mode_active){
				// self kill self
				// javascript moment...
				self.kill(self)
				return
			}

			kbmodules.fencing_standard.select_pair(self)
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
			const player_instance = new kbmodules.fencing_standard.ChaoticPlayerInstance(
				input_data[side],
				function(){
					self.update_vis_feed(self);
					kbmodules.fencing_standard.save_player_base();
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
		kbmodules.fencing_standard.chaotic_pairs.delete(self);
		// Remove the corresponding DOM
		self.ctrl_base_dom.elem.remove()
		// Trigger a save
		kbmodules.fencing_standard.save_player_base()
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
}

kbmodules.fencing_standard.ChaoticPlayerFightControl = class{
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

				'add_scores':     '.add_score',
				'subtract_scores': '.subtract_score',
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
				if (tgt_player.score < 0){
					tgt_player.score = 0
				}
				self.update_vis_feedback(self);
				kbmodules.fencing_standard.push_scores_to_vmix()
				kbmodules.fencing_standard.save_player_base();
			}
			this.tplate.index.add_scores.append(btn_add);


			const btn_subt = $(`<vmixbtn>-${mstep}</vmixbtn>`)[0];
			btn_subt.onclick = function(){
				tgt_player.score -= mstep;
				if (tgt_player.score < 0){
					tgt_player.score = 0
				}
				self.update_vis_feedback(self);
				kbmodules.fencing_standard.push_scores_to_vmix()
				kbmodules.fencing_standard.save_player_base();
			}
			this.tplate.index.subtract_scores.append(btn_subt);

		}

		this.tplate.index.manual_score_input.onchange = function(){
			tgt_player.score = int(self.tplate.index.manual_score_input.value);
			self.update_vis_feedback(self);
			kbmodules.fencing_standard.push_scores_to_vmix();
		}

		ksys.btns.resync()
	}

	// Vis feedback basically means anything in the DOM
	update_vis_feedback(self){
		self.tplate.index.manual_score_input.value = self.tgt_player.score;
		self.tplate.index.player_score.textContent = self.tgt_player.score;
	}


}


kbmodules.fencing_standard.create_chaotic_pair = function(pair_data=null){
	kbmodules.fencing_standard.chaotic_pairs.add(
		new kbmodules.fencing_standard.ChaoticPair(pair_data)
	)
}

kbmodules.fencing_standard.save_player_base = function(){
	print('Saving player base');
	const data = {
		// todo: active pair. Somehow ????
		// 'active_pair': kbmodules.fencing_standard.chaotic_pairs.indexof(kbmodules.fencing_standard.active_pair),
		'pairs': [],
	}

	for (const pair of kbmodules.fencing_standard.chaotic_pairs){
		data.pairs.push({
			'left': {
				'player_name': pair.players.left.data_inputs.player_name.value,
				'player_surname': pair.players.left.data_inputs.player_surname.value,
				'score': pair.players.left.score,
			},
			'right': {
				'player_name': pair.players.right.data_inputs.player_name.value,
				'player_surname': pair.players.right.data_inputs.player_surname.value,
				'score': pair.players.right.score,
			}
		})
	}

	ksys.db.module.write(
		'chaotic_pairs_data.kbsave',
		JSON.stringify(data, null, '\t')
	)
}

kbmodules.fencing_standard.toggle_edit_mode = function(){
	kbmodules.fencing_standard.edit_mode_active = !kbmodules.fencing_standard.edit_mode_active;
	$('[tabid="ctrl_base"]').attr('edit_mode', kbmodules.fencing_standard.edit_mode_active);

}

kbmodules.fencing_standard.push_scores_to_vmix = async function(){
	print('Pushing scores to vmix');
	kbmodules.fencing_standard.titles.fight_tracker.set_text(
		'fight_score_l',
		kbmodules.fencing_standard.current_pair.players.left.score
	)
	kbmodules.fencing_standard.titles.fight_tracker.set_text(
		'fight_score_r',
		kbmodules.fencing_standard.current_pair.players.right.score
	)
}

kbmodules.fencing_standard.push_current_players_to_vmix = async function(){
	print('Pushing players to vmix');
	kbmodules.fencing_standard.titles.fight_tracker.set_text(
		'player_name_l',
		(
			ksys.strf.params.player_names.format(kbmodules.fencing_standard.current_pair.players.left.data_inputs.player_name.value)
			+
			' '
			+
			ksys.strf.params.player_names.format(kbmodules.fencing_standard.current_pair.players.left.data_inputs.player_surname.value)
		)
	)
	kbmodules.fencing_standard.titles.fight_tracker.set_text(
		'player_name_r',
		(
			ksys.strf.params.player_names.format(kbmodules.fencing_standard.current_pair.players.right.data_inputs.player_name.value)
			+
			' '
			+
			ksys.strf.params.player_names.format(kbmodules.fencing_standard.current_pair.players.right.data_inputs.player_surname.value)
		)
	)
}

// Activate controls for the target pair
kbmodules.fencing_standard.select_pair = function(tgt_pair=null, upd_vmix=true){
	kbmodules.fencing_standard.current_pair = tgt_pair;

	// Push data to vmix
	if (upd_vmix){
		kbmodules.fencing_standard.push_current_players_to_vmix();
	}

	// Save current pair index to context
	ksys.context.module.prm('active_pair', kbmodules.fencing_standard.chaotic_pairs.indexof(kbmodules.fencing_standard.current_pair))

	// Create control classes
	const player_left = new kbmodules.fencing_standard.ChaoticPlayerFightControl(tgt_pair.players.left);
	const player_right = new kbmodules.fencing_standard.ChaoticPlayerFightControl(tgt_pair.players.right);

	// Clear the space
	$('#player_ctrl_left, #player_ctrl_right').empty();

	// Append panels to the DOM
	$('#player_ctrl_left').append(player_left.tplate.elem);
	$('#player_ctrl_right').append(player_right.tplate.elem);

	// Mark pair as active
	$('#pair_pool_entries .pair_entry').removeClass('active_pair');
	tgt_pair.ctrl_base_dom.elem.classList.add('active_pair');
}


kbmodules.fencing_standard.fight_tracker_vis_ctrl = function(state){
	if (state == true){
		kbmodules.fencing_standard.titles.fight_tracker.overlay_in(1);
	}
	if (state == false){
		kbmodules.fencing_standard.titles.fight_tracker.overlay_out(1);
	}
}












