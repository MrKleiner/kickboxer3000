
if(!window.kbmodules){window.kbmodules={}};
if(!window.kbmodules.welcome){window.kbmodules.welcome={}};



window.kbmodules.welcome.load = function(){
	ksys.pgview.show_pool()
}



window.kbmodules.welcome.add_pgview_keybind = function(){
	const entry = new ksys.pgview.pgview_entry()
	print('what??', entry.bind_ctrl)
	$('#pgview_link_pool').append(entry.bind_ctrl)
}



window.kbmodules.welcome.edit_vmix_ip_addr = function(){
	const ip_data = $('#vmix_ip_address_editor > input').val().split(':');

	if (ip_data.length != 2 || !ip_data[0] || !ip_data[1]){
		ksys.info_msg.send_msg(
			`Invalid address data: >${ip_data[0]}:${ip_data[1]}<`,
			'warn',
			4000
		);
		return
	}

	ksys.context.global.cache['vmix_ip'] = ip_data[0];
	ksys.context.global.cache['vmix_port'] = ip_data[1] || '';
	ksys.context.global.save()

	ksys.fbi.warn_critical(
		`Please press CTRL + R (there's nothing else you can do)`
	)
	$('body').css({'pointer-events': 'none'})
}


