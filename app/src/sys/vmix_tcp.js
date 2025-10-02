const net = require('net');
const fastq = require('fastq');


const kbn_util = (
	(process.type == 'browser') ?
	require('../kbn/kbn_util.js') : ksys.util
);

const cls_pwnage = (
	(process.type == 'browser') ?
	require('../sys/class_pwnage.js') : ksys.util.cls_pwnage
)

if (process.type == 'browser'){
	var Path = kbn_util.Path;
}



const str = function(inp=''){
	return (inp?.toString?.() || `${inp}`);
}
const int = parseInt;





const BytesIO = class {
	constructor(initialData) {
		const self = ksys.util.cls_pwnage.remap(this);
		ksys.util.nprint(self, '#64A2FF');

		// Accept initialData as Buffer, string, Uint8Array, or leave empty.
		if (Buffer.isBuffer(initialData)) {
			self._buffer = Buffer.from(initialData); // clone to avoid external mutations
		} else if (typeof initialData === 'string') {
			self._buffer = Buffer.from(initialData);
		} else if (initialData instanceof Uint8Array) {
			self._buffer = Buffer.from(initialData);
		} else {
			self._buffer = Buffer.alloc(0);
		}
		self._pos = 0;
	}

	read(self, n) {
		// If n is undefined or negative, read until the end.
		if (n == null || n < 0) {
			n = self._buffer.length - self._pos;
		}
		if (self._pos >= self._buffer.length) {
			return Buffer.alloc(0);
		}
		let end = self._pos + n;
		if (end > self._buffer.length) {
			end = self._buffer.length;
		}
		const chunk = self._buffer.slice(self._pos, end);
		self._pos = end;
		return chunk;
	}

	write(self, data) {
		let dataBuffer;
		if (Buffer.isBuffer(data)) {
			dataBuffer = data;
		} else if (typeof data === 'string') {
			dataBuffer = Buffer.from(data);
		} else if (data instanceof Uint8Array) {
			dataBuffer = Buffer.from(data);
		} else if (data instanceof self.constructor) {
			dataBuffer = data._buffer;
		} else {
			self.nerr(data);
			throw new Error('Data must be a Buffer, Uint8Array, or string');
		}
		let newPos = self._pos + dataBuffer.length;
		// If new data goes past the current length, extend the buffer.
		if (newPos > self._buffer.length) {
			let newBuffer = Buffer.alloc(newPos);
			self._buffer.copy(newBuffer, 0, 0, self._buffer.length);
			self._buffer = newBuffer;
		}
		// Copy the new data into the buffer at the current position.
		dataBuffer.copy(self._buffer, self._pos);
		self._pos = newPos;
		return dataBuffer.length;
	}

	seek(self, offset, whence=0) {
		let newPos;
		if (whence === 0) { // from beginning
			newPos = offset;
		} else if (whence === 1) { // from current position
			newPos = self._pos + offset;
		} else if (whence === 2) { // from end
			newPos = self._buffer.length + offset;
		} else {
			throw new Error('Invalid value for whence');
		}
		if (newPos < 0) {
			throw new Error('New position is before the beginning of the buffer');
		}
		self._pos = newPos;
		return self._pos;
	}

	tell(self) {
		return self._pos;
	}

	getvalue(self) {
		return self._buffer;
	}

	// Optional: Truncate the buffer to a given size.
	truncate(self, size) {
		if (size == -1){
			self._buffer = Buffer.alloc(0);
			self._pos = 0;
			return
		}

		if (size === undefined) {
			size = self._pos;
		}

		if (size < self._buffer.length) {
			self._buffer = self._buffer.slice(0, size);
		} else if (size > self._buffer.length) {
			let newBuffer = Buffer.alloc(size);
			self._buffer.copy(newBuffer);
			self._buffer = newBuffer;
		}
		if (self._pos > size) {
			self._pos = size;
		}
	}
}


const TCPSched = class{

	// The documentation says the port is fixed
	TCP_API_PORT = 8099;

	LINEBREAK = new Buffer([13, 10]);

	constructor(vmix_ip){
		const self = this;

		// VMIX IP to connect to
		self.VMIXIP = vmix_ip;

		// Pending TCP commands to run, because
		// "Note: Do not send multiple requests without waiting for a response each time."
		//     -C VMIX TCP API documentation
		self.pending = [];

		// Whether the TCP command sched is running.
		// This is a part of the mechanism, which ensures commands are
		// run one by one and a response is awaited each time.
		self.working = false;

		// once .maintainConnection() is run - it continuously tries connecting to
		// VMIX and stalls once connection is established.
		// If this is set to false - next iteration will do nothing and stop trying.
		self.enabled = true;

		// This is a Promise/Resolve for waiting till TCP connection is established
		self.connectionBrokenPromise = null;
		self.connectionBrokenResolve = null;

		// This is a Promise, which becomes unresolved once
		// TCP connection is established and becomes resolved
		// once the TCP connection goes away for whatever reason.
		// Needed for .maintainConnection() to know when to proceed to the
		// next re-connect attempt
		self.connectionExistsPromise = null;
		self.connectionExistsResolve = null;

		// Promise, which becomes resolved once any data is received from
		// the TCP socket (if any)
		self.pendingReceivedDataPromise = null;
		self.pendingReceivedDataResolve = null;

		// Each TCP command execution replaces this with a buffer, which
		// gradually fills up as more and more data comes to it
		self.responseBuf = null;

		// Pre-made text decoder for decoding response buffers into text
		self.UTF8TextDecoder = new TextDecoder('utf-8');
		try{
			self.DOMParser = new DOMParser();
		}catch{
			self.DOMParser = null;
		}
		

		ksys.util.nprint(
			ksys.util.cls_pwnage.remap_adv(this),
			'#FEFF84',
		);
	}

	createConnectionBrokenPromise(self){
		const [promise, resolve] = ksys.util.promise();

		self.connectionBrokenPromise = promise;
		self.connectionBrokenResolve = resolve;
	}

	createPendingReceivedDataPromise(self){
		const [promise, resolve] = ksys.util.promise();

		self.pendingReceivedDataPromise = promise;
		self.pendingReceivedDataResolve = resolve;
	}

	async maintainConnection(self){
		if (!self.TCP_API_PORT || !self.VMIXIP){
			throw new Error(
				`Cannot maintain connection while ip:port is invalid: ${self.TCP_API_PORT}:${self.VMIXIP}`
			);
		}

		while (self.enabled){
			try{
				await self.connectionExistsPromise;

				if (!self.enabled){return};

				const [cepPromise, cepResolve, cepReject] = ksys.util.promise();

				self.connectionExistsPromise = cepPromise;
				self.connectionExistsResolve = cepResolve;

				self.client = new net.Socket();

				self.client.connect(self.TCP_API_PORT, self.VMIXIP, function(){
					self.nprint('Connected to VMIX', self);

					self.connectionBrokenResolve?.();
					// self.createConnectionBrokenPromise();
				})

				self.client.on('data', (data) => {
					self.nprint('Received', data);
					self.treatServerData(data);
				});

				self.client.on('close', () => {
					self.nprint('Connection closed');

					self.createConnectionBrokenPromise();

					self.connectionExistsPromise = null;
					self.connectionExistsResolve?.();
				});

				self.client.on('error', (err) => {
					self.nprint('Connection Errored:', err);
				});

			}catch(err){
				self.nerr('Error while maintaining TCP connection:', err);
			}
		}
	}

	// Because some sync things must be done before running the async
	// .maintainConnection() function
	startMaintainingConnection(self){
		// Sync things in question.
		// Aka .connectionBrokenPromise must be created synchronously before
		// trying to establish the TCP connection
		self.createConnectionBrokenPromise();

		// Begin maintaining the TCP connection
		self.maintainConnection();
	}

	treatServerData(self, data){
		self.nprint('Got abstract server data:', str(data), [str(data)]);
		self.responseBuf?.write?.(data);
		self.pendingReceivedDataResolve?.();
		self.createPendingReceivedDataPromise();
	}

	// Destroy the current connection and stop retrying
	async destroy(self){
		self.enabled = false;
		self.client.destroy();
	}

	// Wait till linebreak appears in self.responseBuf and
	// return its offset starting from the beginning of the buffer
	async awaitFirstLineBreak(self, wait_for_data=true){
		let offs = null;
		// while (!self.LINEBREAK.equals(self.responseBuf.getvalue())){
		// while (self.responseBuf.getvalue().lastIndexOf(self.LINEBREAK) == -1){
		while (true){
			offs = self.responseBuf.getvalue().indexOf(self.LINEBREAK);
			if (offs == -1 && wait_for_data){
				await self.pendingReceivedDataPromise;
				continue
			}
			break
		}

		return offs
	}

	// Await till response buffer becomes of specified size
	async awaitResponseBufSize(self, tgt_size){
		while (self.responseBuf.getvalue().length < tgt_size){
			await self.pendingReceivedDataPromise;
		}
	}

	// Read response of a FUNCTION command
	async readFunctionResponse(self){
		const lineBreakOffset = await self.awaitFirstLineBreak();

		self.nprint('Function response end offset:', lineBreakOffset);

		const result = (
			self.responseBuf
			.getvalue()
			.slice(0, lineBreakOffset)
		)

		self.nprint('Read function response:', str(result));

		return result
	}

	// Read response of the XML command
	async readFullProjectXMLResponse(self){
		// Wait for >XML 1337\r\n<
		const responseHeader = await self.readFunctionResponse();

		// byte length of the XML payload
		const payloadLen = int(
			str(responseHeader.slice(4))
		)

		self.nprint(
			'Full project XML response header:', `>${str(responseHeader)}<`,
			'XML payload len:', `>${str(payloadLen)}<`
		);

		// Wait till the response buffer is of required length
		await self.awaitResponseBufSize(payloadLen + responseHeader.length);

		// Slice out the header
		const result = self.responseBuf.getvalue().slice(responseHeader.length);

		self.nprint('Full project XML result:', str(result));

		if (self.DOMParser){
			return self.DOMParser.parseFromString(
				self.UTF8TextDecoder.decode(result),
				'application/xml'
			)
		}else{
			return self.UTF8TextDecoder.decode(result)
		}
	}

	// XPATH result: >XMLTEXT OK Single Д Line Only Д<
	// XPATH result: >XMLTEXT 75<
	// XPATH result: >XMLTEXT ER XML Entry Not Found<
	// Read response of the XMLTEXT command
	async readXPATH(self){
		const responseHeaderBytes = await self.readFunctionResponse();
		const responseHeader = self.UTF8TextDecoder.decode(
			responseHeaderBytes
		)

		self.nprint('KCAS response header:', `>${responseHeader}<`);

		const headerSplit = responseHeader.split(' ');
		const status = headerSplit[1];

		self.nprint('KCAS response status:', `>${status}<`);

		let result = null;

		// This means return value is single line and header is the return value
		if (['OK', 'ER'].includes(status?.trim?.())){
			result = headerSplit.slice(2).join(' ');
		}

		if (!result){
			try{
				const payloadLen = int(status);
				if (payloadLen <= 0){
					self.nwarn(
						'XMLTEXT return a payload type response with 0 length:',
						payloadLen
					)

					throw new Error('0 length XMLTEXT response payload')
				}

				// Wait for buffer to fill
				await self.awaitResponseBufSize(
					payloadLen + responseHeaderBytes.length
				)

				const responseBuf = self.responseBuf.getvalue();

				// Result is always text, BUT NOT ALWAYS a valid XML, because
				// it's possible to retrieve text content of a node, which is not
				// a valid XML
				result = self.UTF8TextDecoder.decode(
					// Slice out trailing and leading >\r\n<
					responseBuf.slice(
						responseHeaderBytes.length + 2,
						responseBuf.length - 2
					)
				)
			}catch (err){
				self.nwarn(
					'Failed to recognize XMLTEXT response type:',
					responseHeader
				);
			}
		}

		return result
	}

	// Run pending TCP commands
	async resolvePending(self){
		if (self.working){
			self.nwarn('Tried running CMD resolve loop twice', self);
			return
		}

		try{
			self.working = true;

			while (self.pending.length){
				const item = self.pending.shift();
				self.nprint('Popped', item, self);
				const result = await self.treatCMD(item.data);
				self.nprint('Got result of', item, 'which is', result, self);

				self.nprint('Returning result...', self)

				item.resolve(
					result
				)

				self.nprint('Done with', item, self);
			}
		}catch(err){
			self.nerr(err);
		}finally{
			self.working = false;
		}
	}

	// Run a single TCP command
	async treatCMD(self, data){
		self.nprint('Treating', data, self);

		// self.createPendingReceivedDataPromise();
		self.responseBuf = new BytesIO();

		self.client.write(data);

		let result = null;

		if (data == 'XML\r\n'){
			result = await self.readFullProjectXMLResponse();
		}else if(data.startsWith('XMLTEXT')){
			result = await self.readXPATH();
		}else{
			result = await self.readFunctionResponse();
		}

		self.nprint('CMD response result:', result, self);

		return result
	}

	// Schedule a single TCP command
	async runCmd(self, data){
		self.nprint('Scheduling', data);
		const [promise, resolve, reject] = ksys.util.promise();

		const fname = data['Function'];
		delete data['Function'];

		let payload = `FUNCTION ${fname} ${vmix.talker.create_url(data, false, false)}\r\n`;

		if (fname == 'XML'){
			payload = 'XML\r\n';
		}

		if (fname == 'XMLTEXT'){
			payload = `XMLTEXT ${data.Value}\r\n`;
		}

		self.nprint('Constructed payload:', payload);

		self.pending.push({
			'data': payload,
			'resolve': resolve,
		})

		if (!self.working){
			self.resolvePending();
		}

		self.nprint('DONE Scheduling', payload);

		return promise
	}
}



const TCPSchedActivators = class extends TCPSched{
	constructor(vmix_ip){
		super(vmix_ip);
	}

	// Read response of a FUNCTION command
	async readFunctionResponse(self){
		const result = [];

		while (true){
			const lineBreakOffset = await self.awaitFirstLineBreak(false);

			if (lineBreakOffset == -1){
				break
			}

			self.nprint('Function response end offset:', lineBreakOffset);

			result.push(
				self.responseBuf
				.getvalue()
				.slice(0, lineBreakOffset)
			)

			const buf = Buffer.copyBytesFrom(self.responseBuf.getvalue());

			self.responseBuf.truncate(-1);

			self.responseBuf.write(
				buf.slice(lineBreakOffset + 2)
			)
		}

		self.nprint('Read function response:', result);

		return result
	}

	async watchEventStream(self){
		self.responseBuf = new BytesIO();
		self.createPendingReceivedDataPromise();
		while (true){
			await self.awaitFirstLineBreak(true);
			for (const responseHeader of (await self.readFunctionResponse())){
				// const responseHeader = await self.readFunctionResponse();
				self.nprint('ACT stream message:', str(responseHeader))
			}
			self.responseBuf = new BytesIO();
		}
	}

	async start(self){
		self.client.write('SUBSCRIBE ACTS\r\n');
		self.responseBuf = new BytesIO();
	}

	async runCmd(self, data){
		self.nwarn(`This doesn't support arbitrary commands`);
	}

	async treatCMD(self, data){
		self.nwarn('Tried treating a CMD where it cannot be treated');
	}

	async resolvePending(self){
		self.nwarn(`This cannot resolve any pending commands`)
	}
}



const consumableBuffer = class{
    constructor(){
		const self = kbn_util.nprint(
			cls_pwnage.remap(this),
			'#FEFF84',
		);

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


const TCPSchedAsync = class{
	TCP_API_PORT = 8099;
	LINEBREAK = new Buffer([13, 10]);

	HANG_TIMEOUT_DUR = 3000;

	DO_PAUSE = false;

	static NPRINT_LEVEL = 5;

	constructor(vmix_ip, pwn, nprint, flatPromise){
		// const self = ksys.util.nprint(
		// 	ksys.util.cls_pwnage.remap(this),
		// 	'#FEFF84',
		// );

		const self = (pwn || ksys.util.cls_pwnage.remap)(this);
		(nprint || ksys.util.nprint)(self);

		self.VMIXIP = vmix_ip;

		self.flatPromise = (flatPromise || ksys.util.promise);

		// Raw stream buffer sent by VMIX
		self.TCPBufIn = new consumableBuffer(pwn, nprint);

		// Pending outcoming TCP commands
		self.pendingCommands = [];

		// Response from VMIX, which is everything except ACTS:
		// >FUNCTION OK Completed\r\n<
		self.lastCommandResponsePromise = null;
		self.lastCommandResponseResolve = null;
		self.lastCommandHeader = null;

		// Callback for activators subscription
		self.activatorsCallback = null;

		// When this is false - the class tries to not do anything, such as
		// reconnecting to TCP API, executing callbacks and so on.
		self.enabled = false;

		// Commands are executed in a sync manner.
		// This indicates whether execution schedule is running
		self.working = false;

		// This is a Promise/Resolve for waiting till TCP connection is established.
		// .connectionBrokenPromise becomes resolved once connection is established.
		self.connectionBrokenPromise = null;
		self.connectionBrokenResolve = null;

		// This is a Promise, which becomes unresolved once
		// TCP connection is established and becomes resolved
		// once the TCP connection goes away for whatever reason.
		// Needed for .maintainConnection() to know when to proceed to the
		// next re-connect attempt
		self.connectionExistsPromise = null;
		self.connectionExistsResolve = null;

		self.hangTimeout = null;


		self.UTF8TextDecoder = new TextDecoder('utf-8');
		// self.DOMParser = new DOMParser();

		self.awaitingPayload = -1;
	}

	createConnectionBrokenPromise(self){
		const [promise, resolve] = self.flatPromise();

		self.connectionBrokenPromise = promise;
		self.connectionBrokenResolve = resolve;
	}

	createLastCommandResponsePromise(self){
		const [promise, resolve] = self.flatPromise();

		self.lastCommandResponsePromise = promise;
		self.lastCommandResponseResolve = resolve;
	}

	async maintainConnection(self){
		if (!self.TCP_API_PORT || !self.VMIXIP){
			throw new Error(
				`Cannot maintain connection while ip:port is invalid: ${self.TCP_API_PORT}:${self.VMIXIP}`
			);
		}

		while (self.enabled){
			try{
				await self.connectionExistsPromise;

				if (!self.enabled){return};

				const [cepPromise, cepResolve, cepReject] = self.flatPromise();

				self.connectionExistsPromise = cepPromise;
				self.connectionExistsResolve = cepResolve;

				self.client = new net.Socket();

				self.client.connect(self.TCP_API_PORT, self.VMIXIP, function(){
					self.nprintL(10, 'Connected to VMIX', self);
					self.connectionBrokenResolve?.();
				})

				self.client.on('data', (data) => {
					self.nprintL(1, 'Received', data);

					if (self.DO_PAUSE){
						self.client.pause();
						self.treatServerData(data);
						self.client.resume();
					}else{
						self.treatServerData(data);
					}
				});

				self.client.on('close', () => {
					self.nprintL(10, 'Connection closed');

					clearTimeout(self.hangTimeout);

					self.lastCommandResponseResolve?.({
						'header':  null,
						'payload': null,
					});

					self.createConnectionBrokenPromise();

					self.connectionExistsPromise = null;
					self.connectionExistsResolve?.();
				});

				self.client.on('error', (err) => {
					self.nprintL(10, 'Connection Errored:', err);
				});

				await kbn_util.sleep(1500);
			}catch(err){
				self.nerr('Error while maintaining TCP connection:', err);
				await kbn_util.sleep(1500);
			}
		}
	}

	startMaintainingConnection(self){
		// Sync things in question.
		// Aka .connectionBrokenPromise must be created synchronously before
		// trying to establish the TCP connection
		self.createConnectionBrokenPromise();

		self.enabled = true;

		// Begin maintaining the TCP connection
		self.maintainConnection();
	}

	async destroy(self){
		self.enabled = false;
		self.client?.destroy?.();
	}

	treatServerData(self, data){
		if (!self.enabled){
			self.nwarn('Tried trating server data on a disabled schedule', self);
			return
		};

		self.nprintL(1, 'Got data chunk from VMIX:', [str(data)], self);

		self.TCPBufIn.write(data);

		while (self.TCPBufIn.buf.length){
			if ((self.awaitingPayload != -1) && (self.TCPBufIn.buf.length >= self.awaitingPayload)){
				self.nprintL(1,
					'GOT PAYLOAD of size', self.awaitingPayload,
					'---',
					'Current buf size is:', self.TCPBufIn.buf.length
				)

				self.lastCommandResponseResolve({
					'header': self.lastCommandHeader,
					'payload': self.TCPBufIn.eraseRead(self.awaitingPayload - 2),
				})

				// Erase \r\n
				self.TCPBufIn.eraseRead(2);

				self.lastCommandHeader = null;

				self.awaitingPayload = -1;
				continue
			}

			if ((self.awaitingPayload != -1) && (self.TCPBufIn.buf.length <= self.awaitingPayload)){
				self.nprintL(1,
					'AWAITING payload of size', self.awaitingPayload,
					'---',
					'Current buf size is:', self.TCPBufIn.buf.length
				)
				break
			}

			const offs = self.TCPBufIn.buf.indexOf(self.LINEBREAK);
			if (offs == -1){break};

			// Header is always UTF-8 text
			const headerData = self.UTF8TextDecoder.decode(
				self.TCPBufIn.eraseRead(offs)
			)

			// Erase trailing \r\n
			self.TCPBufIn.eraseRead(2);

			self.nprintL(1, 'Header data:', headerData);

			const funcName = headerData.split(' ')[0];

			self.nprintL(1, 'Response function name:', funcName, self);

			if (funcName == 'ACTS'){
				self.nprintL(1, 'Got ACT:', headerData);
				if (self.enabled){
					self.activatorsCallback?.(headerData);
				}
				continue
			}

			if (funcName == 'FUNCTION'){
				self.lastCommandResponseResolve({
					'header': headerData,
					'payload': null,
				})
				continue
			}

			if (funcName == 'VERSION'){
				self.nprintL(10, 'Got connection confirmation from VMIX:', headerData);
				continue
			}

			if (funcName == 'XML'){
				const payloadLen = int(headerData.split(' ')[1]);
				self.nprintL(1, 'XML payload len:', payloadLen);
				self.lastCommandHeader = headerData.split(' ')[0];
				self.awaitingPayload = payloadLen;
				continue
			}

			if (funcName == 'XMLTEXT'){
				const status = headerData.split(' ')[1];

				if (status == 'OK'){
					self.lastCommandResponseResolve({
						'header': headerData,
						'payload': headerData.split(' ').slice(2).join(' '),
					})
					continue
				}else{
					let payloadLen = null;

					try{
						payloadLen = int(status);
					}catch{};

					if (!payloadLen){
						self.nprintL(1,
							'XMLTEXT response is NOT OK and is NOT a number:', headerData
						);
						self.lastCommandResponseResolve({
							'header': headerData,
							'payload': headerData.split(' ').slice(2).join(' '),
						})
						continue
					}

					self.lastCommandHeader = headerData.slice(2).join(' ');
					self.awaitingPayload = payloadLen;
					self.nprintL(1,
						'XMLTEXT payload: Setting payload await size to', self.awaitingPayload
					);
					continue
				}
			}

			if (funcName == 'SUBSCRIBE'){
				self.lastCommandResponseResolve({
					'header': headerData,
					'payload': null,
				})
				continue
			}

			self.nprintL(5, 'Unknown response type:', funcName)
		}
	}

	// Run pending TCP commands
	async resolvePending(self){
		if (self.working){
			self.nwarn(
				'Tried running .resolvePending() while',
				'another instance of .resolvePending() is still running',
				self
			);
			return
		}

		try{
			self.working = true;

			while (self.pendingCommands.length){
				const item = self.pendingCommands.shift();
				self.nprintL(1, 'Popped', item, self);

				self.hangTimeout = setTimeout(function(){
					self.nerr('Hang detected', self);
					self.lastCommandResponseResolve({
						'header':  null,
						'payload': null,
					});
				}, self.HANG_TIMEOUT_DUR)

				const result = await self.treatCMD(item.data);
				self.nprintL(1, 'Got result of', item, 'which is', result, self);

				item.resolve(
					result
				)

				clearTimeout(self.hangTimeout);

				self.nprintL(1, 'Done with', item, self);
			}
		}catch(err){
			self.nerr(err);
		}finally{
			self.working = false;
		}
	}

	// Run a single TCP command
	async treatCMD(self, data){
		self.nprintL(1, 'Treating', data, self);

		if (!self.enabled){
			self.nprint(
				'Treating CMD of a disabled TCP Sched.',
				'Returning NULL immediately'
			);
			return null
		}

		self.createLastCommandResponsePromise();

		self.client.write(data);

		const result = await self.lastCommandResponsePromise;

		self.nprintL(1,
			'--RESULT OF--', [data],
			'--IS--', result, [str(result.payload)]
		);

		return result
	}

	// Schedule a single TCP command
	async runCmd(self, data){
		if (!self.enabled){
			const msg = 'Cannot run commands on a destroyed schedule';
			self.nerr(msg, self);
			throw new Error(msg);
		}

		self.nprintL(1, 'Scheduling', data);
		const [promise, resolve, reject] = self.flatPromise();

		const fname = data['Function'];
		delete data['Function'];

		// let payload = `FUNCTION ${fname} ${vmix.talker.create_url(data, false, false)}\r\n`;
		let payload = `FUNCTION ${fname} ${new URLSearchParams(data || {}).toString()}\r\n`;

		if (fname == 'XML'){
			payload = 'XML\r\n';
		}

		if (fname == 'XMLTEXT'){
			payload = `XMLTEXT ${data.Value}\r\n`;
		}

		if (fname == 'SUBSCRIBE ACTS'){
			payload = `SUBSCRIBE ACTS\r\n`;
		}

		self.nprintL(1, 'Constructed payload:', [payload]);

		self.pendingCommands.push({
			'data': payload,
			'resolve': resolve,
		})

		if (!self.working){
			self.resolvePending();
		}

		self.nprintL(1, 'DONE Scheduling', [payload]);

		return promise
	}
}










// ===================================
//          Top Tier Rewrite
// ===================================
const DEBUG_NPRINT_LVL = 7;


const ConnectionAborted = class extends Error{
	constructor(e){
		super(e);
		this.name = 'ConnectionAborted';
		this.code = 'KB_ERRCONABORT';
		if (Error.captureStackTrace){
			Error.captureStackTrace(this, ConnectionAborted);
		}
	}
}



const UnexpectedResponse = class extends Error{
	constructor(e){
		super(e);
		this.name = 'UnexpectedResponse';
		this.code = 'KB_ERRUNEXPECTEDRESPONSE';
		if (Error.captureStackTrace){
			Error.captureStackTrace(this, ConnectionAborted);
		}
	}
}



const FatalIntegrityError = class extends Error{
	constructor(e){
		super(e);
		this.name = 'FatalIntegrityError';
		this.code = 'KB_ERRFATALINTEGRITY';
		if (Error.captureStackTrace){
			Error.captureStackTrace(this, ConnectionAborted);
		}
	}
}



const VMIXTCPCMDInstance = class{
	static NPRINT_LEVEL = DEBUG_NPRINT_LVL;

	constructor(VMIXTCP, cmdName, cmdArgs=null){
		const self = kbn_util.nprint(
			cls_pwnage.remap(this),
			'#46F4EE',
		);

		// Validate function syntax
		const isInvalid = (
			// Whitespaces are critical and only ONE command
			// has 2 of them
			(((str(cmdName || '').split(' ').length || 1) - 1) > 0)
			&& (cmdName != 'SUBSCRIBE ACTS')
		)
		if (isInvalid){
			throw new Error(
				`Invalid command syntax: ${cmdName} ${cmdArgs}`
			)
		}

		self.VMIXTCP = VMIXTCP;
		self.cmdName = cmdName;
		self.cmdArgs = cmdArgs;

		// Cannot send the same command twice
		self.CMDSent = false;

		// Resolved once the command was fully executed
		[self.donePromise, self.doneResolve, self.doneReject]
		= kbn_util.flatPromise();

		// Resolved once the command was fully executed
		[self.sendPromise, self.sendResolve, self.sendReject]
		= kbn_util.flatPromise();
	}

	async _readResponse(self, headerData){
		await self.sendPromise;

		self.nprintL(0, 'Reading response...');

		if (!self.CMDSent){
			const msg = 'Tried reading CMD result before it was sent';
			self.doneReject(
				new FatalIntegrityError(msg)
			);
			throw new FatalIntegrityError(msg);
		}

		const headerParts = headerData.split(' ');
		const responseCmdName = headerParts.shift();
		const responseCmdStatus = headerParts.shift();

		// ER seems to always mean there was an error.
		// VMIX Error that is...
		// aka 0 fucks given
		if (responseCmdStatus == 'ER'){
			self.doneResolve({
				'VMIXOK': false,
				'payload': headerParts.join(' '),
			})
			return
		}

		// If there's no payload to read - header IS the payload
		const headerIsPayload = (
			(['FUNCTION', 'SUBSCRIBE'].includes(responseCmdName)) || (
				// The FUCKING XMLTEXT SHIT only SOMETIMES has payload len in it...
				// These times being when payload contains line breaks...
				// You FUCKING TWATS
				(responseCmdName == 'XMLTEXT')
				&& responseCmdStatus == 'OK'
			)
		)
		if (headerIsPayload){
			self.doneResolve({
				'VMIXOK': true,
				'payload': headerParts.join(' '),
			})
			return
		}

		// OTHERWISE - status HAS TO BE the payload length
		let payloadLen = null;
		try{
			// So, try evaluating it into an integer...
			// It wouldn't have been too big of a surprise if
			// payload len was a fucking float.
			// Cunts.
			payloadLen = int(responseCmdStatus);
		}catch{}

		if (!(payloadLen > 0)){
			const msg = [
				`The response to this CMD (${self.cmdName})`,
				`was supposed to have payload length in it`,
				str(headerData)
			]

			self.doneReject(new FatalIntegrityError(
				msg.join(' ')
			))

			throw new FatalIntegrityError(
				msg.join(' ')
			)
		}

		// Now read the payload.
		// Payload len DOES include \r\n
		const payloadBuf = await self.VMIXTCP.readBytes(payloadLen - 2);
		// Read leading \r\n into the void
		// Yes, payloads with data len still have leading \r\n
		await self.VMIXTCP.readBytes(2);

		self.doneResolve({
			'VMIXOK': true,
			// todo: It DOES SEEM like VMIX ONLY ever returns utf-8 data,
			// but it's impossible to be sure with these fucking morons.
			// 'payload': payloadBuf,
			'payload': self.VMIXTCP.UTF8TextDecoder.decode(
				payloadBuf
			),
		})
	}

	async *__readResponse(self, headerData){
		await self.sendPromise;

		self.nprintL(0, 'Reading response...');

		if (!self.CMDSent){
			const msg = 'Tried reading CMD result before it was sent';
			self.doneReject(
				new FatalIntegrityError(msg)
			);
			throw new FatalIntegrityError(msg);
		}

		const headerParts = headerData.split(' ');
		const responseCmdName = headerParts.shift();
		const responseCmdStatus = headerParts.shift();

		// ER seems to always mean there was an error.
		// VMIX Error that is...
		// aka 0 fucks given
		if (responseCmdStatus == 'ER'){
			self.doneResolve({
				'VMIXOK': false,
				'payload': headerParts.join(' '),
			})
			return
		}

		// If there's no payload to read - header IS the payload
		const headerIsPayload = (
			(['FUNCTION', 'SUBSCRIBE'].includes(responseCmdName)) || (
				// The FUCKING XMLTEXT SHIT only SOMETIMES has payload len in it...
				// These times being when payload contains line breaks...
				// You FUCKING TWATS
				(responseCmdName == 'XMLTEXT')
				&& (responseCmdStatus == 'OK')
			)
		)
		if (headerIsPayload){
			self.doneResolve({
				'VMIXOK': true,
				'payload': headerParts.join(' '),
			})
			return
		}

		// OTHERWISE - status HAS TO BE the payload length.
		// So, try evaluating it into an integer...
		// It wouldn't have been too big of a surprise if
		// payload len was a fucking float.
		// Cunts.
		const payloadLen = int(responseCmdStatus);

		// It HAS to evaluate into a valid integer
		if (!Number.isInteger(payloadLen)){
			const msg = [
				`The response to this CMD (${self.cmdName} -> ${responseCmdName})`,
				`was supposed to have payload length in it`,
				str(headerData)
			]
			self.doneReject(new FatalIntegrityError(
				msg.join(' ')
			))
			throw new FatalIntegrityError(
				msg.join(' ')
			)
		}

		let payloadBuf = null;

		while (true){
			payloadBuf = await self.VMIXTCP.readHeader(false);
			if (payloadBuf.indexOf('ACTS ') == 0){
				self.nprintL(0, 'Intermediate fucking ACTS shit:', [str(payloadBuf)]);
				await self.VMIXTCP.readBytes(2);
				yield payloadBuf;
				payloadBuf = null;
			}else{
				break
			}
		}

		payloadBuf = Buffer.concat([
			Buffer.from(payloadBuf || ''),
			await self.VMIXTCP.readBytes(
				(payloadLen - (Buffer.byteLength(payloadBuf || ''))) - 2
			),
		]);

		self.nprintL(0, 'Got payload buf:', payloadBuf);

		await self.VMIXTCP.readBytes(2);

		self.nprintL(0, 'Truncated leading 2 bytes of payload');

		self.doneResolve({
			'VMIXOK': true,
			// todo: It DOES SEEM like VMIX ONLY ever returns utf-8 data,
			// but it's impossible to be sure with these fucking morons.
			// 'payload': payloadBuf,
			'payload': self.VMIXTCP.UTF8TextDecoder.decode(
				payloadBuf
			),
		})
	}

	async *readResponse(self, headerData){
		await self.sendPromise;

		self.nprintL(0, 'Reading response...');

		if (!self.CMDSent){
			const msg = 'Tried reading CMD result before it was sent';
			self.doneReject(
				new FatalIntegrityError(msg)
			);
			throw new FatalIntegrityError(msg);
		}

		const headerParts = headerData.split(' ');
		const responseCmdName = headerParts.shift();
		const responseCmdStatus = headerParts.shift();

		// ER seems to always mean there was an error.
		// VMIX Error that is...
		// aka 0 fucks given
		if (responseCmdStatus == 'ER'){
			self.doneResolve({
				'VMIXOK': false,
				'payload': headerParts.join(' '),
			})
			return
		}

		// OK means there was no error AND header IS the payload
		if (responseCmdStatus == 'OK'){
			self.doneResolve({
				'VMIXOK': true,
				'payload': headerParts.join(' '),
			})
			return
		}

		// OTHERWISE - status HAS TO BE the payload length.
		// So, try evaluating it into an integer...
		// It wouldn't have been too big of a surprise if
		// payload len was a fucking float.
		// Cunts.
		const payloadLen = int(responseCmdStatus);

		// It HAS to evaluate into a valid integer
		if (!Number.isInteger(payloadLen)){
			const msg = [
				`A valid payload len was expected for the result`,
				`of this (${self.cmdName} -> ${responseCmdName}) command.`,
				`The following header data produced some weird unexpected fucking shit:`,
				str(headerData),
			].join(' ')

			self.doneReject(new UnexpectedResponse(msg));
			throw new UnexpectedResponse(msg);
		}

		// Now listen here you stupid TWATS:
		/*
			XML 41
			ACTS OK MasterVolume 0.4304672
			<vmix><version>28.0.0.42</version></vmix>
		*/
		// Will be punishable by death when I come to power


		// VMIX can send activators in-between payload headers and payload content.
		// Try reading a header (which activators are) and see if the result
		// starts with 'ACTS '. If it does - fuck you muppets.
		// If it DOESN'T - that's a chunk of a payload.

		let payloadBuf = null;

		while (true){
			payloadBuf = await self.VMIXTCP.readHeader(false);

			// Not an activator - stop trying reading them
			if (payloadBuf.indexOf('ACTS ') != 0){
				break
			}

			self.nprintL(0, 'Intermediate fucking ACTS shit:', [str(payloadBuf)]);
			// Erase \r\n
			await self.VMIXTCP.readBytes(2);
			yield payloadBuf;
			payloadBuf = null;
		}

		// At this point - payloadBuf is either nothing OR
		// a chunk of the awaited payload AND it SEEMS
		// to be safe to read any remaining payload data
		// without worrying about it being something other than the
		// awaited payload.

		// Take the current payloadBuf and add any remaining payload
		// data to it.
		payloadBuf = Buffer.concat([
			Buffer.from(payloadBuf || ''),
			await self.VMIXTCP.readBytes(
				(payloadLen - (Buffer.byteLength(payloadBuf || ''))) - 2
			),
		]);

		self.nprintL(0, 'Got payload buf:', payloadBuf);

		// EVEN payloads with data len specified have trailing \r\n
		// Erase this useless fucking shit
		await self.VMIXTCP.readBytes(2);

		self.nprintL(0, 'Truncated leading 2 bytes of payload');

		self.doneResolve({
			'VMIXOK': true,
			// todo: It DOES SEEM like VMIX ONLY ever returns utf-8 data,
			// but it's impossible to be sure with these fucking morons.
			// 'payload': payloadBuf,
			'payload': self.VMIXTCP.UTF8TextDecoder.decode(
				payloadBuf
			),
		})
	}

	async send(self){
		if (self.CMDSent){
			throw new FatalIntegrityError(
				'Tried sending the same CMD twice'
			)
		}

		let payload = null;

		if (self.cmdName == 'XML'){
			payload = ['XML'];
		}
		if (self.cmdName == 'XMLTEXT'){
			payload = ['XMLTEXT', str(self.cmdArgs || ' ')];
		}
		if (self.cmdName == 'SUBSCRIBE ACTS'){
			payload = ['SUBSCRIBE ACTS'];
		}
		if (!payload){
			payload = [
				'FUNCTION',
				str(self.cmdName),
				str(new URLSearchParams(self.cmdArgs || {})),
			]
		}

		self.nprintL(0, 'Constructed payload:', payload);

		// Send the payload
		await self.VMIXTCP.writeBytes(
			Buffer.from(payload.join(' ') + '\r\n')
		)

		// Mark this command as sent
		self.CMDSent = true;

		self.sendResolve(true);

		self.nprintL(0, 'CMD Sent');
	}

	async result(self){
		return await self.donePromise;
	}

	abort(self){
		self.doneReject(new Error(
			'Command aborted'
		))
		self.sendReject(new Error(
			'Command aborted'
		));
	}
}



const VMIXTCP = class{
	// important todo:
	// Command retries?

	// VMIX docs say port is always fixed.
	// Morons?
	TCP_API_PORT = 8099;

	// Whether to try reconnecting automatically
	AUTO_RECONNECT = true;

	// Delay between automatic reconnection retries
	AUTO_RECONNECT_INTERVAL = 750;

	// \r\n in a form of a buffer.
	// Electron's buffers have .indexOf() function:
	//     It accepts another buffer as an input and searches for the offset
	//     of the first occurence of the provided sequence
	LINEBREAK = Buffer.from([13, 10]);

	// Log level. Low numbers will result in a lot of spam in the console
	static NPRINT_LEVEL = DEBUG_NPRINT_LVL;

	constructor(VMIXIP, callbacks=null){
		const self = kbn_util.nprint(
			cls_pwnage.remap(this),
			'#46F4EE',
		);

		// IPV4 of the machine VMIX runs on
		self.VMIXIP = VMIXIP;

		// Callback functions, such as when the connection dies
		self.callbacks = callbacks || {};

		// Don't do shit when this is false
		self.enabled = true;

		// The TCP socket object the communication is done through
		self.skt = null;

		/*
			Stupid shit:
			The only way to get
			    import socket
			    with socket.socket() as skt:
			        skt.connect(('127.0.0.1', 8099))
			        while True:
			            data = skt.recv(1024)
			            print('Received:', len(data))

			in Javascript is:
			    const sktIter = skt[Symbol.asyncIterator]();
			    while (true){
			        const {value, done} = await sktIter.next();
			        console.log('Received:', value);
			    }
		*/
		// self.sktIter = self.skt[Symbol.asyncIterator]();
		self.sktIter = null;

		// Read/Write is strictly sequential.
		// Except when incoming data begins with "ACTS".
		// So it's either a response to the previously executed command
		// OR a random activator, which must be read and NOT treated as a
		// response to the previously executed command
		self.MSGOutSched = fastq.promise(self.writeSKTStream, 1);

		// TCP socket reading is buffered
		self.TCPBufIn = new consumableBuffer();

		// Whether the connection is being maintained.
		// Cannot maintain connection multiple times in a row.
		self.connectionMaintained = false;

		// Whether there's an active connection
		self.connected = false;

		// Currently executing command
		self.currentCMD = null;

		// Pretty much all data sent by VMIX is UTF-8 text
		self.UTF8TextDecoder = new TextDecoder('utf-8');

		// Resolved once connection is established
		[self.connectionPromise, self.connectionResolve, self.connectionReject]
		= kbn_util.flatPromise();

		// self.debug = new consumableBuffer();
	}

	runCallback(self, callbackID, onlyOnce=true, ...callbackArgs){
		const callbackFunction = self.callbacks[callbackID];

		// Some callbacks must only be ran once
		if (onlyOnce){
			self.callbacks[callbackID] = null;
		}

		// Everybody who says this is anti-pattern are welcome to go kill themselves.
		return new Promise(async function(resolve, reject){
			try{
				await callbackFunction?.(...callbackArgs);
			}catch(e){
				throw e;
			}finally{
				resolve();
			}
		})
	}

	// Send bytes to the other side via self.skt
	// Does a bunch of extra shit as opposed to self.skt.write,
	// which, naturally, IS A FUCKING INDECISIVE TWAT
	writeBytes(self, tgtBuf){
		if (tgtBuf.length <= 0){
			return
		}

		return new Promise(function(resolve, reject){
			const sktInternalBufOk = self.skt.write(tgtBuf, 'utf8', function(err){
				if (err){
					reject(err);
				}else{
					resolve(sktInternalBufOk);
				}
			});
		})
	}

	// Read from self.skt into self.TCPBufIn until it becomes
	// longer than or equal to the amount of bytes requested
	async readBytes(self, nBytes){
		self.nprintL(0, 'Trying to read', nBytes, 'bytes');
		if (nBytes <= 0){
			return Buffer.alloc(0);
		}

		while (self.TCPBufIn.buf.length < nBytes){
			// Await data from the socket
			const {value, done} = await self.sktIter.next();

			// This SUPPOSEDLY means no more data will ever be received
			if (done){
				throw new ConnectionAborted(
					'Socket data iterator aborted'
				);
			}

			self.TCPBufIn.write(value);

			// self.debug.write(value);
		}

		return self.TCPBufIn.eraseRead(nBytes);
	}

	// Header data always ends with \r\n
	// Read till \r\n is encountered and return the result
	// (Returned result is a decoded utf-8 string WITHOUT leading \r\n)
	async readHeader(self, eraseLeading=true, asBuf=false){
		while (true){
			// Search for linebreak in the buffer
			const linebreakOffs = self.TCPBufIn.buf.indexOf(self.LINEBREAK);
			if (linebreakOffs != -1){
				// Read the header data
				const headerData = self.TCPBufIn.eraseRead(linebreakOffs);

				if (eraseLeading){
					// Erase trailing \r\n
					self.TCPBufIn.eraseRead(2);
				}

				if (asBuf){
					return headerData
				}else{
					return self.UTF8TextDecoder.decode(headerData);
				}
			}

			// Await data from the socket
			const {value, done} = await self.sktIter.next();

			// This SUPPOSEDLY means no more data will ever be received
			if (done){
				throw new ConnectionAborted(
					'Socket data iterator aborted'
				);
			}

			// self.debug.write(value);

			// Buffer resulting data
			self.TCPBufIn.write(value);
		}
	}

	SKTCloseEvent(self){
		self.nwarnL(10, 'Connection closed');
	}

	async activatorEvent(self, headerData){
		const status = headerData.slice(0, 3).trim();
		const activatorData = headerData.slice(3).trim();

		if (status != 'OK'){
			self.nwarnL(1, 'Activator status is NOT OK:', headerData);
			return
		}

		try{
			await self?.activatorsCallback?.(activatorData);
		}catch(e){
			self.nerr(e);
		}
	}

	rejectPendingCommands(self){
		const commands = self.MSGOutSched.getQueue();
		self.MSGOutSched.kill();
		self.currentCMD = null;
		for (const cmd of commands){
			try{cmd.abort()}catch{};
		}
	}

	permaDeathEvent(self, reason=null){
		self.nwarnL(3, 'Perma death, because:', reason);
		// Don't try reconnecting or do any other shit anymore
		self.enabled = false;
		// Destroy the underlying TCP socket
		self.skt?.destroy?.();
		// No longer connected
		self.connected = false;
		// Run an optional callback
		self.runCallback('permaDeath', true, reason);
		// Reject pending commands, because now they most certainly
		// will never get executed
		self.rejectPendingCommands();
		// Try aborting current CMD just in case
		self?.currentCMD?.abort?.();
		self.currentCMD = null;
		// Reject promise used to wait for a connection to establish
		self?.connectionReject?.(reason || new ConnectionAborted(
			'Died permanently'
		));
	}

	establishConnection(self){
		if (!self.VMIXIP){
			throw new Error(
				`Cannot maintain connection while VMIX IP is invalid: ${self.VMIXIP}`
			);
		}

		return new Promise(async function(resolve, reject){
			// Create the socket object
			self.skt = new net.Socket();

			// At this point this is only called when connection is refused
			// or some other network-related shit
			self.skt.on('error', function(){
				// self.skt = null;
				reject(new ConnectionAborted(
					'Connection Refused'
				));
			});

			// Try connecting...
			self.skt.connect(self.TCP_API_PORT, self.VMIXIP, async function(){
				// Triggered whenever socket connection closes for whatever reason
				self.skt.on('close', self.SKTCloseEvent);

				// "close" event is enough past this point
				self.skt.on('error', function(){});

				// Sync-like reading
				self.sktIter = self.skt[Symbol.asyncIterator]();

				// Check if it's actually VMIX, because WHO KNOWS....
				const headerData = await self.readHeader();

				self.nprint('Init header data:', headerData);

				if (!headerData.startsWith('VERSION')){
					reject(new UnexpectedResponse([
						`Whatever runs at ${self.VMIXIP}:${self.TCP_API_PORT}`,
						`does NOT seem to be VMIX, BECAUSE upon establishing connection`,
						`it must've sent data, which starts with UTF-8 text >VERSION<, but got:`,
						`>${str(headerData).slice(0, 16)}<`,
					].join(' ')))
					return
				}

				// If it IS VMIX - resolve positively
				resolve(headerData);
			})
		})
	}

	// Read data from socket till something bad happens
	async readSKTStream(self){
		while (true){
			// Wait for the current CMD to go through,
			// because otherwise some weird corruption happens.
			// todo: why ?
			await self?.currentCMD?.sendPromise;

			// Header must be read here, because it can be an activator
			const headerData = await self.readHeader();
			self.nprintL(0, 'Read header:', [str(headerData.slice(0, 128))]);
			if (headerData.startsWith('ACTS')){
				await self.activatorEvent(headerData.slice(5));
				continue
			}

			// Otherwise it means a command is waiting for a response

			// todo: Is this needed?
			if (!self.currentCMD){
				const msg = [
					`Data received from VMIX is NOT an activator`,
					`AND there are no pending commands`
				].join(' ');

				self.nerr(msg);
				throw new FatalIntegrityError(msg);
			}

			// The command must read the body (should there be any) on its own
			// await self.currentCMD.readResponse(headerData);

			for await (const intermediateACT of self.currentCMD.readResponse(headerData)){
				await self.activatorEvent(intermediateACT.slice(5));
			}
		}
	}

	// This gets called repeatedly by fastq in self.MSGOutSched
	async writeSKTStream(self, cmd){
		self.currentCMD = cmd;

		try{
			// Send the command
			await cmd.send();
			// Wait for response
			await cmd.donePromise;
		}catch(e){
			self.nerrL(0, e);
			cmd.doneReject(e);
			// Reject pending commands, because:
			/*
				1 - There are 3 quntillion commands in the sched
				2 - Connection breaks
				3 - Currently executed command fails, which means
				    the sequence of critically important commands
				    this command was a part of is now compromised
				4 - Many seconds pass
				5 - Connection restores
				6 - Pending commands suddenly get executed even though
				    their relevance has long passed and their context
				    is now completely detached from reality.
			*/
			self.rejectPendingCommands();
		}
	}

	// Continuously maintain connection to the VMIX TCP Server
	async maintainConnection(self){
		if (self.connectionMaintained){
			self.nerr('Tried maintaining connection multiple times');
			return false
		}

		self.connectionMaintained = true;

		while (self.enabled){
			try{
				// This throws an error if no valid connection could be made
				const connectionRetryResult = await self.establishConnection();

				// Establishing connection may or may not take just long enough
				// to miss the point in time when self.enabled became false
				if (!self.enabled){break};

				// At this point it means a valid VMIX connectin exists
				self.connected = true;
				self.connectionResolve(connectionRetryResult);
				self.nprintL(5, 'Reconnect OK:', connectionRetryResult);
				await self.runCallback('reconnectOk', false, connectionRetryResult);

				// Reading may not always stop due to an error
				let readError = null;

				// Start reading socket data and wait till it stops for whatever reason
				try{
					await self.readSKTStream();
				}catch(e){
					readError = e;
					self.nerrL(5, 'Socket stream reading errored:', readError);
				}

				self.fuck = false;

				// If auto reconnect is NOT enabled - stop
				if (!self.AUTO_RECONNECT){
					await self.permaDeathEvent(readError);
					break
				}
			}catch(e){
				self.nerrL(5, 'Failed to reconnect:', e);
				await self.runCallback('reconnectFail', false, e);
			}finally{
				// No longer connected
				self.connected = false;

				// Create connection promise
				[self.connectionPromise, self.connectionResolve, self.connectionReject]
				= kbn_util.flatPromise();

				// Reject pending commands, because:
				/*
					1 - There are 3 quntillion commands in the sched
					2 - Connection breaks
					3 - Currently executed command fails, which means
					    the sequence of critically important commands
					    this command was a part of is now compromised
					4 - Many seconds pass
					5 - Connection restores
					6 - Pending commands suddenly get executed even though
					    their relevance has long passed and their context
					    is now completely detached from reality.
				*/
				self.rejectPendingCommands();

				// Wait before reconnecting again...
				await kbn_util.sleep(self.AUTO_RECONNECT_INTERVAL);
				self.nprintL(2, 'Retrying...');
			}
		}

		// Any of this will only happen if self.enabled becomes false
		self.connectionMaintained = false;
		self?.connectionReject?.(new ConnectionAborted(
			'No longer maintaining connection'
		));
		self.nprintL(5, 'No longer maintaining connection');
	}

	async connection(self){
		if (self.connected){
			return true
		}

		return await self.connectionPromise;
	}

	async terminate(self){
		self.permaDeathEvent(new Error(
			'Connection Force Terminated'
		));
	}

	async subscribeActivators(self, activatorsCallback){
		self.activatorsCallback = activatorsCallback;
		return await self.runCMD('SUBSCRIBE ACTS').result();
	}

	runCMD(self, cmdName, cmdArgs=null){
		const cmd = new VMIXTCPCMDInstance(self, cmdName, cmdArgs);

		if (self.connected){
			self.MSGOutSched.push(cmd);
		}else{
			self.connectionPromise
			.then(function(){
				if (self.enabled){
					self.MSGOutSched.push(cmd);
				}
			})
		}
		return cmd
	}
}










module.exports = {
	TCPSched,
	TCPSchedActivators,
	TCPSchedAsync,
	VMIXTCP,
}



