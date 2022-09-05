from pathlib import Path
import json, hashlib, base64, sys, os, shutil
from random import seed
from random import random
# from font_inst import install_font
from basefuncs import *



# =============================================
#					Setup
# =============================================
input_bytes = sys.stdin.buffer.read()

#
# Get server root
#
server = Path(__file__)
for pr in server.parents:
	if (pr / 'roothook.lizard').is_file():
		server = pr
		break

input_data = json.loads(input_bytes.decode())


# =============================================
#					Setup
# =============================================








# do match
match input_data['action']:
	case 'save_context':
		sys.stdout.buffer.write(save_context(input_data['payload']))
	case 'load_context':
		sys.stdout.buffer.write(load_context(input_data['payload']))
	case 'load_xml':
		sys.stdout.buffer.write(load_xml(input_data['payload']))
	case 'builtin_title_double_path':
		sys.stdout.buffer.write(builtin_title_double_path(input_data['payload']))
	case _:
		# sys.stdout.buffer.write(json.dumps({'error': 'unknown_action'}).encode())
		pass









