




$this.save_creds = function()
{
	context.global.prm('vmix_ip', $('#welcome_enter_info [ip]').val(), false)
	context.global.prm('vmix_port', $('#welcome_enter_info [port]').val(), false)
	context.global.save()
	window.location.reload()
}