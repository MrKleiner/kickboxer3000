import shutil
import subprocess
import json

from pathlib import Path

from szipper import szip
from common_util import (
	project,
	create_ico,
	pyinst_cleanup,
	native_version,
	LIB_NAMES,
)



# Unfortunately, magix is not included with kickboxer,
# even though it's kind of critical
IMAGE_MAGICK_FPATH = 'C:\\custom\\imgmagick\\magick.exe'

# 7zip executable
SZIP_EXE_FPATH = project / 'static_bins' / '7z' / '7z.exe'

INST_DIR_PATH = project / 'install'

# kickboxer has a standalone python included and configured the right way,
# which always has PyIntaller.
# When pulling fresh repository it has to be unpacked manually
# to the same folder the archive is in.
PY_EXE_FPATH = project / 'static_bins' / 'python' / 'bin' / 'python.exe'





class KickBoxer3000PatchCreator:
	PYINST_BASE_PRMS = (
		str(PY_EXE_FPATH),
		'-m',
		'PyInstaller',
		'--noconfirm',
		'--onefile',
		'--console',
		'--icon',
	)

	PATCH_DATA_BASE_EXCLUDES = (
		'bins',
		'db',
		'isdev.fuck',
		'.bin',
	)

	PATCH_DATA_BASE_DIR_EXCLUDES = (
		'node_modules/electron',
		'node_modules/electron-installer-common',
		'node_modules/electron-packager',
		'node_modules/electron-squirrel-startup',
		'node_modules/electron-winstaller',
	)

	SELECTIVE_LIBS = True

	def __init__(self, project_dir):
		self.project_dir = project_dir
		self.exe_out_fpath = project_dir / 'release' / f'kb_patch_v{native_version}.exe'
		self.node_modules_dir_path = project_dir / 'app' / 'node_modules'

		self._tmpdir = None
		self._szipper = None
		self._icon_fpath = None
		self._pyinst_prms = None
		self._patch_data_fpath = None
		self._lib_dirs = None
		self._selected_libs_dir = None

	@property
	def tmpdir(self):
		if self._tmpdir:
			return self._tmpdir

		# wipe temp folder
		shutil.rmtree(
			INST_DIR_PATH / 'tmp',
			ignore_errors=True
		)

		# re-create temp folder
		self._tmpdir = INST_DIR_PATH / 'tmp'
		self._tmpdir.mkdir(exist_ok=True)

		return self._tmpdir

	@property
	def szipper(self):
		if self._szipper:
			return self._szipper

		self._szipper = szip(SZIP_EXE_FPATH)

		return self._szipper

	@property
	def icon_fpath(self):
		if self._icon_fpath:
			return self._icon_fpath

		self._icon_fpath = self.tmpdir / 'patch_icon.ico'

		self._icon_fpath.write_bytes(
			create_ico(
				IMAGE_MAGICK_FPATH,
				self.project_dir / 'app' / 'src' / 'assets' / 'upgrade.png',
			)
		)

		return self._icon_fpath

	@property
	def lib_dirs(self):
		if self._lib_dirs != None:
			return self._lib_dirs

		initial_iterator = self.node_modules_dir_path.glob('*')

		if self.SELECTIVE_LIBS:
			self._lib_dirs = [
				d for d in initial_iterator
				if (d.name in LIB_NAMES) and d.is_dir()
			]

			stack = [*self._lib_dirs]

			while stack:
				lib_dir_path = stack.pop()
				pkg_json_fpath = lib_dir_path / 'package.json'

				if not pkg_json_fpath.is_file():
					continue

				for pkg_name in json.loads(pkg_json_fpath.read_bytes()).get('dependencies', {}).keys():
					dependency_dir = self.node_modules_dir_path / pkg_name
					if not dependency_dir.is_dir():
						continue

					# print(lib_dir_path, 'Depends on', dependency_dir)
					stack.append(dependency_dir)

					if not (dependency_dir in self._lib_dirs):
						self._lib_dirs.append(dependency_dir)
		else:
			self._lib_dirs = (
				d for d in initial_iterator if d.is_dir()
			)

		return tuple(self._lib_dirs)

	@property
	def collected_libs_dir(self):
		if self._selected_libs_dir:
			return self._selected_libs_dir

		self._selected_libs_dir = self.tmpdir / 'node_modules'

		shutil.rmtree(
			self._selected_libs_dir,
			ignore_errors=True,
		)

		for dir_path in self.lib_dirs:
			shutil.copytree(
				dir_path,
				self._selected_libs_dir / dir_path.name,
			)

		return self._selected_libs_dir

	@property
	def patch_data_fpath(self):
		if self._patch_data_fpath:
			return self._patch_data_fpath

		self._patch_data_fpath = self.tmpdir / 'patch_data.7z'

		self.szipper.pack(
			# Files/Dirs to pack
			(
				self.project_dir / 'app' / 'src',
				self.project_dir / 'app' / 'package.json',
				self.collected_libs_dir
			),

			# Output filepath
			self._patch_data_fpath,

			# Excludes
			exclude=      list(self.PATCH_DATA_BASE_EXCLUDES),
			exclude_dirs= list(self.PATCH_DATA_BASE_DIR_EXCLUDES),
		)

		return self._patch_data_fpath

	@property
	def pyinst_prms(self):
		if self._pyinst_prms != None:
			return self._pyinst_prms

		self._pyinst_prms = (
			*self.PYINST_BASE_PRMS,

			# Icon
			str(self.icon_fpath),

			# patch data
			'--add-data', str(self.patch_data_fpath) + ';.',
			# 7z exe
			'--add-data', str(self.project_dir / 'static_bins' / '7z' / '7z.exe;.'),
			# 7z dll
			'--add-data', str(self.project_dir / 'static_bins' / '7z' / '7z.dll;.'),

			# szipper utility script
			'--add-data', str(INST_DIR_PATH / 'patcher_based' / 'szipper.py;.'),

			# Base script
			str(INST_DIR_PATH / 'patcher_based' / 'apply_patch.py'),
		)

		return self._pyinst_prms

	def run(self):
		# Run pyinst
		subprocess.run(self.pyinst_prms)
	
		# Move resulting executable to the release folder
		# with the appropriate name
		pyinst_cleanup(
			'apply_patch',
			INST_DIR_PATH,
			self.exe_out_fpath,
		)

		# wipe temp folder
		shutil.rmtree(self.tmpdir, ignore_errors=True)

		return self.exe_out_fpath




def _main():
	# wipe temp folder
	shutil.rmtree(INST_DIR_PATH / 'tmp', ignore_errors=True)

	# re-create temp folder
	tmp_folder = INST_DIR_PATH / 'tmp'
	tmp_folder.mkdir(exist_ok=True)

	# Pack folders required for a patch
	# also add package info to update version number
	szipper = szip(zipper)
	szipper.pack(
		# include package.json for proper versioning
		(
			str(project / 'app' / 'src'),
			str(project / 'app' / 'package.json'),
			# str(project / 'app' / 'node_modules'),
		),
		tmp_folder / 'patch_data.7z',
		exclude=[
			'bins',
			'db',
			'isdev.fuck',
		],
		exclude_dirs=[
			'node_modules/electron',
			'node_modules/electron-installer-common',
			'node_modules/electron-packager',
			'node_modules/electron-squirrel-startup',
			'node_modules/electron-winstaller',
		]
	)

	# create icon for the patcher
	(tmp_folder / 'patch_icon.ico').write_bytes(
		create_ico(
			# Unfortunately, magix is not included into kickboxer,
			# even though it's kind of critical
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
		'--add-data', str(INST_DIR_PATH / 'patcher_based' / 'szipper.py;.'),

		# Base script
		str(INST_DIR_PATH / 'patcher_based' / 'apply_patch.py'),
	]

	subprocess.run(compile_params)

	# move executable to the release folder with the appropriate name
	pyinst_cleanup(
		'apply_patch',
		INST_DIR_PATH,
		project / 'release' / f'kb_patch_v{native_version}.exe',
	)

	# wipe temp folder
	shutil.rmtree(tmp_folder, ignore_errors=True)



def main():
	KickBoxer3000PatchCreator(project).run()


def debug():
	print(
		'Patch data:', KickBoxer3000PatchCreator(project).patch_data_fpath
	)


if __name__ == '__main__':
	main()

