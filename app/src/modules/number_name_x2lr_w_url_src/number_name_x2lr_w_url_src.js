
//
// Text fields
//

var fields_dict = [
	// number left
	{
		'xml': 'coff_p1',
		'vmix': 'cf_l.Text',
		'gui': 'left number'
	},
	// text left
	{
		'xml': 'p1',
		'vmix': 'name_l.Text',
		'gui': 'left text'
	},


	// number right
	{
		'xml': 'coff_p2',
		'vmix': 'cf_r.Text',
		'gui': 'right number'
	},
	// text right
	{
		'xml': 'p2',
		'vmix': 'name_r.Text',
		'gui': 'right text'
	}
]

async function pull_cached_data()
{
	var cdata = await talker.project()
	var pr_xml = $(cdata)

	// ldc = LoaD Cache
	for (var ldc of fields_dict){
		// $(ldc['gui']).html(str_check(pr_xml.find(`input[title="${context.global.read().title_name}"] text[name="${ldc['vmix']}"]`).text()))
	}

	// date
	// $('middle').html(str_check(pr_xml.find(`input[title="${context.global.read().title_name}"] text[name="date.Text"]`).text()))

	// title path
	$('input[tgt_title]').val(context.global.read().title_path)
	// title name
	$('input[tgt_title_name]').val(context.global.read().title_name)
	// expression
	$('input[interval]').val(context.global.read().interval_exp)
	// xml src
	$('input[xml_link]').val(context.global.read().xml_url)
}



async function x2lr_update_coefficients(btn)
{
	btn.vmixbtn(false)
	// echo status
	$('xmlstatus').text('Loading fresh XML...')

	// var fucking_proxy = await talker.py_talk('load_xml', {
	// 	'testing': ($('input[cbox_is_testing]')[0].checked ? '1': '0'),
	// 	'xml_url': context.global.read()['xml_url']
	// })

	// load the xml
	var load_xml = await ksys.url_get(context.global.read()['xml_url'])

	// echo
	print(load_xml)
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
			'Input': context.global.read().title_name,
			'SelectedName': upd['target']
		})

		print('response shite:', shite)

		if (ksys.vmix_ok(shite)){
			upd.confirm_to(set_data)
		}
	}

	// unlock button
	btn.vmixbtn(true)
	
}



async function trigger_onn(btn)
{
	// lock the button before starting the sequence
	btn.vmixbtn(false)

	// clear timers just in case
	clearTimeout(window.mein_sleep['main_title_timeout'])
	clearTimeout(window.mein_sleep['wait_for_off'])

	// first turn the overlay off
	await talker.vmix_talk({
		'Function': 'OverlayInput2Out',
		'Input': context.global.read().title_name,
		'Duration': '1'
	})

	// wait for out anim to complete
	await jsleep(1100, 'wait_for_off')

	// then reset timeout
	talker.vmix_talk({
		'Function': 'OverlayInput2In',
		'Input': context.global.read().title_name,
		'Duration': '1'
	})
	await jsleep(9000, 'main_title_timeout')
	talker.vmix_talk({
		'Function': 'OverlayInput2Out',
		'Input': context.global.read().title_name,
		'Duration': '1'
	})
	print('turn off')
	// Now unlock the button
	await jsleep(1100, 'main_title_timeout')
	btn.vmixbtn(true)
}



async function force_off(btn)
{
	// lock this button
	btn.vmixbtn(false)


	// break
	period_break()

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
		'Input': context.global.read().title_name,
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

async function period_callback(ticks)
{
	// console.timeEnd('tick')
	var fresh_context = context.global.read().interval / 1000
	// display text
	$('timer').text(`${str(ticks.iteration).zfill(3)}/${fresh_context}`)

	// if loop reached - trigger shite
	// it's important to note that we read fresh interval each time
	if (ticks.iteration == fresh_context){
		await x2lr_update_coefficients($('vmixbtn[upd]')[0])
		await trigger_onn($('vmixbtn[trigger_onn]')[0])
	}
	// console.time('tick')
}

async function init_period(btn)
{
	// lock this button
	btn.vmixbtn(false)
	// lock trigger button
	btns.pool.trigger_onn.vmixbtn(false)

	// turn off the title
	await force_off($('vmixbtn[forceoff]')[0])

	// spawn a timer
	window.ad_timer = ksys.ticker.spawn({
		'duration': context.global.read().interval / 1000,
		'name': 'giga_timer',
		'infinite': true,
		'callback': period_callback,
		'wait': true
	})
	// init it
	print(window.ad_timer.fire())
}


function period_break()
{
	// unlock period
	$('vmixbtn[do_period]')[0].vmixbtn(true)
	window.period_title = false
	// unlock trigger button
	btns.pool.trigger_onn.vmixbtn(true)
}


async function mkinput()
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

	context.global.prm('title_path', fullpath, false);
	await context.global.prm('title_name', fullpath.split('\\').at(-1));
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



async function set_title_name()
{
	// SetInputName
	var title_val = $('input[tgt_title_name]').val().trim();
	await talker.vmix_talk({
		'Function': 'SetInputName',
		'Input': context.global.read().title_name,
		'Value': title_val
	})
	await context.global.prm('title_name', title_val);
}


async function save_interval()
{
	var interval_fix = $('input[interval]').val().trim()
	if (interval_fix == ''){return}

	context.global.prm('interval_exp', interval_fix, false);
	if (window.ad_timer != undefined){
		window.ad_timer.timer_duration = int(eval(interval_fix))
	}
	await context.global.prm('interval', int(eval(interval_fix)) * 1000);
}

async function set_title_xml_src()
{
	await context.global.prm('xml_url', $('prmrow input[xml_link]').val().trim());
}


async function change_input_title()
{
	var input = document.createElement('input');
	input.type = 'file';
	input.addEventListener('change', ch => {
		$('properties input[tgt_title]').val(input.files[0].path)
		input.remove()
		input = null
	});
	input.click();
}