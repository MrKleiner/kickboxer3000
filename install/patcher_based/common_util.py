from pathlib import Path
import json

project = Path(__file__).parent.parent.parent

native_version = json.loads((project / 'app' / 'package.json').read_bytes())['version_native']

major_version = json.loads((project / 'app' / 'package.json').read_bytes())['version']





def create_ico(magix_exe, input_image):
	import subprocess
	magix_exe = Path(magix_exe)
	input_image = Path(input_image)

	# create 4 different icon sizes
	# sizedict = [128, 64, 32, 32]
	collapse = []
	for sz in [128, 64, 32, 31]:
		resized_path = input_image.parent / f'__{input_image.suffix}_rsic_{sz}.png'
		magix_prms = [
			str(magix_exe),
			# input path
			str(input_image),
			# resize and keep proportions
			'-resize', str(sz),
			# output path
			str(resized_path),
		]

		# convert to required size
		subprocess.run(magix_prms)

		collapse.append(resized_path)

	# collapse 4 different sizes into a single .ico
	collapse_prms = [
		str(magix_exe),
		# input images
		str(collapse[0]), str(collapse[1]), str(collapse[2]), str(collapse[3]),
		# output .ico path
		# str(input_image / '__rsic_collapsed.ico'),
		'ico:-'
	]

	with subprocess.Popen(collapse_prms, stdout=subprocess.PIPE, bufsize=10**8) as collapse_pipe:
		collapsed_ico = collapse_pipe.stdout.read()

	# Cleanup: Delete resized images
	for resized_img in collapse:
		resized_img.unlink(missing_ok=True)

	return collapsed_ico


def burn_ico_to_exe(rcedit, icon_path, exe_path):
	import subprocess
	rcedit = Path(rcedit)
	rc_prms = [
		str(rcedit),

		# input exe
		str(exe_path),

		# set icon
		'--set-icon',

		# icon path
		str(icon_path),
	]

	subprocess.run(rc_prms)


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





