
// window.modules.number_name_x2lr_w_url_src = {}




$this.load = async function()
{
	context.module.pull()
	var cdata = await talker.project()
	var pr_xml = $(cdata)


	// title path
	$('input[tgt_title]').val(context.module.read().title_path)
	// title name
	$('input[tgt_title_name]').val(context.module.read().title_name)
	// expression
	$('input[interval]').val(context.module.read().interval_exp)
	// xml src
	$('input[xml_link]').val(context.module.read().xml_url)
}



$this.update_coefficients = async function(btn)
{
	btn.vmixbtn(false)
	// echo status
	$('xmlstatus').text('Loading fresh XML...')

	// var fucking_proxy = await talker.py_talk('load_xml', {
	// 	'testing': ($('input[cbox_is_testing]')[0].checked ? '1': '0'),
	// 	'xml_url': context.module.read()['xml_url']
	// })

	// load the xml
	var load_xml = await ksys.url_get(context.module.read()['xml_url'])

	// echo
	$('xmlstatus').text('Response Status:', load_xml.code)

	// evaluate XML
	$('xmlstatus').text('Evaluating XML...')
	var xml_info = $.parseXML(load_xml['payload'])
	$('xmlstatus').text('Loaded and evaluated XML. Piping data...')


	// set values
	var go_pipe = ksys.map.pipe(document.querySelector('#info_display_dynamic xmlmap'), xml_info)
	// wipe
	go_pipe.wipe()
	// do values
	for (var upd of go_pipe['loop'])
	{
		// Date...
		var set_data = upd['data']
		// special condition
		if (upd.special == 'date'){
			var fulldate = new Date(upd['data'])
			var set_data = `${str(fulldate.getDay()).zfill(2)}/${str(fulldate.getMonth()).zfill(2)}`
		}

		// echo local
		upd.confirm_from(set_data)

		// vmix
		var shite = await talker.vmix_talk({
			'Function': 'SetText',
			'Value': set_data,
			'Input': context.module.read().title_name,
			'SelectedName': upd['target']
		})

		print('response shite:', shite)

		if (ksys.vmix_ok(shite)){
			upd.confirm_to(set_data)
		}
	}

	$('xmlstatus').text('Done. Results Are Shown Below')

	// unlock button
	btn.vmixbtn(true)
	
}



$this.trigger_onn = async function(btn)
{
	// lock the button before starting the sequence
	btn.vmixbtn(false)

	// clear timers just in case
	clearTimeout(window.mein_sleep['main_title_timeout'])
	clearTimeout(window.mein_sleep['wait_for_off'])

	// first turn the overlay off
	await talker.vmix_talk({
		'Function': 'OverlayInput2Out',
		'Input': context.module.read().title_name,
		'Duration': '1'
	})

	// wait for out anim to complete
	await jsleep(1100, 'wait_for_off')

	// then reset timeout
	talker.vmix_talk({
		'Function': 'OverlayInput2In',
		'Input': context.module.read().title_name,
		'Duration': '1'
	})
	await jsleep(9000, 'main_title_timeout')
	talker.vmix_talk({
		'Function': 'OverlayInput2Out',
		'Input': context.module.read().title_name,
		'Duration': '1'
	})
	print('turn off')
	// Now unlock the button
	await jsleep(1100, 'main_title_timeout')
	btn.vmixbtn(true)
}



$this.force_off = async function(btn)
{
	// lock this button
	btn.vmixbtn(false)


	// break
	$this.period_break()

	// lock everything
	var all = btns.pool
	all.upd.vmixbtn(false)
	all.trigger_onn.vmixbtn(false)
	all.forceoff.vmixbtn(false)
	all.do_period.vmixbtn(false)
	all.break_period.vmixbtn(false)

	// clear all timeouts
	clearTimeout(window.mein_sleep['main_title_timeout'])
	clearTimeout(window.mein_sleep['wait_for_off'])
	// tell vmix to fade out
	await talker.vmix_talk({
		'Function': 'OverlayInput2Out',
		'Input': context.module.read().title_name,
		'Duration': '1'
	})
	// wait for fade to complete
	await jsleep(2000)
	// unlock trigger button
	$('vmixbtn[trigger_onn]')[0].vmixbtn(true)
	// unlock this button
	btn.vmixbtn(true)

	// unlock everything
	all.upd.vmixbtn(true)
	all.trigger_onn.vmixbtn(true)
	all.forceoff.vmixbtn(true)
	all.do_period.vmixbtn(true)
	all.break_period.vmixbtn(true)
}

$this.period_callback = async function(ticks)
{
	// console.timeEnd('tick')
	const fresh_context = context.module.read().interval / 1000
	// display text
	$('timer').text(`${str(ticks.iteration % fresh_context).zfill(3)}/${fresh_context}`)

	// if loop reached - trigger shite
	// it's important to note that we read fresh interval each time
	if (ticks.iteration % fresh_context == 0){
		await $this.update_coefficients($('vmixbtn[upd]')[0])
		await $this.trigger_onn($('vmixbtn[trigger_onn]')[0])
	}
	// console.time('tick')
}

$this.init_period = async function(btn)
{
	// lock this button
	btn.vmixbtn(false)
	// lock trigger button
	btns.pool.trigger_onn.vmixbtn(false)

	// turn off the title
	await $this.force_off($('vmixbtn[forceoff]')[0])

	// spawn a timer
	window.ad_timer = ksys.ticker.spawn({
		'duration': context.module.read().interval / 1000,
		'name': 'giga_timer',
		'infinite': true,
		'callback': $this.period_callback,
		'wait': true
	})
	// init it
	print(window.ad_timer.fire())
}


$this.period_break = function()
{
	print('Killing timer')
	// unlock period
	$('vmixbtn[do_period]')[0].vmixbtn(true)
	window.period_title = false
	// kill ticker
	if (window.ad_timer != undefined){
		window.ad_timer.force_kill()
	}
	// unlock trigger button
	btns.pool.trigger_onn.vmixbtn(true)
}


$this.mkinput = async function()
{
	var get_fullpath = $('input[tgt_title]').val().replaceAll('"', '').trim()
	$('input[tgt_title]').val(get_fullpath)
	if (get_fullpath == ''){
		return
	}
	var fullpath = get_fullpath
	if (get_fullpath == '[built-in]'){
		var fullpath = await talker.py_talk({'action': 'builtin_title_double_path'})
	}

	context.module.prm('title_path', fullpath, false);
	await context.module.prm('title_name', fullpath.split('\\').at(-1));
	$('input[tgt_title_name]').val(fullpath.split('\\').at(-1));
	await talker.vmix_talk({
		'Function': 'AddInput',
		'Value': `Colour|00000000`
	})
	await talker.vmix_talk({
		'Function': 'AddInput',
		'Value': `Xaml|${str(fullpath).trim()}`
	})
}



$this.set_title_name = async function()
{
	// SetInputName
	var title_val = $('input[tgt_title_name]').val().trim();
	await talker.vmix_talk({
		'Function': 'SetInputName',
		'Input': context.module.read().title_name,
		'Value': title_val
	})
	context.module.prm('title_name', title_val);
}


$this.save_interval = function()
{
	const interval_fix = $('input[interval]').val().trim()
	if (interval_fix == ''){return}

	context.module.prm('interval_exp', interval_fix, false);
	if (window.ad_timer != undefined){
		window.ad_timer.timer_duration = int(eval(interval_fix))
	}
	context.module.prm('interval', int(eval(interval_fix)) * 1000);
}

$this.set_title_xml_src = function()
{
	context.module.prm('xml_url', $('prmrow input[xml_link]').val().trim());
}


$this.change_input_title = function()
{
	ksys.ask_for_file()
	.then(function(response) {
		$('properties input[tgt_title]').val(response[0].path)
	})
}