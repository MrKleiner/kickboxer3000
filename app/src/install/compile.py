# I should've done this LONG ago !
import subprocess
import os
from pathlib import Path
import shutil
import sys

# application_path = os.path.dirname(sys.executable)
server = Path(__file__).parent.parent.absolute()

cmpileprms = [
	str(server / 'htbin' / 'python' / 'bin' / 'python.exe'),
	'-m',
	'PyInstaller',
	'--noconfirm',
	'--onefile',
	'--console',
	'--icon',
	'E:/mapping/hl1/resource/game.ico',
	str(server / 'install' / 'install.py')
]

subprocess.call(cmpileprms)

# move exe
shutil.move(str(server / 'install' / 'dist' / 'install.exe'), str(server / 'install.exe'))

# delete shit
shutil.rmtree(str(server / 'install' / 'build'))
shutil.rmtree(str(server / 'install' / 'dist'))

for spec in (server / 'install').glob('*'):
	if spec.suffix.lower() == '.spec':
		os.remove(str(spec))










