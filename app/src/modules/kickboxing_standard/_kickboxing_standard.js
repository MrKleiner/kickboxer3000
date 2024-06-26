




$this.edit_mode_active = false;
$this.counter = {};

$this.load = function()
{
	// spawn rounds
	print('kickboxing init')
	const roundspool = document.querySelector('rounds pool');
	const fresh_context = ksys.context.module.pull();

	for (let rnd of range(int(document.querySelector('rounds').getAttribute('amount')))){
		roundspool.append($(`<round round_index=${rnd+1} onclick="$this.set_round(${rnd+1}, true)">${rnd+1}</round>`)[0])
	}

	// load pairs
	$this.load_paris()

	$this.toggle_edit(false)

	// context.module.pull()

	// context stuff
	$('input[round_duration]').val(fresh_context.round_duration_exp)
	$('input[res_path]').val(fresh_context.resource_path)

	$('input[round_count]').val(ksys.context.module.cache.round_count)

	// round
	$(`round[round_index="${fresh_context.current_round}"]`).css('color', 'lime')

	// pair
	$(`#pairs_pool pairnum[pair_index="${fresh_context.active_pair_index}"]`).css('color', 'lime')

	if (fresh_context.current_player){
		$('player.active_player').removeClass('active_player');
		const selected_player = fresh_context.current_player.split('-');
		$(`pairnum[pair_index="${selected_player[0]}"]`).closest('pair').find(`player[${selected_player[1]}]`).addClass('active_player')
	}

	$this.titles = {
		'personal': new vmix.title({
			'title_name': 'personal_01a.gtzip',
		}),

		'vs': new vmix.title({
			'title_name': 'vs_main.gtzip',
		}),

		'timer': new vmix.title({
			'title_name': 'timer_01a.gtzip',
		}),

		'lower': new vmix.title({
			'title_name': 'midfight_lower.gtzip',
		}),
	}

	$this.label_index = [
		{
			'label':    'HEIGHT',
			'param_sel': 'p_param[p_height] input',
		},
		{
			'label':    'WEIGHT',
			'param_sel': 'p_param[p_weight] input',
		},
		{
			'label':    'RECORD',
			'param_sel': 'p_param[p_record] input',
		},
	]

	$this.personal_label_index = [
		{
			'label':    'HEIGHT',
			'param_sel': 'p_param[p_height] input',
			'suffix': 'CM'
		},
		{
			'label':    'WEIGHT',
			'param_sel': 'p_param[p_weight] input',
			'suffix': 'KG'
		},
		{
			'label':    'RECORD',
			'param_sel': 'p_param[p_record] input',
		},
	]

}




$this.add_pair = function()
{
	// oncontextmenu="$this.del_pair(this)"
	// onclick="$this.upd_vs_title(this.getAttribute("pair_index"))"
	const pair = ksys.tplates.index_tplate(
		'#pair_asset',
		{
			'root':    'pair',
			'pairnum': 'pairnum',
		}
	)
	pair.index.root.oncontextmenu = function(_self){
		$this.del_pair(_self.target.closest('pair'))
	}
	pair.index.pairnum.onclick = function(_self){
		$this.upd_vs_title(_self.target.getAttribute('pair_index'))
	}

	document.querySelector('#pairs_pool').append(pair.elem)


	// enumarate pairs
	$this.enumerate_pairs()
}

$this.enumerate_pairs = function()
{
	const p_pool = [...document.querySelectorAll('#pairs_pool pairnum')]
	for (let enm in p_pool){
		// print('fuckoff', p_pool[enm])
		p_pool[enm].textContent = str(int(enm) + 1);
		p_pool[enm].setAttribute('pair_index', str(int(enm) + 1));
	}
}


$this.del_pair = function(pr)
{
	if (pr && ($this.edit_mode_active == true)){
		pr.remove()
		$this.enumerate_pairs()
	}
}



$this.toggle_edit = function(state=null)
{
	// Sometimes I stagger even myself with my genius
	if (state == false || state == true){
		$this.edit_mode_active = !state
	}


	if ($this.edit_mode_active == false){
		$this.edit_mode_active = true;

		$this.enumerate_pairs()

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

	if ($this.edit_mode_active == true){
		$this.edit_mode_active = false;

		// unhide display
		$('kbstandard #pairs_pool display').css('display', '');


		// evalueate displays
		for (var evl of document.querySelectorAll('#pairs_pool players player')){
			evl.querySelector('display').textContent = evl.querySelector('p_param[p_name] input').value
		}

		$this.enumerate_pairs()

		// limit height
		// $('kbstandard #pairs_pool').css('height', '600px');

		// block beauty clicks
		$('kbstandard #pairs_pool player').removeAttr('noclick');

		// hide editors
		$('#pairs_pool > sysbtn:not(sysbtn[btname="toggle_edit_mode"]), players player p_param').css('display', 'none')
		return
	}
}


$this.save_pairs = function(tofile=false)
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
$this.load_paris = function(overwrite=null)
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
			<pair oncontextmenu="$this.del_pair(this)">
				<pairnum click_contrast onclick="$this.upd_vs_title(this.getAttribute('pair_index'))"></pairnum>
				<players>
					<player right click_contrast noclick onclick="$this.upd_personal_title(this)">
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
					<player left click_contrast noclick onclick="$this.upd_personal_title(this)">
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
	$this.enumerate_pairs()
}





$this.save_res_path = function()
{
	ksys.context.module.prm('resource_path', document.querySelector('input[res_path]').value)
}


$this.save_timer_duration = function()
{
	ksys.context.module.prm('round_duration', eval(document.querySelector('input[round_duration]').value) * 1000, false);
	ksys.context.module.prm('round_duration_exp', document.querySelector('input[round_duration]').value)
}




















// process VS screen
// todo: this could be done easier by splitting the save function into ripper and saver itself...
$this.upd_vs_title = async function(p_index=null)
{
	// if (!pindex){return}
	// do NOT do this in edit mode!
	if ($this.edit_mode_active == true){return}

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
			'vmix': 'country_r.Source'
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
			'vmix': 'country_l.Source'
		},
		'record_r': {
			'gui': 'player[right] p_param[p_record] input',
			'vmix': 'height_R.Text'
		}

	}
	const frmt = ksys.strf.params.players

	// set boxes
	for (const _box_idx in $this.label_index){
		const prm_info = $this.label_index[_box_idx];
		
		const box_idx = int(_box_idx) + 1

		// Set label
		await $this.titles.vs.set_text(
			`ifb_title_lb_${box_idx}`,
			prm_info.label,
		)

		for (const side of [['l', 'left'], ['r', 'right']]){
			await $this.titles.vs.set_text(
				`ifb_text_${side[0]}_${box_idx}`,
				frmt.format(
					$(pair_elem).find(`player[${side[1]}] ${prm_info.param_sel}`).val().trim()
				)  + ' ' + (prm_info.suffix || ' '),
			)
		}
	}

	// set names
	await $this.titles.vs.set_text(
		`pname_text_l`,
		frmt.format(
			$(pair_elem).find(`player[left] p_param[p_name] input`).val().trim()
		),
	)
	await $this.titles.vs.set_text(
		`pname_text_r`,
		frmt.format(
			$(pair_elem).find(`player[right] p_param[p_name] input`).val().trim()
		),
	)

	// set names
	await $this.titles.lower.set_text(
		`player_l`,
		frmt.format(
			$(pair_elem).find(`player[left] p_param[p_name] input`).val().trim()
		),
	)
	await $this.titles.lower.set_text(
		`player_r`,
		frmt.format(
			$(pair_elem).find(`player[right] p_param[p_name] input`).val().trim()
		),
	)

	// Category
	await $this.titles.vs.set_text(
		`category`,
		frmt.format(
			$(pair_elem).find(`player[left] p_param[p_weight] input`).val().trim()
		),
	)

	// set countries
	var ctx = ksys.context.module.pull()
	if (ctx.resource_path && ctx.resource_path){
		// LEFT
		// await vmix.talker.talk({
		// 	'Function': 'SetImage',
		// 	'Value': str((Path(ctx.resource_path)).join('flags', $(pair_elem).find(c_dict['country_l']['gui']).val().trim())).replaceAll('/', '\\'),
		// 	'Input': 'vs_main.gtzip',
		// 	'SelectedName': c_dict['country_l']['vmix']
		// })
		// Right
		// await vmix.talker.talk({
		// 	'Function': 'SetImage',
		// 	'Value': str((Path(ctx.resource_path)).join('flags', $(pair_elem).find(c_dict['country_r']['gui']).val().trim())).replaceAll('/', '\\'),
		// 	'Input': 'vs_main.gtzip',
		// 	'SelectedName': c_dict['country_r']['vmix']
		// })
		// Background
		await vmix.talker.talk({
			'Function': 'SetImage',
			'Value': str((Path(ctx.resource_path)).join('pair_pool', `${p_index}.png`)).replaceAll('/', '\\'),
			'Input': 'vs_main.gtzip',
			'SelectedName': 'Image1.Source'
		})
	}


}



$this.upd_personal_title = async function(player)
{
	if ($this.edit_mode_active == true){return};

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

	const title = $this.titles.personal;

	const p_name = new Set(player_info.name.value.trim().split(' '));
	const frmt = ksys.strf.params.players;

	const psurname = frmt.format(p_name.at(-1));
	p_name.del_idx(-1)
	// const pname = frmt.format(
	// 	Array.from(p_name).join(' ')
	// );
	const pname = frmt.format(p_name.join(' '));


	await title.set_text('name',    pname)
	await title.set_text('surname', psurname)

	const rel_flag_path = 
		Path(ksys.context.module.cache.resource_path)
		.join(
			'flags',
			`${$(player_elem).find('p_param[p_country] input').val().trim()}`
		)

	// Set flag
	// title.set_img_src(
	// 	'flag',
	// 	str(rel_flag_path).replaceAll('/', '\\')
	// )

	for (const i in $this.personal_label_index){
		const box = $this.personal_label_index[i]
		const idx = int(i) + 1
		// print('Set shit', `attr_${idx}_label`, box.label)
		// print('Set shit', `attr_${idx}_val`, player_elem.find(box.param_sel).val().trim())

		await title.set_text(`attr_${idx}_label`, box.label)
		await title.set_text(
			`attr_${idx}_val`,
			player_elem.find(box.param_sel).val().trim() + ' ' + (box.suffix || '')
		)
	}


	// await title.set_text('weight_text', frmt.format(player_info.weight.value))
	// await title.set_text('height_text', frmt.format(player_info.height.value))

	// await title.set_text('weight_text', frmt.format(player_info.weight.value + ' KG'))
	// await title.set_text('height_text', frmt.format(player_info.height))

	// await title.set_text('record_text', frmt.format(player_info.record.value))

	// await title.set_text('height_text', player_info.record.value)

	// Country
	// await vmix.talker.talk({
	// 	'Function': 'SetImage',
	// 	'Value': str((new pathlib(ksys.context.module.pull().resource_path)).join('flags', `${$(player).find('p_param[p_country] input').val().trim()}`)).replaceAll('/', '\\'),
	// 	'Input': 'personal.gtzip',
	// 	'SelectedName': 'country.Source'
	// })
}





$this.set_round = function(r, resetround=false)
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
		$this.respawn_timer(false, false)
	}
	
}






$this.timer_callback = async function(ticks)
{

	const minutes = Math.floor(ticks.global / 60)
	const seconds = ticks.global - (60*minutes)
	// print('minutes:', minutes, 'seconds', seconds)
	// print('global:', ticks.global)

	if (ticks.global <= 9){
		await $this.timer_hide(true)
		$this.counter.force_kill()
	}

	// update
	await $this.titles.lower.set_text(
		'timer_text',
		`${minutes}:${str(seconds).zfill(2)}`,
	)
	/*
	await vmix.talker.talk({
		'Function': 'SetText',
		'Value': `${minutes}:${str(seconds).zfill(2)}`,
		'Input': 'timer.gtzip',
		'SelectedName': 'timer_time.Text'
	})
	*/
}

$this.respawn_manager = function(act)
{

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

$this.respawn_timer = async function(show=false, st=false)
{
	var minutes = Math.floor((ksys.context.module.pull().round_duration / 1000) / 60)
	var seconds = (ksys.context.module.pull().round_duration / 1000) - (60*minutes)

	// clear previous timer
	/*
	await vmix.talker.talk({
		'Function': 'SetText',
		'Value': `${minutes}:${str(seconds).zfill(2)}`,
		'Input': 'timer.gtzip',
		'SelectedName': 'timer_time.Text'
	})
	*/
	$this.titles.timer.set_text('timer_text', `${minutes}:${str(seconds).zfill(2)}`)

	// kill previous timer
	try{
		$this.counter.force_kill()
	}catch (error){
		console.log(error)
	}

	// spawn a timer
	$this.counter = ksys.ticker.spawn({
		'duration': ksys.context.module.pull().round_duration / 1000,
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


$this.timer_hide = async function(dopause=false)
{
	$this.timer_pause(dopause)
	// off
	/*
	await vmix.talker.talk({
		'Function': 'OverlayInput1Out',
		'Input': 'timer.gtzip',
	})
	*/

	await $this.titles.timer.overlay_out(1)
}

$this.timer_show = async function(unpause=true)
{
	$this.timer_pause(!unpause)
	// off
	/*
	await vmix.talker.talk({
		'Function': 'OverlayInput1In',
		'Input': 'timer.gtzip',
	})
	*/
	await $this.titles.timer.set_text(
		'info_text',
		`${ksys.context.module.cache.current_round} OF ${ksys.context.module.cache.round_count}`
	)

	await $this.titles.timer.overlay_in(1)
}


$this.timer_pause = function(state=true)
{
	if ($this.counter){
		// do pause
		$this.counter.pause = state;
	}
}



$this.timer_set_time = function(tm=null)
{
	if ($this.counter && tm){
		// set time
		// $this.counter.set_global_tick(tm, true)

		// kill previous timer
		try{
			$this.counter.force_kill()
		}catch (error){}

		const total_dur = (ksys.context.module.pull().round_duration / 1000)

		// spawn a timer
		$this.counter = ksys.ticker.spawn({
			'duration': total_dur - (total_dur - tm),
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







$this.vs_onn = function()
{
	vmix.talker.talk({
		'Function': 'OverlayInput1In',
		'Input': 'vs_main.gtzip',
	})
}

$this.vs_off = function()
{
	vmix.talker.talk({
		'Function': 'OverlayInput1Out',
		'Input': 'vs_main.gtzip',
	})
}








$this.player_onn = function()
{
	$this.titles.lower.overlay_in(1)
}

$this.player_off = function()
{
	$this.titles.lower.overlay_out(1)
}



$this.load_pairs_from_file = async function()
{
	const file = await ksys.util.ask_file();

	try{
		$this.load_paris(
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



$this.save_pairs_to_file = function()
{
	lizard.textdl('boxing_pairs.preset', $this.save_pairs(true))
}



$this.set_category = async function()
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



$this.save_round_count = function()
{
	ksys.context.module.prm('round_count', $('input[round_count]').val())
}

