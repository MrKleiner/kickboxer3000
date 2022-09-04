import os
import sys
from pathlib import Path
import subprocess

application_path = os.path.dirname(sys.executable)
server = Path(application_path).absolute()

print("""

=======================================================
=======================================================
               KICKBOXER 300 INSTALLING
=======================================================
=======================================================


---------------- Spinning Earth..... ------------------

""")

eprms = [
	str(server / 'htbin' / '7z' / '7z.exe'),
	'x',
	'-o' + str(server / 'htbin'),
	str(server / 'htbin' / 'python.7z'),
	'-aoa'
]

# exec unpacking
subprocess.call(eprms)

print('--------------------- Finalizing ----------------------')

with open(str(server / 'launcher.cmd'), 'w') as launcher:
	launcher.write('cd /d ')
	launcher.write('"' + str(server) + '"')
	launcher.write('\n')

	launcher.write('explorer "http://localhost:3186/"')
	launcher.write('\n')

	launcher.write('"' + str(server / 'htbin' / 'python' / 'bin' / 'python.exe') + '"')
	launcher.write(' -m http.server 3186 --cgi')


print('------------------------ DONE ------------------------')