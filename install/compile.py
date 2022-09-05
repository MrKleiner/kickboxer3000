# I should've done this LONG ago !
import subprocess
import os
from pathlib import Path
import shutil
import sys
import base64

# application_path = os.path.dirname(sys.executable)
project = Path(__file__).parent.parent

#
# Create giga binary
#
with open(str(project / 'release' / 'install_bin.pootis'), 'ab') as giga:
	# write 7z exe
	giga.write(base64.b64encode((project / 'install' / '7z' / '7z.exe').read_bytes()))
	giga.write('\n'.encode())
	# write 7z dll
	giga.write(base64.b64encode((project / 'install' / '7z' / '7z.dll').read_bytes()))
	giga.write('\n'.encode())
	# write archive
	giga.write(base64.b64encode((project / 'app' / 'out' / 'KickBoxer3000-win32-x64.7z').read_bytes()))




#
# Compile python exe
#
cmpileprms = [
	str(project / 'app'/ 'src' / 'bins' / 'python' / 'bin' / 'python.exe'),
	'-m',
	'PyInstaller',
	'--noconfirm',
	'--onefile',
	'--console',
	'--icon',
	'E:/mapping/hl1/resource/game.ico',
	str(project / 'install' / 'install.py')
]

subprocess.call(cmpileprms)

# move exe
shutil.move(str(project / 'install' / 'dist' / 'install.exe'), str(project / 'release' / 'install.exe'))

# delete shit
shutil.rmtree(str(project / 'install' / 'build'))
shutil.rmtree(str(project / 'install' / 'dist'))

for spec in (project / 'install').glob('*'):
	if spec.suffix.lower() == '.spec':
		os.remove(str(spec))










