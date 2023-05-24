from pathlib import Path
from szipper import szip
from common_util import project, create_ico, burn_ico_to_exe, major_version, pyinst_cleanup
import subprocess, os, shutil, sys, base64, json


# ========================================
# 			     Setup
# ========================================

# 7zip executable
zipper = project / 'static_bins' / '7z' / '7z.exe'

szipper = szip(zipper)

inst_folder = project / 'install'

# wipe temp folder
shutil.rmtree(inst_folder / 'tmp', ignore_errors=True)

# re-create temp folder
tmp_folder = inst_folder / 'tmp'
tmp_folder.mkdir(exist_ok=True)





# ========================================
# 			      Icon
# ========================================
(tmp_folder / 'base_icon.ico').write_bytes(
	create_ico(
		# Unfortunately, magix is not included into kickboxer, even though it's kind of critical
		r'C:\custom\imgmagick\magick.exe',
		project / 'app' / 'src' / 'assets' / 'pink_panther.png',
	)
)

# burn icon into the electron's exe
burn_ico_to_exe(
	# does "simple" imply that there's also "advanced" version ?!
	project / 'static_bins' / 'rcedit' / 'rcedit_simple.exe',
	tmp_folder / 'base_icon.ico',
	project / 'app' / 'out' / 'KickBoxer3000-win32-x64' / 'KickBoxer3000.exe',
)




# ========================================
#         Pack Compiled Controller
# ========================================

# delete previous pack, if any
(project / 'app' / 'out' / 'KickBoxer3000-win32-x64.7z').unlink(missing_ok=True)

# create new pack
szipper.pack(
	project / 'app' / 'out' / 'KickBoxer3000-win32-x64',
	tmp_folder / 'kb_data.7z',
	exclude=['db'],
	echo=True,
)




# ========================================
#         Compile base to .exe
# ========================================

# Compile python exe
to_exe_params = [
	# kickboxer has a standalone python included and configured the right way
	# it always has PyIntaller
	# When pulling fresh repository it has to be unpacked manually to the same folder the archive is in
	str(project / 'static_bins' / 'python' / 'bin' / 'python.exe'),
	'-m',
	'PyInstaller',
	'--noconfirm',
	'--onefile',
	'--console',
	'--icon',

	# Icon
	str(project / 'app' / 'src' / 'assets' / 'hl1.ico'),

	# app itself
	'--add-data', str(tmp_folder / 'kb_data.7z;.'),
	# 7z exe
	'--add-data', str(project / 'static_bins' / '7z' / '7z.exe;.'),
	# 7z dll
	'--add-data', str(project / 'static_bins' / '7z' / '7z.dll;.'),

	# szipper utility script
	'--add-data', str(inst_folder / 'patcher_based' / 'szipper.py;.'),

	# Base script
	str(inst_folder / 'patcher_based' / 'apply_base.py'),
]

subprocess.run(to_exe_params)

# move executable to the release folder with the appropriate name
pyinst_cleanup(
	'apply_base',
	inst_folder,
	project / 'release' / f'kickboxer_base_v{major_version}.exe',
)

# wipe temp folder
shutil.rmtree(tmp_folder, ignore_errors=True)

# wipe output folder
shutil.rmtree(project / 'app' / 'out', ignore_errors=True)