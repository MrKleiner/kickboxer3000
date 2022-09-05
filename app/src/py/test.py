import sys, json, os
from pathlib import Path
data = sys.stdin.buffer.read()
test = {
	'input': data.decode(),
	'read_file_length': len(Path(r'C:\custom\blenders\blender-3.2.2-windows-x64.zip').read_bytes()),
	'wat': str(sys.argv)
}
#
# Get server root
#
server = Path(__file__)
for pr in server.parents:
	if (pr / 'roothook.lizard').is_file():
		server = pr
		break

test['sysroot'] = str(server)
sys.stdout.buffer.write(json.dumps(test).encode())