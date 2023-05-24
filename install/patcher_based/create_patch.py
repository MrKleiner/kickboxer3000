from pathlib import Path
from szipper import szip
from common_util import project, create_ico, pyinst_cleanup, native_version
import shutil, subprocess, json

# 7zip executable
zipper = project / 'static_bins' / '7z' / '7z.exe'

inst_folder = project / 'install'

# wipe temp folder
shutil.rmtree(inst_folder / 'tmp', ignore_errors=True)

# re-create temp folder
tmp_folder = inst_folder / 'tmp'
tmp_folder.mkdir(exist_ok=True)

# Pack folders required for a patch
# also add package info to update version number
szipper = szip(zipper)
szipper.pack(
	# include package.json for proper versioning
	[project / 'app' / 'src', project / 'app' / 'package.json'],
	tmp_folder / 'patch_data.7z',
	['bins', 'db'],
)

# create icon for the patcher
(tmp_folder / 'patch_icon.ico').write_bytes(
	create_ico(
		# Unfortunately, magix is not included into kickboxer, even though it's kind of critical
		r'C:\custom\imgmagick\magick.exe',
		project / 'app' / 'src' / 'assets' / 'upgrade.png',
	)
)


# Compile python exe
compile_params = [
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
	str(tmp_folder / 'patch_icon.ico'),

	# patch data
	'--add-data', str(tmp_folder / 'patch_data.7z;.'),
	# 7z exe
	'--add-data', str(project / 'static_bins' / '7z' / '7z.exe;.'),
	# 7z dll
	'--add-data', str(project / 'static_bins' / '7z' / '7z.dll;.'),

	# szipper utility script
	'--add-data', str(inst_folder / 'patcher_based' / 'szipper.py;.'),

	# Base script
	str(inst_folder / 'patcher_based' / 'apply_patch.py'),
]

subprocess.run(compile_params)

# move executable to the release folder with the appropriate name
pyinst_cleanup(
	'apply_patch',
	inst_folder,
	project / 'release' / f'kb_patch_v{native_version}.exe',
)

# wipe temp folder
shutil.rmtree(tmp_folder, ignore_errors=True)





