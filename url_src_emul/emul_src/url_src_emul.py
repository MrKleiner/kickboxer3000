import socket, threading, os, sys
import urllib
from urllib.parse import unquote
from pathlib import Path
import argparse


def exception_to_str(err):
	import traceback
	try:
		return ''.join(
			traceback.format_exception(
				type(err),
				err,
				err.__traceback__
			)
		)
	except Exception as e:
		return str(e)


class URLEmul:
	def __init__(self, cfg_dir, port, path_dict=None):
		self.port = int(port)

		self.dict_dir = Path(cfg_dir.strip(' "'))
		self.url_dict_file = self.dict_dir / 'url_dict.cfg'

		self._path_dict = path_dict

	@property
	def path_dict(self):
		if self._path_dict:
			return self._path_dict

		lines = self.url_dict_file.read_text(encoding='utf-8').split('\n')
		self._path_dict = {}
		for l in lines:
			if not (l := l.strip()):
				continue
			url, tgt_file = l.split('\2')
			# self._path_dict[urllib.parse.urlparse(url).strip(' /')] = (
			self._path_dict[unquote(url).strip(' /')] = (
				self.dict_dir / tgt_file.strip()
			)

		return self._path_dict

	def send_lines(self, cl_con, lines):
		for l in lines:
			cl_con.sendall(
				l.encode() + b'\r\n'
			)

	def process_request(self, cl_con):
		with cl_con.makefile('rb', newline=b'\r\n', buffering=0) as skt_file:
			lines = []
			while not (line := skt_file.readline()) in (b'', b'\r\n'):
				lines.append(line.decode())

		method, rpath, protocol = lines[0].split(' ')
		rpath = unquote(rpath).strip(' /')

		print(rpath, rpath in self.path_dict)

		# parsed_url = urllib.parse.urlparse(rpath)
		self.send_lines(cl_con, (
			'HTTP/1.1 200 OK' if rpath in self.path_dict else 'HTTP/1.1 404 Not Found',
			'Cache-Control: no-cache',
			'Access-Control-Allow-Origin: *',
			'Server: py_url_emul',
		))

		file_path = self.path_dict.get(rpath)

		if file_path and file_path.is_file():
			payload = file_path.read_bytes()
		else:
			payload = f'404: Path {rpath} not found'.encode()

		self.send_lines(cl_con, (
			f'Content-Length: {len(payload)}',
			f'Content-Type: application/octet-stream',
		))
		cl_con.sendall(b'\r\n')
		cl_con.sendall(payload)

	def htsession(self, cl_con):
		while True:
			try:
				self.process_request(cl_con)
			except ConnectionAbortedError as e:
				print('Connection aborted')
				return
			except ConnectionResetError as e:
				print('Connection aborted')
				return
			except TimeoutError as e:
				print('Connection timed out, unfortunately')
				return
			except BrokenPipeError as e:
				print('Connection aborted')
				return
			except Exception as e:
				print('Unknown Error. Closing session:', exception_to_str(e))
				try:
					cl_con.shutdown(socket.SHUT_RDWR)
					cl_con.close()
				except: pass

				return

	def run(self):
		with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as skt:
			skt.bind(
				('', self.port)
			)
			skt.listen(0)

			print('Listening...')

			while True:
				cl_con, address = skt.accept()
				print('Accepted connection')
				threading.Thread(
					target=self.htsession,
					args=(cl_con,),
					daemon=True,
				).start()


def main():
	cmd_args = argparse.ArgumentParser()
	cmd_args.add_argument(
		'-url_dir',
		default=None
	)
	cmd_args.add_argument(
		'-port',
		default=None
	)
	params = cmd_args.parse_args()

	if not all((params.url_dir, params.port,)):
		print('Insufficient parameters. Aborting.')
		print(
			f'-url_dir ({params.url_dir}) or '
			f'-port ({params.port}) parameter is missing or invalid'
		)
		return

	url_emul = URLEmul(params.url_dir, params.port)
	url_emul.run()


if __name__ == '__main__':
	main()

