const cls_pwnage = require('../sys/class_pwnage.js');
const vmix_tcp = require('../sys/vmix_tcp.js');
const kbn_util = require('../kbn/kbn_util.js');
const net = require('net');
const fastq = require('fastq');

try{
	str('fuck');
}catch{
	var str = function(inp){
		try {
			if (inp){
				if (inp.toString){
					return inp.toString()
				}
			}
			return `${inp}`
		}catch{
			return `${inp}`
		}
	}
}



const ConnectionAborted = class extends Error{
	constructor(e){
		super(e);
		this.name = 'ConnectionAborted';
		this.code = 'ERRCONABORT';
		if (Error.captureStackTrace){
			Error.captureStackTrace(this, ConnectionAborted);
		}
	}
}



const consumableBuffer = class{
    constructor(){
		const self = kbn_util.nprint(cls_pwnage.remap(this));

        self.buf = Buffer.alloc(0);
    }

    write(self, data){
        self.buf = Buffer.concat([self.buf, data]);
    }

    clear(self){
    	self.buf = Buffer.alloc(0);
    }

    eraseRead(self, amount){
        const data = self.buf.slice(0, amount);
        self.buf = self.buf.slice(amount);
        return data
    }
}



const KBNConnectMSG = class{
	constructor(sched, MSGData){
		const self = kbn_util.nprint(cls_pwnage.remap(this));

		// The parent schedule
		self.sched = sched;

		// Message data:
		// full header + payload
		self.MSGData = MSGData;

		// Cannot send the same message twice
		self.payloadSent = false;

		// Result promises only make sense if it's an exec type message
		// Response cannot have a response
		if (self.MSGData.header.sys.MSGType == 'exec'){
			// Resolved once this message receives the reply
			[self.resultPromise, self.resultPromiseResolve, self.resultPromiseReject]
			= kbn_util.flatPromise();
		}else{
			[self.resultPromise, self.resultPromiseResolve, self.resultPromiseReject]
			= [null, null, null]
		}

		// Resolved once the message is sent.
		// Both exec/result messages must be sent over the socket
		[self.sendPromise, self.sendResolve, self.sendReject]
		= kbn_util.flatPromise();
	}

	resolveResult(self, resultData){
		if (self.MSGData.header.sys.MSGType == 'result'){
			self.nwarn('Tried setting result data on a result message');
		}
		self.resultPromiseResolve?.(resultData);
	}

	rejectResult(self, errorData){
		self.resultPromiseReject?.(errorData);
	}

	async result(self){
		if (self.MSGData.header.sys.MSGType == 'result'){
			throw new Error(
				'Result messages have no result'
			)
		}

		return await self.resultPromise;
	}

	async send(self){
		if (self.payloadSent){
			throw new Error('The message was already sent');
		}else{
			self.payloadSent = true;
		}

		// const payloadBuf = Buffer.from(self.MSGData.payload || '');
		const payloadBuf = (
			Buffer.isBuffer(self.MSGData.payload) ?
			self.MSGData.payload : Buffer.from(self.MSGData.payload || '')
		)

		self.MSGData.header.sys.payloadLen = payloadBuf.length;

		const headerData = Buffer.from(
			JSON.stringify(self.MSGData.header)
		)

		await self.sched.skt.write(
			kbn_util.toInt32(headerData.length)
		)
		await self.sched.skt.write(headerData);
		await self.sched.skt.write(payloadBuf);

		self.sendResolve();
	}
}



const KBNConnectSocketSched = class{
	/*
		Message header is a JSON, where:
		{
			'sys': {
				// The length of the message's payload
				'payloadLen': 1337,

				// This message's ID
				// exec.4_294_967_295
				// result.4_294_967_295
				'MSGID': 4_294_967_295,

				// Whether it's a request or response
				'MSGType': 'exec',
			},
			'extra': {
				// Optional extra header data
			}
		}

	*/
	constructor(skt, msgExec){
		const self = kbn_util.nprint(cls_pwnage.remap(this));

		// The target socket
		self.skt = skt;

		// Don't do shit when this is false
		self.enabled = true;

		// Stupid shit
		self.sktIter = self.skt[Symbol.asyncIterator]();

		// TCP write sched
		self.MSGOutSched = fastq.promise(self.writeSKTStream, 1);

		// Every single message has an ID assigned to it

		// Commands sent for execution by THIS side,
		// which now await a reply from the OTHER side
		self.MSGDictExec = new Map();
		// Results of the commands executed by THIS side,
		// which must be sent to the OTHER side
		// self.MSGDictResult = new Map();

		// Commands are numbered
		self.lastCMDID = 0;

		// Function (awaited) responsible for executing incoming commands
		// Must return a response payload and optional headerExtras
		self.msgExec = msgExec;

		// TCP reading is bufferized
		self.TCPBufIn = new consumableBuffer();
	}

	// Reject all the pending messages
	// Likely due to a fatal network error
	rejectPending(self){
		for (const [MSGID, msg] of [...self.MSGDictExec.entries()]){
			msg.rejectResult(
				'FATAL: Network collapse of sorts'
			)
			self.MSGDictExec.delete(MSGID);
		}
	}

	async readBytes(self, nBytes){
		while (self.TCPBufIn.buf.length < nBytes){
			const {value, done} = await self.sktIter.next();
			if (done){
				throw new ConnectionAborted(
					'Socket data iterator aborted'
				);
			}

			self.TCPBufIn.write(value);
		}

		return self.TCPBufIn.eraseRead(nBytes);
	}

	async readHeader(self){
		/*
		const headerLen = (await self.readBytes(4)).readUint32LE();
		self.nprint('HeaderLen:', headerLen);
		const headerBytes = await self.readBytes(headerLen);
		self.nprint('headerBytes', str(headerBytes));
		const headerData = JSON.parse(headerBytes);

		return headerData;
		*/

		return JSON.parse(
			await self.readBytes(
				(await self.readBytes(4)).readUint32LE()
			)
		)
	}

	async readSKTStream(self){
		self.nprint('Reading socket stream...');

		while (self.enabled){
			try{
				// Header is always present regardless of context
				const msgHeader = await self.readHeader();
				self.nprint('Read header:', msgHeader);

				// Pull the message ID out of the dictionary for extra safety
				const MSGID = msgHeader.sys.MSGID;

				// Todo: Support streaming for potentially large payloads
				const msgPayload = await self.readBytes(msgHeader.sys.payloadLen || 0);

				if (msgHeader.sys.MSGType == 'exec'){
					(async function(){
						return await self.msgExec({
							'header': msgHeader.extra,
							'payload': msgPayload,
						})
					})()
					.then(function(result){
						self.schedMSGResult(
							MSGID,
							result
						)
					})
					.catch(function(e){
						self.nerr(e);
						self.schedMSGResult(
							MSGID, {},
							str(e)
						)
					})
				}

				if (msgHeader.sys.MSGType == 'result'){
					const targetMSG = self.MSGDictExec.get(MSGID);
					if (targetMSG){
						if (msgHeader.sys.errorData){
							self.MSGDictExec.get(MSGID)?.rejectResult?.(
								msgHeader.sys.errorData
							);
						}else{
							self.MSGDictExec.get(MSGID)?.resolveResult?.({
								'header': msgHeader.extra,
								'payload': msgPayload,
							});
						}
					}
					self.MSGDictExec.delete(MSGID);
				}

			}catch(err){
				self.nprint(err);

				if (err instanceof ConnectionAborted){
					self.nprint('Client disconnect:', err);
					self.rejectPending();
					return
				}
			}
		}
	}

	async writeSKTStream(self, msg){
		await msg.send();
		// self.nprint('Sent', msg.MSGData);
	}

	// Schedule a message to be sent, which contains a result of an executed message
	schedMSGResult(self, MSGID, resultData, errorData=null){
		const msg = new KBNConnectMSG(self, {
			'header': {
				'sys': {
					'MSGID': MSGID,
					'MSGType': 'result',
					'errorData': errorData,
				},
				'extra': resultData.header,
			},
			'payload': resultData.payload,
		})

		// self.MSGDictResult.set(MSGID, msg);
		self.MSGOutSched.push(msg);
	}

	async schedMSGExec(self, MSGData){
		const MSGID = self.lastCMDID++;

		const msg = new KBNConnectMSG(self, {
			'header': {
				'sys': {
					'MSGID': MSGID,
					'MSGType': 'exec',
				},
				'extra': MSGData.header,
			},
			'payload': MSGData.payload,
		})

		self.MSGDictExec.set(MSGID, msg);
		await self.MSGOutSched.push(msg);
		return msg
	}

	async terminate(self){
		self.enabled = false;
		await self.skt.destroy();
		self.rejectPending();
	}
}




const KBNConnectSocketServer = class{
	/*
		//input[contains(@title, 'grandpa2')]/@key
		//input[@title="KBNC_SYS_DATA.gtzip"]/@key
	*/

	/*
		KBNC:
		    - Kick
		    - Boxer
		    - Node
		    - Connect
	*/

	constructor(kbn){
		const self = kbn_util.nprint(cls_pwnage.remap(this));

		// KickBoxerNode instance
		self.kbn = kbn;

		// Connected client socket
		// One client only for now
		self.clientSocketSched = null;

		// TCP server instance
		self.server = null;

		// Whether the connection is maintained or not
		// Needed to avoid running maintenance loop twice
		self.connectionMaintained = false;

		// false means this class will not do shit
		self.enabled = true;

		// Security key
		self.key = kbn_util.rnd_uuid();

		// Because nodejs hasn't got easy to use XML API
		// and 3mb of js code just to bring it back is fucking retarded.
		// Fucking morons
		self.VMIXTCP = new vmix_tcp.TCPSchedAsync(
			'127.0.0.1',
			cls_pwnage.remap,
			kbn_util.nprint,
			kbn_util.flatPromise
		)

		// Launch VMIX TCP
		self.VMIXTCP.startMaintainingConnection();
	}

	async checkPhantomInput(self){
		await self.VMIXTCP.connectionBrokenPromise;
		const result = await self.VMIXTCP.runCmd({
			'Function': 'XMLTEXT',
			'Value':    '//input[@title="KBNC_SYS_DATA.gtzip"]/@key',
		})

		if (result?.payload?.split?.('-')?.length == 5){
			return true
		}else{
			return false
		}
	}

	async ensurePhantomInput(self){
		await self.VMIXTCP.connectionBrokenPromise;

		if (await self.checkPhantomInput()){
			return
		}

		await self.VMIXTCP.runCmd({
			'Function': 'AddInput',
			'Value':    'Title|' + str(self.kbn.APP_ROOT.join('assets', 'KBNC_SYS_DATA.gtzip')),
		})

		// Wait for input to fully appear
		let i = 0;
		while (i < 20){
			i++;

			if (await self.checkPhantomInput()){
				break
			}

			await kbn_util.sleep(700);
		}
	}

	async setConnectionData(self, port){
		await self.ensurePhantomInput();

		await self.VMIXTCP.runCmd({
			'Function':     'SetText',
			'Input':        'KBNC_SYS_DATA.gtzip',
			'SelectedName': '0.Text',
			'Value':        `${self.key}:${port}`,
		})
	}

	async msgInExec(self, MSGData){
		self.nprint('TEST Client Message:', MSGData, [str(MSGData.payload).slice(0, 32)]);

		self.clientSocketSched.schedMSGExec({
			'header': kbn_util.rnd_uuid(),
			'payload': 'SAMPLE',
		});

		// await kbn_util.sleep(15);

		return {
			'header': `R:${MSGData.header}`,
			'payload': kbn_util.rnd_uuid(),
		}
	}

	createClientConnection(self, skt){
		self.clientSocketSched = new KBNConnectSocketSched(
			skt,
			self.msgInExec
		);

		self.clientSocketSched.readSKTStream();

		self.nprint('Client connected');
	}

	maintainConnection(self){
		if (self.connectionMaintained){
			self.nprint('Tried maintaining connection twice in a row');
			return
		}

		self.nprint('Maintaining connection...');

		self.connectionMaintained = true;

		return new Promise(async function(resolve, reject){
			let [serverExistsPromise, serverExistsResolve] = kbn_util.flatPromise();

			while (self.enabled){
				try{
					self.server = net.createServer(
						self.createClientConnection
					);

					self.server.on('error', function(e){
						self.nprint('FATAL: TCP Server ERROR:', e);
						serverExistsResolve();
					})

					self.server.listen(0, '0.0.0.0', async function(){
						const port = self.server.address().port;
						self.nprint('Listening on port', port);
						await self.setConnectionData(port);
						resolve();
					})

					await serverExistsPromise;
					[serverExistsPromise, serverExistsResolve] = kbn_util.flatPromise();
				}catch(e){
					self.nprint(e);
				}
			}
		})
	}

}




module.exports = {
	KBNConnectSocketServer,
}
