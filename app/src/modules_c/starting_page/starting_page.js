
if(!kbmodules){kbmodules={}};

if(!kbmodules.starting_page){kbmodules.starting_page={}};





kbmodules.starting_page.save_creds = function()
{
	ksys.context.global.cache['vmix_ip'] = $('#welcome_enter_info [ip]').val()
	ksys.context.global.cache['vmix_port'] = $('#welcome_enter_info [port]').val()
	ksys.context.global.save()
	window.location.reload()
}








