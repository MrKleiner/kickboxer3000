




$this.edit_mode_active = false;
$this.counter = {};

$this.load = function()
{
	// spawn rounds
	print('kickboxing init')
	const roundspool = document.querySelector('rounds pool');
	const fresh_context = context.module.read();

	for (let rnd of range(int(document.querySelector('rounds').getAttribute('amount')))){
		roundspool.append(lizard.ehtml(`<round round_index=${rnd+1} onclick="$this.set_round(${rnd+1}, true)">${rnd+1}</round>`))
	}

	// load pairs
	$this.load_paris()
	// this just has to be here... Dont fucking question it you mongrel
	$this.toggle_edit(false)

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

}




$this.add_pair = function()
{
	document.querySelector('#pairs_pool').append(lizard.ehtml(`
		<pair oncontextmenu="$this.del_pair(this)">
			<pairnum click_contrast></pairnum onclick="$this.upd_vs_title(this.getAttribute("pair_index"))">
			<players>
				<player left click_contrast noclick>
					<display></display>
					<p_param p_name>
						<descr>Name</descr>
						<input type="text" placeholder="Player Name">
					</p_param>
					<p_param p_age>
						<descr>Age</descr>
						<input type="text" placeholder="Player Age">
					</p_param>
					<p_param p_height>
						<descr>Height</descr>
						<input type="text" placeholder="Player Height">
					</p_param>
					<p_param p_weight>
						<descr>Weight</descr>
						<input type="text" placeholder="Player Weight">
					</p_param>
					<p_param p_country>
						<descr>Country</descr>
						<input type="text" placeholder="Player's Country of Origin">
					</p_param>
					<p_param p_record>
						<descr>Record</descr>
						<input type="text" placeholder="Player Record">
					</p_param>
				</player>


				<player right click_contrast noclick>
					<display></display>
					<p_param p_name>
						<descr>Name</descr>
						<input type="text" placeholder="Player Name">
					</p_param>
					<p_param p_age>
						<descr>Age</descr>
						<input type="text" placeholder="Player Age">
					</p_param>
					<p_param p_height>
						<descr>Height</descr>
						<input type="text" placeholder="Player Height">
					</p_param>
					<p_param p_weight>
						<descr>Weight</descr>
						<input type="text" placeholder="Player Weight">
					</p_param>
					<p_param p_country>
						<descr>Country</descr>
						<input type="text" placeholder="Player's Country of Origin">
					</p_param>
					<p_param p_record>
						<descr>Record</descr>
						<input type="text" placeholder="Player Record">
					</p_param>
				</player>
			</players>
		</pair>
	`))

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
		$('kbstandard #pairs_pool').css('height', 'auto')

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
		$('kbstandard #pairs_pool').css('height', '600px');

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
		db.module.write('pairs_dict.pootis', JSON.stringify(collected, null, 4))
	}
	
}


// overwrite takes a JOn object/json containing pairs
$this.load_paris = function(overwrite=null)
{
	// wipe existing
	$('#pairs_pool pair').remove();

	// load saved, if any
	var pairs_dict = db.module.read('pairs_dict.pootis') || overwrite;
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
						<p_param p_height>
							<descr>Height</descr>
							<input type="text" placeholder="Player Height" value="${pair.left.height}">
						</p_param>
						<p_param p_weight>
							<descr>Weight</descr>
							<input type="text" placeholder="Player Weight" value="${pair.left.weight}">
						</p_param>
						<p_param p_country>
							<descr>Country</descr>
							<input type="text" placeholder="Player's Country of Origin" value="${pair.left.country}">
						</p_param>
						<p_param p_record>
							<descr>Record</descr>
							<input type="text" placeholder="Player Record" value="${pair.left.record}">
						</p_param>
					</player>


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
						<p_param p_height>
							<descr>Height</descr>
							<input type="text" placeholder="Player Height" value="${pair.right.height}">
						</p_param>
						<p_param p_weight>
							<descr>Weight</descr>
							<input type="text" placeholder="Player Weight" value="${pair.right.weight}">
						</p_param>
						<p_param p_country>
							<descr>Country</descr>
							<input type="text" placeholder="Player's Country of Origin" value="${pair.right.country}">
						</p_param>
						<p_param p_record>
							<descr>Record</descr>
							<input type="text" placeholder="Player Record" value="${pair.right.record}">
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
	context.module.prm('resource_path', document.querySelector('input[res_path]').value)
}


$this.save_timer_duration = function()
{
	context.module.prm('round_duration', eval(document.querySelector('input[round_duration]').value) * 1000, false);
	context.module.prm('round_duration_exp', document.querySelector('input[round_duration]').value)
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
	context.module.prm('active_pair_index', p_index)

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
			'vmix': 'record_L.Text'
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
			'vmix': 'record_R.Text'
		}

	}

	for (let apply in c_dict){
		await talker.vmix_talk({
			'Function': 'SetText',
			'Value': $(pair_elem).find(c_dict[apply]['gui']).val().trim(),
			'Input': 'vs_main.gtzip',
			'SelectedName': c_dict[apply]['vmix']
		})
	}

	// set countries
	var ctx = context.module.read()
	if (ctx.resource_path && ctx.resource_path != ''){
		// LEFT
		await talker.vmix_talk({
			'Function': 'SetImage',
			'Value': str((new pathlib(ctx.resource_path)).join('flags', $(pair_elem).find(c_dict['country_l']['gui']).val().trim())).replaceAll('/', '\\'),
			'Input': 'vs_main.gtzip',
			'SelectedName': c_dict['country_l']['vmix']
		})
		// Right
		await talker.vmix_talk({
			'Function': 'SetImage',
			'Value': str((new pathlib(ctx.resource_path)).join('flags', $(pair_elem).find(c_dict['country_r']['gui']).val().trim())).replaceAll('/', '\\'),
			'Input': 'vs_main.gtzip',
			'SelectedName': c_dict['country_r']['vmix']
		})
		// Background
		await talker.vmix_talk({
			'Function': 'SetImage',
			'Value': str((new pathlib(ctx.resource_path)).join('pair_pool', `${p_index}.png`)).replaceAll('/', '\\'),
			'Input': 'vs_main.gtzip',
			'SelectedName': 'player_pair.Source'
		})
	}


}



$this.upd_personal_title = async function(player)
{
	if ($this.edit_mode_active == true){return};

	const player_elem = $(player).closest('player');

	$('player.active_player').removeClass('active_player');
	player_elem.addClass('active_player');

	context.module.prm(
		'current_player',
		`${player_elem.closest('pair').find('pairnum').attr('pair_index')}-${(player_elem.attr('left') == '') ? 'left' : 'right'}`
	)

	const pname = window.ksys.translit(player_elem.find('p_param[p_name] input').val().trim()).split(' ');

	// surname
	await talker.vmix_talk({
		'Function': 'SetText',
		'Value': pname.at(-1).trim(),
		'Input': 'personal.gtzip',
		'SelectedName': 'name.Text'
	})
	// name
	await talker.vmix_talk({
		'Function': 'SetText',
		'Value': pname[0].trim(),
		'Input': 'personal.gtzip',
		'SelectedName': 'surname.Text'
	})

	// height
	await talker.vmix_talk({
		'Function': 'SetText',
		'Value': $(player).find('p_param[p_height] input').val().trim(),
		'Input': 'personal.gtzip',
		'SelectedName': 'height.Text'
	})

	// weight
	await talker.vmix_talk({
		'Function': 'SetText',
		'Value': $(player).find('p_param[p_weight] input').val().trim(),
		'Input': 'personal.gtzip',
		'SelectedName': 'weight.Text'
	})

	// record
	await talker.vmix_talk({
		'Function': 'SetText',
		'Value': $(player).find('p_param[p_record] input').val().trim(),
		'Input': 'personal.gtzip',
		'SelectedName': 'record.Text'
	})

	// Country
	await talker.vmix_talk({
		'Function': 'SetImage',
		'Value': str((new pathlib(context.module.read().resource_path)).join('flags', `${$(player).find('p_param[p_country] input').val().trim()}`)).replaceAll('/', '\\'),
		'Input': 'personal.gtzip',
		'SelectedName': 'country.Source'
	})
}





$this.set_round = function(r, resetround=false)
{
	// store current round number
	context.module.prm('current_round', r)

	$('round').css('color', '')
	$(`round[round_index="${r}"]`).css('color', 'lime')

	talker.vmix_talk({
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

	var minutes = Math.floor(ticks.global / 60)
	var seconds = ticks.global - (60*minutes)
	// print('minutes:', minutes, 'seconds', seconds)
	// print('global:', ticks.global)

	if (ticks.global <= 6){
		$this.timer_hide(true)
	}

	// update
	await talker.vmix_talk({
		'Function': 'SetText',
		'Value': `${minutes}:${str(seconds).zfill(2)}`,
		'Input': 'timer.gtzip',
		'SelectedName': 'timer_time.Text'
	})
}

$this.respawn_manager = function(act)
{

	// onn = the big button onn
	// if there's no timer OR the prv one is dead - create one and start and then show
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
	var minutes = Math.floor((context.module.read().round_duration / 1000) / 60)
	var seconds = (context.module.read().round_duration / 1000) - (60*minutes)

	// clear previous timer
	await talker.vmix_talk({
		'Function': 'SetText',
		'Value': `${minutes}:${str(seconds).zfill(2)}`,
		'Input': 'timer.gtzip',
		'SelectedName': 'timer_time.Text'
	})

	// kill previous timer
	try{
		$this.counter.force_kill()
	}catch (error){}

	// spawn a timer
	$this.counter = ksys.ticker.spawn({
		'duration': context.module.read().round_duration / 1000,
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
		.then(function(response) {
			// turn off automatically
			if ($this.counter){
				$this.counter.pause = true;
			}
		})
	}

	if (show == true){
		await $this.timer_show()
	}
}


$this.timer_hide = async function(dopause=false)
{
	$this.timer_pause(dopause)
	// off
	await talker.vmix_talk({
		'Function': 'OverlayInput1Out',
		'Input': 'timer.gtzip',
	})
}

$this.timer_show = async function(unpause=true)
{
	$this.timer_pause(!unpause)
	// off
	await talker.vmix_talk({
		'Function': 'OverlayInput1In',
		'Input': 'timer.gtzip',
	})
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
		$this.counter.set_global_tick(tm, true)
	}
}







$this.vs_onn = function()
{
	talker.vmix_talk({
		'Function': 'OverlayInput1In',
		'Input': 'vs_main.gtzip',
	})
}

$this.vs_off = function()
{
	talker.vmix_talk({
		'Function': 'OverlayInput1Out',
		'Input': 'vs_main.gtzip',
	})
}








$this.player_onn = function()
{
	talker.vmix_talk({
		'Function': 'OverlayInput1In',
		'Input': 'personal.gtzip',
	})
}

$this.player_off = function()
{
	talker.vmix_talk({
		'Function': 'OverlayInput1Out',
		'Input': 'personal.gtzip',
	})
}



$this.load_pairs_from_file = function()
{
	ksys.ask_for_file()
	.then(function(response) {
		try{
			$this.load_paris(JSON.parse(fs.readFileSync(response[0].path, {encoding:'utf8', flag:'r'})))
		}catch (error){
			console.error(error)
			print('Failed to load pairs from file. Most probable problem: invalid file.')
		}
	})
}



$this.save_pairs_to_file = function()
{
	lizard.textdl('boxing_pairs.preset', $this.save_pairs(true))
}





























// $this.load()