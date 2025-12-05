// const { ipcRenderer } = require('electron');

$this.load = function(){};


$this.save_creds = function()
{
	const [ip, port] = [
		$('#welcome_enter_info [ip]').val(),
		$('#welcome_enter_info [port]').val(),
	];

	if (!Number.isInteger(int(port))){
		ksys.info_msg.send_msg(
			`Invalid address data: >${ip}:${port}<`,
			'warn',
			4000
		);
		return
	}

	const ipNumbers = ip.split('.');

	if (ipNumbers.length != 4){
		ksys.info_msg.send_msg(
			`Invalid address data: >${ip}:${port}<`,
			'warn',
			4000
		);
		return
	}

	for (const num of ipNumbers){
		if (!Number.isInteger(int(num))){
			ksys.info_msg.send_msg(
				`Invalid address data: >${ip}:${port}<`,
				'warn',
				4000
			);
			return
		}
	}

	ksys.context.global.cache['vmix_ip'] = $('#welcome_enter_info [ip]').val();
	ksys.context.global.cache['vmix_port'] = $('#welcome_enter_info [port]').val();
	ksys.context.global.save();
	// window.location.reload();
	ksys.util.reload();

}








