window.modules.kickboxing_standard={};






window.modules.kickboxing_standard.edit_mode_active = false;
window.modules.kickboxing_standard.counter = {};

window.modules.kickboxing_standard.load = function()
{
	// spawn rounds
	print('kickboxing init')
	var roundspool = document.querySelector('rounds pool');
	for (var rnd of range(int(document.querySelector('rounds').getAttribute('amount')))){
		roundspool.append(lizard.ehtml(`<round round_index=${rnd+1} onclick="window.modules.kickboxing_standard.set_round(${rnd+1}, true)">${rnd+1}</round>`))
	}

	// load pairs
	window.modules.kickboxing_standard.load_paris()
	// this just has to be here... Dont fucking question it you mongrel
	window.modules.kickboxing_standard.toggle_edit(false)

	// context.module.pull()

	// context stuff
	$('input[round_duration]').val(context.module.read().round_duration_exp)
	$('input[res_path]').val(context.module.read().resource_path)

	// round
	$(`round[round_index="${context.module.read().current_round}"]`).css('color', 'lime')

	// pair
	$(`#pairs_pool pairnum[pair_index="${context.module.read().active_pair_index}"]`).css('color', 'lime')

}




window.modules.kickboxing_standard.add_pair = function()
{
	document.querySelector('#pairs_pool').append(lizard.ehtml(`
		<pair oncontextmenu="window.modules.kickboxing_standard.del_pair(this)">
			<pairnum click_contrast></pairnum onclick="window.modules.kickboxing_standard.upd_vs_title(this.getAttribute("pair_index"))">
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
	window.modules.kickboxing_standard.enumerate_pairs()
}

window.modules.kickboxing_standard.enumerate_pairs = function()
{
	var pool = [...document.querySelectorAll('#pairs_pool pairnum')]
	for (var enm in pool){
		pool[enm].textContent = str(int(enm) + 1);
		pool[enm].setAttribute('pair_index', str(int(enm) + 1));
	}
}


window.modules.kickboxing_standard.del_pair = function(pr)
{
	if (pr && (window.modules.kickboxing_standard.edit_mode_active == true)){
		pr.remove()
		window.modules.kickboxing_standard.enumerate_pairs()
	}
}



window.modules.kickboxing_standard.toggle_edit = function(state=null)
{
	// Sometimes I stagger even myself with my genius
	if (state == false || state == true){
		window.modules.kickboxing_standard.edit_mode_active = !state
	}


	if (window.modules.kickboxing_standard.edit_mode_active == false){
		window.modules.kickboxing_standard.edit_mode_active = true;

		window.modules.kickboxing_standard.enumerate_pairs()

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

	if (window.modules.kickboxing_standard.edit_mode_active == true){
		window.modules.kickboxing_standard.edit_mode_active = false;

		// unhide display
		$('kbstandard #pairs_pool display').css('display', '');


		// evalueate displays
		for (var evl of document.querySelectorAll('#pairs_pool players player')){
			evl.querySelector('display').textContent = evl.querySelector('p_param[p_name] input').value
		}

		window.modules.kickboxing_standard.enumerate_pairs()

		// limit height
		$('kbstandard #pairs_pool').css('height', '600px');

		// block beauty clicks
		$('kbstandard #pairs_pool player').removeAttr('noclick');

		// hide editors
		$('#pairs_pool > sysbtn:not(sysbtn[btname="toggle_edit_mode"]), players player p_param').css('display', 'none')
		return
	}
}


window.modules.kickboxing_standard.save_pairs = function(tofile=false)
{
	var collected = []
	for (var pair of document.querySelectorAll('#pairs_pool pair')){
		collected.push({
			'left':{
				'name': pair.querySelector('player[left] p_param[p_name] input').value,
				'age': pair.querySelector('player[left] p_param[p_age] input').value,
				'height': pair.querySelector('player[left] p_param[p_height] input').value,
				'weight': pair.querySelector('player[left] p_param[p_weight] input').value,
				'country': pair.querySelector('player[left] p_param[p_country] input').value,
				'record': pair.querySelector('player[left] p_param[p_record] input').value,
			},
			'right':{
				'name': pair.querySelector('player[right] p_param[p_name] input').value,
				'age': pair.querySelector('player[right] p_param[p_age] input').value,
				'height': pair.querySelector('player[right] p_param[p_height] input').value,
				'weight': pair.querySelector('player[right] p_param[p_weight] input').value,
				'country': pair.querySelector('player[right] p_param[p_country] input').value,
				'record': pair.querySelector('player[right] p_param[p_record] input').value,
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
window.modules.kickboxing_standard.load_paris = function(overwrite=null)
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
	for (var pair of pairs_dict){
		document.querySelector('#pairs_pool').append(lizard.ehtml(`
			<pair oncontextmenu="window.modules.kickboxing_standard.del_pair(this)">
				<pairnum click_contrast onclick="window.modules.kickboxing_standard.upd_vs_title(this.getAttribute('pair_index'))"></pairnum>
				<players>
					<player left click_contrast noclick onclick="window.modules.kickboxing_standard.upd_personal_title(this)">
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


					<player right click_contrast noclick onclick="window.modules.kickboxing_standard.upd_personal_title(this)">
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
	window.modules.kickboxing_standard.enumerate_pairs()
}





window.modules.kickboxing_standard.save_res_path = function()
{
	context.module.prm('resource_path', document.querySelector('input[res_path]').value)
}


window.modules.kickboxing_standard.save_timer_duration = function()
{
	context.module.prm('round_duration', eval(document.querySelector('input[round_duration]').value) * 1000, false);
	context.module.prm('round_duration_exp', document.querySelector('input[round_duration]').value)
}




















// process VS screen
// todo: this could be done easier by splitting the save function into ripper and saver itself...
window.modules.kickboxing_standard.upd_vs_title = async function(p_index=null)
{
	// if (!pindex){return}
	// do NOT do this in edit mode!
	if (window.modules.kickboxing_standard.edit_mode_active == true){return}

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

	for (var apply in c_dict){
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



window.modules.kickboxing_standard.upd_personal_title = async function(player)
{
	if (window.modules.kickboxing_standard.edit_mode_active == true){return}
	// surname
	await talker.vmix_talk({
		'Function': 'SetText',
		'Value': $(player).find('p_param[p_name] input').val().trim().split(' ')[1].trim(),
		'Input': 'personal.gtzip',
		'SelectedName': 'name.Text'
	})

	// name
	await talker.vmix_talk({
		'Function': 'SetText',
		'Value': $(player).find('p_param[p_name] input').val().trim().split(' ')[0].trim(),
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





window.modules.kickboxing_standard.set_round = function(r, resetround=false)
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
		window.modules.kickboxing_standard.respawn_timer(false, false)
	}
	
}






window.modules.kickboxing_standard.timer_callback = async function(ticks)
{

	var minutes = Math.floor(ticks.global / 60)
	var seconds = ticks.global - (60*minutes)
	print('minutes:', minutes, 'seconds', seconds)
	print('global:', ticks.global)

	if (ticks.global <= 6){
		window.modules.kickboxing_standard.timer_hide(true)
	}

	// update
	await talker.vmix_talk({
		'Function': 'SetText',
		'Value': `${minutes}:${str(seconds).zfill(2)}`,
		'Input': 'timer.gtzip',
		'SelectedName': 'timer_time.Text'
	})
}

window.modules.kickboxing_standard.respawn_manager = function(act)
{

	// onn = the big button onn
	// if there's no timer OR the prv one is dead - create one and start and then show
	// if there's timer and it's alive - unpase and show
	if (!window.modules.kickboxing_standard.counter.alive){
		window.modules.kickboxing_standard.respawn_timer(true, true)
	}else{
		if (window.modules.kickboxing_standard.counter.alive == true){
			// clear pause
			// window.modules.kickboxing_standard.timer_pause(false)
			window.modules.kickboxing_standard.timer_show()
		} 
	}
}

window.modules.kickboxing_standard.respawn_timer = async function(show=false, st=false)
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
		window.modules.kickboxing_standard.counter.force_kill()
	}catch (error){}

	// spawn a timer
	window.modules.kickboxing_standard.counter = ksys.ticker.spawn({
		'duration': context.module.read().round_duration / 1000,
		'name': 'giga_timer',
		'infinite': false,
		'reversed': true,
		'callback': window.modules.kickboxing_standard.timer_callback,
		'wait': true
	})
	// init and show, if asked
	if (st == true){
		// init
		window.modules.kickboxing_standard.counter.fire()
		.then(function(response) {
			// turn off automatically
			if (window.modules.kickboxing_standard.counter){
				window.modules.kickboxing_standard.counter.pause = true;
			}
		})
	}

	if (show == true){
		await window.modules.kickboxing_standard.timer_show()
	}
}


window.modules.kickboxing_standard.timer_hide = async function(dopause=false)
{
	window.modules.kickboxing_standard.timer_pause(dopause)
	// off
	await talker.vmix_talk({
		'Function': 'OverlayInput1Out',
		'Input': 'timer.gtzip',
	})
}

window.modules.kickboxing_standard.timer_show = async function(unpause=true)
{
	window.modules.kickboxing_standard.timer_pause(!unpause)
	// off
	await talker.vmix_talk({
		'Function': 'OverlayInput1In',
		'Input': 'timer.gtzip',
	})
}


window.modules.kickboxing_standard.timer_pause = function(state=true)
{
	if (window.modules.kickboxing_standard.counter){
		// do pause
		window.modules.kickboxing_standard.counter.pause = state;
	}
}



window.modules.kickboxing_standard.timer_set_time = function(tm=null)
{
	if (window.modules.kickboxing_standard.counter && tm){
		// set time
		window.modules.kickboxing_standard.counter.set_global_tick(tm, true)
	}
}







window.modules.kickboxing_standard.vs_onn = function()
{
	talker.vmix_talk({
		'Function': 'OverlayInput1In',
		'Input': 'vs_main.gtzip',
	})
}

window.modules.kickboxing_standard.vs_off = function()
{
	talker.vmix_talk({
		'Function': 'OverlayInput1Out',
		'Input': 'vs_main.gtzip',
	})
}








window.modules.kickboxing_standard.player_onn = function()
{
	talker.vmix_talk({
		'Function': 'OverlayInput1In',
		'Input': 'personal.gtzip',
	})
}

window.modules.kickboxing_standard.player_off = function()
{
	talker.vmix_talk({
		'Function': 'OverlayInput1Out',
		'Input': 'personal.gtzip',
	})
}



window.modules.kickboxing_standard.load_pairs_from_file = function()
{
	ksys.ask_for_file()
	.then(function(response) {
		try{
			window.modules.kickboxing_standard.load_paris(JSON.parse(fs.readFileSync(response[0].path, {encoding:'utf8', flag:'r'})))
		}catch (error){
			console.error(error)
			print('Failed to load pairs from file. Most probable problem: invalid file.')
		}
	})
}



window.modules.kickboxing_standard.save_pairs_to_file = function()
{
	lizard.textdl('boxing_pairs.preset', window.modules.kickboxing_standard.save_pairs(true))
}





























