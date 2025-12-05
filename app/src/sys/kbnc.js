const net = require('net');


let currentClient = null;


const KBNC = class{
	constructor(){
		const self = ksys.util.nprint(
			ksys.util.cls_pwnage.remap(this),
			'#FF0000',
		);

		self._dom = null;

		self.tplates = ksys.tplates.sys_tplates.kbnc;

		self.enabled = false;

		self.skt = null;
		self.sktSched = null;

		[self.clientConnectedPromise, self.clientConnectedResolve, self.clientConnectedReject]
		= [null, null, null];

		[self.connectionPromise, self.connectionResolve, self.connectionReject]
		= ksys.util.flatPromise();
	}

	static sysData(){
		return {
			currentClient,
		}
	}

	$dom(self){
		if (self._dom){
			return self._dom;
		}

		self._dom = self.tplates.kbnc_main({
			// 'kbnc_server':    'vmixbtn[btname="kbnc_server"]',
			// 'kbnc_client':    'vmixbtn[btname="kbnc_client"]',
			// 'kbnc_stop':      'vmixbtn[btname="kbnc_stop"]',

			'kbnc_server':    '.kbnc_server',
			'kbnc_client':    '.kbnc_client',
			'kbnc_stop':      '.kbnc_stop',

			'current_cmd_id': '.current_cmd_id',
			'current_status': '.current_status',
		})

		self._dom.index.kbnc_server.onclick = async function(){
			const launchResponse = await self.launchServer();
			if (launchResponse == true){
				ksys.info_msg.send_msg(
					`ASML OK`,
					'ok',
					3000
				);
			}else{
				self.nwarn(launchResponse);
				ksys.info_msg.send_msg(
					`ASML EROR: ${launchResponse}`,
					'warn',
					6000
				);
			}
		}

		self._dom.index.kbnc_client.onclick = async function(){
			if (self.enabled){
				ksys.info_msg.send_msg(
					`Already running`,
					'warn',
					5000
				);
				return
			}
			if (await self.launchClient() != false){
				ksys.context.global.prm('kbnc_client_enabled', true);
				ksys.info_msg.send_msg(
					`LAUNCH OK`,
					'ok',
					3000
				);
			}
		}

		self._dom.index.kbnc_stop.onclick = async function(){
			ksys.context.global.prm('kbnc_client_enabled', false);
			self.enabled = false;
			try{self.sktSched.terminate()}catch(e){
				self.nwarn(e);
			};
		}

		return self._dom
	}

	onSchedDeath(self, err){
		self.nerr(err);
		// try{self.sktSched.terminate()}catch{};
		self.sktSched = null;
		self.skt = null;
		self.clientConnectedResolve?.();
	}

	async msgHandler(self, MSGData){

	}

	async readConnectionData(self){
		const projectXML = await vmix.talker.project();

		// self.nprint(projectXML);

		let [targetKey, targetPort] = (
			projectXML
			.querySelector('input[title="KBNC_SYS_DATA.gtzip"] text[name="0.Text"]')
			.textContent
			.split(':')
		)

		if (!targetKey || !targetPort){
			self.nprint(`FATAL: couldn't resolve connection data`)
			throw new Error('Failed to acquire connection data');
		}

		return {
			'port': int(targetPort),
			'key': str(targetKey).trim(),
		}
	}

	async launchServer(self){
		return await ipcRenderer.invoke('kbnc.start');
	}

	async launchClient(self){
		if (self.enabled){
			return false
		}

		self.enabled = true;

		self.nprint('Launching client');

		return new Promise(async function(resolve, reject){
			while (self.enabled){
				try{
					self.nprint('Reconnecting...');
					self.dom.index.current_status.textContent = 'Reconnecting...';

					const [clientConnectedPromise, clientConnectedResolve, clientConnectedReject]
					= ksys.util.flatPromise();

					self.clientConnectedPromise = clientConnectedPromise;
					self.clientConnectedResolve = clientConnectedResolve;
					self.clientConnectedReject = clientConnectedReject;

					const connectionData = await self.readConnectionData();

					self.nprint('Got connection data:', connectionData)

					self.skt = new net.Socket();

					self.skt.on('error', self.clientConnectedResolve);

					self.skt.connect(
						connectionData.port,
						ksys.context.global.cache.vmix_ip,
						async function(){
							self.sktSched = new kbnc.KBNConnectSocketSched(
								self.skt,
								self.msgHandler,
								{
									'onDeath': self.onSchedDeath,
								}
							);

							self.sktSched.readSKTStream();

							self.dom.index.current_status.textContent = 'Auth...';

							const authCMD = await self.sktSched.schedMSGExec({
								'payload': connectionData.key,
								'header': {
									'CMDID': 'auth',
								},
							})

							resolve(
								await authCMD.result()
							);

							self.nprint('Connected to KBNC');

							self.dom.index.current_status.textContent = 'Connected';

							self?.connectionResolve?.();
						}
					)

					await self.clientConnectedPromise;

					self?.connectionReject?.('Connection Ended');

					[self.connectionPromise, self.connectionResolve, self.connectionReject]
					= ksys.util.flatPromise();
				}catch(e){
					self.nwarn(e);
					self?.connectionReject?.(e);
				}

				await ksys.util.sleep(1000);
			}
		})
	}

	async runCMD(self, CMDID, data, onProg=null){
		return await self.sktSched.schedMSGExec({
			'header': {
				'CMDID': CMDID,
				...(data.header || {}),
			},
			'payload': data.payload,
		}, onProg)
	}
}




const m_init = function(){
	currentClient = currentClient || new KBNC();
	if (ksys.context.global.cache.kbnc_client_enabled){
		currentClient.launchClient();
	}

	qsel('kbnc-ctrl')?.replaceWith?.(
		currentClient.dom.root
	)
}


module.exports = {
	KBNC,
	m_init,
}