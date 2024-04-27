import socket, threading, os, sys
import urllib
from urllib.parse import unquote
from pathlib import Path

SAMPLE_DATA = (Path(__file__).parent / 'sample_data_frmt.xml').read_bytes()

OK_MSG = 'Function completed successfully.'





def request_processor(cl_con):
	# print('Processing...')

	skt_file = cl_con.makefile('rb', newline=b'\r\n', buffering=0)

	lines = []

	while True:
		line = skt_file.readline()
		if line == b'\r\n':
			break

		lines.append(line.decode())

	skt_file.close()

	method, rpath, protocol = lines[0].split(' ')

	parsed_url = urllib.parse.urlparse(rpath)
	query_params = (
		{k:(''.join(v)) for (k,v) in urllib.parse.parse_qs(parsed_url.query, True).items()}
	)
	print_string = []
	for k, v in query_params.items():
		print_string.append(
			f"""{k.ljust(20, ' ')} {v.ljust(10, ' ')}"""
		)

	print('\n'.join(print_string) + '\n')


	cl_con.sendall(
		f'HTTP/1.1 200 OK\r\n'.encode()
	)
	cl_con.sendall(
		f'Cache-Control: no-cache\r\n'.encode()
	)
	cl_con.sendall(
		f'Access-Control-Allow-Origin: *\r\n'.encode()
	)
	cl_con.sendall(
		f'Server: py_vme\r\n'.encode()
	)

	# print(method, rpath, protocol)
	# print(lines[0].lower().split('/api')[-1].strip('/').strip())

	if unquote(rpath.lower().split('/api')[-1].strip('/').strip()) == '?function=':
		cl_con.sendall(
			f'Content-Length: {len(SAMPLE_DATA)}\r\n'.encode()
		)
		cl_con.sendall(
			f'Content-Type: text/xml; charset=utf-8\r\n'.encode()
		)
		cl_con.sendall(b'\r\n')
		cl_con.sendall(SAMPLE_DATA)
	else:
		cl_con.sendall(
			f'Content-Type: text/html; charset=utf-8\r\n'.encode()
		)
		cl_con.sendall(
			f'Content-Length: {len(OK_MSG)}\r\n'.encode()
		)
		cl_con.sendall(b'\r\n')
		cl_con.sendall(OK_MSG.encode())

	cl_con.close()



def listen_server(target_port):
	skt = socket.socket()
	skt.bind(('', target_port))
	skt.listen(0)

	while True:
		conn, address = skt.accept()
		threading.Thread(
			target=request_processor,
			args=(conn,),
			daemon=True,
		).start()






if __name__ == '__main__':
	tgt_port = int(
		input('Please specify a port to run this on: ')
	)

	# threading.Thread(target=listen_server, args=(tgt_port,)).start()
	listen_server(tgt_port)












