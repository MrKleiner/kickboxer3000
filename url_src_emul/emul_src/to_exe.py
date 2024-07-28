import subprocess
from pathlib import Path


project = Path(__file__).parent.parent.parent
THISDIR = Path(__file__).parent


def pyinst_cleanup(base_name, src_folder, move_to):
	import shutil

	src_folder = Path(src_folder)
	move_to = Path(move_to)

	# move executable to the specified destination
	shutil.move(
		src_folder / 'dist' / f'{base_name}.exe',
		move_to,
	)

	# wipe build folder
	shutil.rmtree(src_folder / 'build', ignore_errors=True)
	# remove the dist folder
	shutil.rmtree(src_folder / 'dist', ignore_errors=True)
	# remove the .spec file
	(src_folder / f'{base_name}.spec').unlink(missing_ok=True)



compile_params = [
	# kickboxer has a standalone python included and configured the right way
	# it always has PyIntaller

	# When pulling fresh repository
	# it has to be unpacked manually to the same folder the archive is in
	str(project / 'static_bins' / 'python' / 'bin' / 'python.exe'),
	'-m',
	'PyInstaller',
	'--noconfirm',
	'--onefile',
	'--console',

	# MGE Icon
	'--icon', str(THISDIR / 'icon.ico'),

	# patch data
	# '--add-data', str(THISDIR / 'sample_data_frmt.xml;.'),

	# Base script
	str(THISDIR / 'url_src_emul.py'),
]

subprocess.run(compile_params)

pyinst_cleanup(
	'url_src_emul',
	project / 'url_src_emul' / 'emul_src',
	project / 'url_src_emul' / f'url_src_emul.exe',
)

