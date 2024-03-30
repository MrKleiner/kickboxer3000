
if(!kbmodules){kbmodules={}};

if(!kbmodules.sambo_standard){kbmodules.sambo_standard={}};





kbmodules.sambo_standard.edit_mode_active = false;
kbmodules.sambo_standard.counter = {};

kbmodules.sambo_standard.load = function()
{
	// spawn rounds
	print('kickboxing init')
	// const roundspool = document.querySelector('rounds pool');
	const fresh_context = ksys.context.module.pull();

	// for (let rnd of range(int(document.querySelector('rounds').getAttribute('amount')))){
	// 	roundspool.append($(`<round round_index=${rnd+1} onclick="kbmodules.sambo_standard.set_round(${rnd+1}, true)">${rnd+1}</round>`)[0])
	// }

	// load pairs
	kbmodules.sambo_standard.load_paris()
	// this just has to be here... Dont fucking question it you mongrel
	kbmodules.sambo_standard.toggle_edit(false)

	// context.module.pull()

	// context stuff
	$('input[round_duration]').val(fresh_context.round_duration_exp)
	$('input[res_path]').val(fresh_context.resource_path)

	// round
	$(`round[round_index="${fresh_context.current_round}"]`).css('color', 'lime')

	// pair
	$(`#pairs_pool pairnum[pair_index="${fresh_context.active_pair_index}"]`).css('color', 'lime')

	if (fresh_context.current_player){
		$('player.active_player').removeClass('active_player');
		const selected_player = fresh_context.current_player.split('-');
		$(`pairnum[pair_index="${selected_player[0]}"]`).closest('pair').find(`player[${selected_player[1]}]`).addClass('active_player')
	}

	kbmodules.sambo_standard.titles = {
		'personal': new vmix.title({
			'title_name': 'lower_title.gtzip',
		}),

		'vs': new vmix.title({
			'title_name': 'vs_main.gtzip',
		}),

		'main_title': new vmix.title({
			'title_name': 'main_title.gtzip',
		}),
	}

	kbmodules.sambo_standard.label_index = [
		{
			'label':    'RECORD',
			'param_sel': 'p_param[p_record] input',
		},
	]

	kbmodules.sambo_standard.personal_label_index = [
		{
			'label':    'RECORD',
			'param_sel': 'p_param[p_record] input',
			// 'suffix': 'cm',
		},
		// {
		// 	'label':    'WEIGHT',
		// 	'param_sel': 'p_param[p_weight] input',
		// 	'suffix': 'kg',
		// },
	]

}




kbmodules.sambo_standard.add_pair = function()
{
	// oncontextmenu="kbmodules.sambo_standard.del_pair(this)"
	// onclick="kbmodules.sambo_standard.upd_vs_title(this.getAttribute("pair_index"))"
	const pair = ksys.tplates.index_tplate(
		'#pair_asset',
		{
			'root':    'pair',
			'pairnum': 'pairnum',
		}
	)
	pair.index.root.oncontextmenu = function(_self){
		kbmodules.sambo_standard.del_pair(_self.target.closest('pair'))
	}
	pair.index.pairnum.onclick = function(_self){
		kbmodules.sambo_standard.upd_vs_title(_self.target.getAttribute('pair_index'))
	}

	document.querySelector('#pairs_pool').append(pair.elem)


	// enumarate pairs
	kbmodules.sambo_standard.enumerate_pairs()
}

kbmodules.sambo_standard.enumerate_pairs = function()
{
	const p_pool = [...document.querySelectorAll('#pairs_pool pairnum')]
	for (let enm in p_pool){
		// print('fuckoff', p_pool[enm])
		p_pool[enm].textContent = str(int(enm) + 1);
		p_pool[enm].setAttribute('pair_index', str(int(enm) + 1));
	}
}


kbmodules.sambo_standard.del_pair = function(pr)
{
	if (pr && (kbmodules.sambo_standard.edit_mode_active == true)){
		pr.remove()
		kbmodules.sambo_standard.enumerate_pairs()
	}
}



kbmodules.sambo_standard.toggle_edit = function(state=null)
{
	// Sometimes I stagger even myself with my genius
	if (state == false || state == true){
		kbmodules.sambo_standard.edit_mode_active = !state
	}


	if (kbmodules.sambo_standard.edit_mode_active == false){
		kbmodules.sambo_standard.edit_mode_active = true;

		kbmodules.sambo_standard.enumerate_pairs()

		// unlimit height
		// $('kbstandard #pairs_pool').css('height', 'auto')

		// hide display
		$('kbstandard #pairs_pool display').css('display', 'none');


		// beauty clicks
		$('kbstandard #pairs_pool player').attr('noclick', true);

		// unhide editors
		$('#pairs_pool > sysbtn, players player p_param').css('display', '')
		return
	}

	if (kbmodules.sambo_standard.edit_mode_active == true){
		kbmodules.sambo_standard.edit_mode_active = false;

		// unhide display
		$('kbstandard #pairs_pool display').css('display', '');


		// evalueate displays
		for (var evl of document.querySelectorAll('#pairs_pool players player')){
			evl.querySelector('display').textContent = evl.querySelector('p_param[p_name] input').value
		}

		kbmodules.sambo_standard.enumerate_pairs()

		// limit height
		// $('kbstandard #pairs_pool').css('height', '600px');

		// block beauty clicks
		$('kbstandard #pairs_pool player').removeAttr('noclick');

		// hide editors
		$('#pairs_pool > sysbtn:not(sysbtn[btname="toggle_edit_mode"]), players player p_param').css('display', 'none')
		return
	}
}


kbmodules.sambo_standard.save_pairs = function(tofile=false)
{
	var collected = []
	for (let pair of document.querySelectorAll('#pairs_pool pair')){
		collected.push({
			'left':{
				'name':    pair.querySelector('player[left] p_param[p_name] input').value,
				'age':     pair.querySelector('player[left] p_param[p_age] input').value,
				'height':  pair.querySelector('player[left] p_param[p_height] input').value,
				'weight':  pair.querySelector('player[left] p_param[p_weight] input').value,
				'country': pair.querySelector('player[left] p_param[p_country] input').value,
				'record':  pair.querySelector('player[left] p_param[p_record] input').value,
			},
			'right':{
				'name':    pair.querySelector('player[right] p_param[p_name] input').value,
				'age':     pair.querySelector('player[right] p_param[p_age] input').value,
				'height':  pair.querySelector('player[right] p_param[p_height] input').value,
				'weight':  pair.querySelector('player[right] p_param[p_weight] input').value,
				'country': pair.querySelector('player[right] p_param[p_country] input').value,
				'record':  pair.querySelector('player[right] p_param[p_record] input').value,
			}
		})
	}

	if (tofile == true){
		return JSON.stringify(collected, null, 4)
	}else{
		ksys.db.module.write('pairs_dict.pootis', JSON.stringify(collected, null, 4))
	}
	
}


// overwrite takes a JOn object/json containing pairs
kbmodules.sambo_standard.load_paris = function(overwrite=null)
{
	// wipe existing
	$('#pairs_pool pair').remove();

	// load saved, if any
	var pairs_dict = ksys.db.module.read('pairs_dict.pootis') || overwrite;
	// only if they exist in the first palce...
	if (!pairs_dict){return}

	// make JSON out of it
	pairs_dict = JSON.parse(pairs_dict)

	// spawn pairs one by one
	for (let pair of pairs_dict){
		document.querySelector('#pairs_pool').append(lizard.ehtml(`
			<pair oncontextmenu="kbmodules.sambo_standard.del_pair(this)">
				<pairnum click_contrast onclick="kbmodules.sambo_standard.upd_vs_title(this.getAttribute('pair_index'))"></pairnum>
				<players>
					<player right click_contrast noclick onclick="kbmodules.sambo_standard.upd_personal_title(this)">
						<display></display>
						<p_param p_name>
							<descr>Name</descr>
							<input type="text" placeholder="Player Name" value="${pair.right.name}">
						</p_param>
						<p_param p_age>
							<descr>Age</descr>
							<input type="text" placeholder="Player Age" value="${pair.right.age}">
						</p_param>
						<p_param p_weight>
							<descr>Weight</descr>
							<input type="text" placeholder="Player Weight" value="${pair.right.weight}">
						</p_param>
						<p_param p_height>
							<descr>Height</descr>
							<input type="text" placeholder="Player Height" value="${pair.right.height}">
						</p_param>
						<p_param p_record>
							<descr>Record</descr>
							<input type="text" placeholder="Player Record" value="${pair.right.record}">
						</p_param>
						<p_param p_country>
							<descr>Country</descr>
							<input type="text" placeholder="Player's Country of Origin" value="${pair.right.country}">
						</p_param>
					</player>
					<player left click_contrast noclick onclick="kbmodules.sambo_standard.upd_personal_title(this)">
						<display></display>
						<p_param p_name>
							<descr>Name</descr>
							<input type="text" placeholder="Player Name" value="${pair.left.name}">
						</p_param>
						<p_param p_age>
							<descr>Age</descr>
							<input type="text" placeholder="Player Age" value="${pair.left.age}">
						</p_param>
						<p_param p_weight>
							<descr>Weight</descr>
							<input type="text" placeholder="Player Weight" value="${pair.left.weight}">
						</p_param>
						<p_param p_height>
							<descr>Height</descr>
							<input type="text" placeholder="Player Height" value="${pair.left.height}">
						</p_param>
						<p_param p_record>
							<descr>Record</descr>
							<input type="text" placeholder="Player Record" value="${pair.left.record}">
						</p_param>
						<p_param p_country>
							<descr>Country</descr>
							<input type="text" placeholder="Player's Country of Origin" value="${pair.left.country}">
						</p_param>
					</player>
				</players>
			</pair>
		`))
	}

	// and enumerate pair indexes
	kbmodules.sambo_standard.enumerate_pairs()
}





kbmodules.sambo_standard.save_res_path = function()
{
	ksys.context.module.prm('resource_path', document.querySelector('input[res_path]').value)
}


kbmodules.sambo_standard.save_timer_duration = function()
{
	ksys.context.module.prm('round_duration', eval(document.querySelector('input[round_duration]').value) * 1000, false);
	ksys.context.module.prm('round_duration_exp', document.querySelector('input[round_duration]').value)
}




















// process VS screen
// todo: this could be done easier by splitting the save function into ripper and saver itself...
kbmodules.sambo_standard.upd_vs_title = async function(p_index=null)
{
	// if (!pindex){return}
	// do NOT do this in edit mode!
	if (kbmodules.sambo_standard.edit_mode_active == true){return}

	$('#pairs_pool pairnum').css('color', '');
	$(`#pairs_pool pairnum[pair_index="${p_index}"]`).css('color', 'lime')


	// save selected pair index
	ksys.context.module.prm('active_pair_index', p_index)

	// return

	// select the corresponding pair in the gui
	var pair_elem = $(`#pairs_pool pairnum[pair_index="${p_index}"]`).closest('pair');
	print('PAIR ITEM', pair_elem)
	// correspondance dictionary
	var c_dict = {
		// Left
		'name_l': {
			'gui': 'player[left] p_param[p_name] input',
			'vmix': 'name_L.Text'
		},
		'age_l': {
			'gui': 'player[left] p_param[p_age] input',
			'vmix': 'age_L.Text'
		},
		'height_l': {
			'gui': 'player[left] p_param[p_height] input',
			'vmix': 'height_L.Text'
		},
		'weight_l': {
			'gui': 'player[left] p_param[p_weight] input',
			'vmix': 'weight_L.Text'
		},
		'country_l': {
			'gui': 'player[left] p_param[p_country] input',
			'vmix': 'flag_L.Source'
		},
		'record_l': {
			'gui': 'player[left] p_param[p_record] input',
			'vmix': 'height_L.Text'
		},


		// Right
		'name_r': {
			'gui': 'player[right] p_param[p_name] input',
			'vmix': 'name_R.Text'
		},
		'age_r': {
			'gui': 'player[right] p_param[p_age] input',
			'vmix': 'age_R.Text'
		},
		'height_r': {
			'gui': 'player[right] p_param[p_height] input',
			'vmix': 'height_R.Text'
		},
		'weight_r': {
			'gui': 'player[right] p_param[p_weight] input',
			'vmix': 'weight_R.Text'
		},
		'country_r': {
			'gui': 'player[right] p_param[p_country] input',
			'vmix': 'flag_R.Source'
		},
		'record_r': {
			'gui': 'player[right] p_param[p_record] input',
			'vmix': 'height_R.Text'
		}

	}
	const frmt = ksys.strf.params.players

	// set boxes
	for (const _box_idx in kbmodules.sambo_standard.label_index){
		const prm_info = kbmodules.sambo_standard.label_index[_box_idx];
		
		const box_idx = int(_box_idx) + 1

		// Set label
		await kbmodules.sambo_standard.titles.vs.set_text(
			`ifb_title_lb_${box_idx}`,
			prm_info.label,
		)

		for (const side of [['r', 'left'], ['l', 'right']]){
			await kbmodules.sambo_standard.titles.vs.set_text(
				`ifb_text_${side[0]}_${box_idx}`,
				frmt.format(
					$(pair_elem).find(`player[${side[1]}] ${prm_info.param_sel}`).val().trim()
				)  + ' ' + (prm_info.suffix || ' '),
			)
		}
	}

	let p_name = new Set($(pair_elem).find(`player[left] p_param[p_name] input`).val().trim().split(' '))
	let psurname = frmt.format(p_name.at(-1));
	p_name.del_idx(-1)
	let pname = frmt.format(p_name.join(' '));

	// set names
	await kbmodules.sambo_standard.titles.main_title.set_text(
		`red_name`,
		frmt.format(
			psurname
		),
	)

	p_name = new Set($(pair_elem).find(`player[right] p_param[p_name] input`).val().trim().split(' '))
	psurname = frmt.format(p_name.at(-1));
	p_name.del_idx(-1)
	pname = frmt.format(p_name.join(' '));

	await kbmodules.sambo_standard.titles.main_title.set_text(
		`blue_name`,
		frmt.format(
			psurname
		),
	)

}



kbmodules.sambo_standard.upd_personal_title = async function(player)
{
	if (kbmodules.sambo_standard.edit_mode_active == true){return};

	const player_elem = $(player).closest('player');

	$('player.active_player').removeClass('active_player');
	player_elem.addClass('active_player');

	ksys.context.module.prm(
		'current_player',
		`${player_elem.closest('pair').find('pairnum').attr('pair_index')}-${(player_elem.attr('left') == '') ? 'left' : 'right'}`,
	)

	// $('#category_change input').val($(player).find('p_param[p_weight] input').val().trim())

	const player_info = ksys.tplates.index_elem(
		player_elem,
		{
			'name':    'p_param[p_name] input',
			'age':     'p_param[p_age] input',
			'height':  'p_param[p_height] input',
			'weight':  'p_param[p_weight] input',
			'country': 'p_param[p_country] input',
			'record':  'p_param[p_record] input',
		}
	).index

	const title = kbmodules.sambo_standard.titles.personal

	const p_name = new Set(player_info.name.value.trim().split(' '))
	const frmt = ksys.strf.params.players;

	const psurname = frmt.format(p_name.at(-1));
	p_name.del_idx(-1)
	// const pname = frmt.format(
	// 	Array.from(p_name).join(' ')
	// );
	const pname = frmt.format(p_name.join(' '));


	await title.set_text('name',    pname)
	await title.set_text('surname', psurname)
	await title.set_text('category', player_info.weight.value.trim())
}





kbmodules.sambo_standard.set_round = function(r, resetround=false)
{
	// store current round number
	ksys.context.module.prm('current_round', r)

	$('round').css('color', '')
	$(`round[round_index="${r}"]`).css('color', 'lime')

	vmix.talker.talk({
		'Function': 'SetText',
		'Value': `ROUND ${str(r).trim()}`,
		'Input': 'timer.gtzip',
		'SelectedName': 'round.Text'
	})

	// reset round if asked
	if (resetround == true){
		kbmodules.sambo_standard.respawn_timer(false, false)
	}
	
}






kbmodules.sambo_standard.timer_callback = async function(ticks)
{

	const minutes = Math.floor(ticks.global / 60)
	const seconds = ticks.global - (60*minutes)
	// print('minutes:', minutes, 'seconds', seconds)
	// print('global:', ticks.global)

	if (ticks.global <= -5){
		await kbmodules.sambo_standard.timer_hide(true)
		kbmodules.sambo_standard.counter.force_kill()
	}

	// update
	await vmix.talker.talk({
		'Function': 'SetText',
		'Value': `${minutes}:${str(seconds).zfill(2)}`,
		'Input': 'main_title.gtzip',
		'SelectedName': 'timer.Text'
	})
}

kbmodules.sambo_standard.respawn_manager = function(act)
{

	// onn = the big button onn
	// if there's no timer OR the prev one is dead - create one and start and then show
	// if there's timer and it's alive - unpase and show
	if (!kbmodules.sambo_standard.counter.alive){
		kbmodules.sambo_standard.respawn_timer(true, true)
	}else{
		if (kbmodules.sambo_standard.counter.alive == true){
			// clear pause
			// kbmodules.sambo_standard.timer_pause(false)
			kbmodules.sambo_standard.timer_show()
		} 
	}
}

kbmodules.sambo_standard.respawn_timer = async function(show=false, st=false)
{
	var minutes = Math.floor((ksys.context.module.pull().round_duration / 1000) / 60)
	var seconds = (ksys.context.module.pull().round_duration / 1000) - (60*minutes)

	// clear previous timer
	await vmix.talker.talk({
		'Function': 'SetText',
		'Value': `${minutes}:${str(seconds).zfill(2)}`,
		'Input': 'timer.gtzip',
		'SelectedName': 'timer_time.Text'
	})

	// kill previous timer
	try{
		kbmodules.sambo_standard.counter.force_kill()
	}catch (error){
		console.log(error)
	}

	// spawn a timer
	kbmodules.sambo_standard.counter = ksys.ticker.spawn({
		'duration': ksys.context.module.pull().round_duration / 1000,
		'name': 'giga_timer',
		'infinite': false,
		'reversed': true,
		'callback': kbmodules.sambo_standard.timer_callback,
		'wait': true
	})
	// init and show, if asked
	if (st == true){
		// init
		kbmodules.sambo_standard.counter.fire()
		.then(function(_ticker) {
			_ticker.force_kill()
		})
	}

	if (show == true){
		// await ksys.util.sleep(2000)
		await kbmodules.sambo_standard.timer_show()
	}
}


kbmodules.sambo_standard.timer_hide = async function(dopause=false)
{
	kbmodules.sambo_standard.timer_pause(dopause)
	// off
	// await vmix.talker.talk({
	// 	'Function': 'OverlayInput1Out',
	// 	'Input': 'timer.gtzip',
	// })
}

kbmodules.sambo_standard.timer_show = async function(unpause=true)
{
	kbmodules.sambo_standard.timer_pause(!unpause)
	// off
	await vmix.talker.talk({
		'Function': 'OverlayInput1In',
		'Input': 'timer.gtzip',
	})
}


kbmodules.sambo_standard.timer_pause = function(state=true)
{
	if (kbmodules.sambo_standard.counter){
		// do pause
		kbmodules.sambo_standard.counter.pause = state;
	}
}



kbmodules.sambo_standard.timer_set_time = function(tm=null)
{
	if (kbmodules.sambo_standard.counter && tm){
		// set time
		// kbmodules.sambo_standard.counter.set_global_tick(tm, true)

		// kill previous timer
		try{
			kbmodules.sambo_standard.counter.force_kill()
		}catch (error){}

		const total_dur = (ksys.context.module.pull().round_duration / 1000)

		// spawn a timer
		kbmodules.sambo_standard.counter = ksys.ticker.spawn({
			'duration': total_dur - (total_dur - tm),
			// 'offset': tm,
			'name': 'giga_timer',
			'infinite': false,
			'reversed': true,
			'callback': kbmodules.sambo_standard.timer_callback,
			'wait': true
		})
		// init
		kbmodules.sambo_standard.counter.fire()
		.then(function(_ticker) {
			_ticker.force_kill()
		})

	}
}







kbmodules.sambo_standard.vs_onn = function()
{
	vmix.talker.talk({
		'Function': 'OverlayInput1In',
		'Input': 'main_title.gtzip',
	})
}

kbmodules.sambo_standard.vs_off = function()
{
	vmix.talker.talk({
		'Function': 'OverlayInput1Out',
		'Input': 'main_title.gtzip',
	})
}








kbmodules.sambo_standard.player_onn = function()
{
	kbmodules.sambo_standard.titles.personal.overlay_in(1)
}

kbmodules.sambo_standard.player_off = function()
{
	kbmodules.sambo_standard.titles.personal.overlay_out(1)
}



kbmodules.sambo_standard.load_pairs_from_file = async function()
{
	const file = await ksys.util.ask_file();

	try{
		kbmodules.sambo_standard.load_paris(
			JSON.parse(
				fs.readFileSync(
					file.path,
					{encoding:'utf8', flag:'r'}
				)
			)
		)
	}catch (error){
		console.error(error)
		print('Failed to load pairs from file. Most probable problem: invalid file.')
	}
}



kbmodules.sambo_standard.save_pairs_to_file = function()
{
	lizard.textdl('boxing_pairs.preset', kbmodules.sambo_standard.save_pairs(true))
}



kbmodules.sambo_standard.set_category = async function()
{
	const v = $('#category_change input').val().trim();
	if (!v){return};

	await vmix.talker.talk({
		'Function': 'SetText',
		'Value': v + ' КГ',
		'Input': 'category.gtzip',
		'SelectedName': 'txt.Text'
	})
}




kbmodules.sambo_standard.forward_scores = async function(from_input=false)
{
	const ctx = ksys.context.module.pull();

	if (!from_input){
		await kbmodules.sambo_standard.titles.main_title.set_text('red_score', ctx?.red_score || 0);
		await kbmodules.sambo_standard.titles.main_title.set_text('blue_score', ctx?.blue_score || 0);
	}else{
		await kbmodules.sambo_standard.titles.main_title.set_text(
			'red_score',
			$(`#score_ctrl_red input`).val() || 0
		);
		await kbmodules.sambo_standard.titles.main_title.set_text(
			'blue_score',
			$(`#score_ctrl_blue input`).val() || 0
		);
	}
}



kbmodules.sambo_standard.score_add = function(side)
{
	const tgt_input = $(`#score_ctrl_${side} input`)
	tgt_input.val(int(tgt_input.val() || 0) + 1)

	ksys.context.module.prm(`${side}_score`, tgt_input.val())
	kbmodules.sambo_standard.forward_scores()
}


kbmodules.sambo_standard.score_subtract = function(side)
{
	const tgt_input = $(`#score_ctrl_${side} input`)
	tgt_input.val(Math.max(int(tgt_input.val() || 0) - 1, 0))

	ksys.context.module.prm(`${side}_score`, tgt_input.val())
	kbmodules.sambo_standard.forward_scores()
}






