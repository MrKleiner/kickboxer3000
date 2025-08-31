const net = require('net');


// ksys.context.global.cache.vmix_ip

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
		self.DOMParser = new DOMParser();

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

		return self.DOMParser.parseFromString(
			self.UTF8TextDecoder.decode(result),
			'application/xml'
		)
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









module.exports = {
	TCPSched,
	TCPSchedActivators,
}



