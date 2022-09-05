

"""
class mainman:
	'Sex'
	# anything that is specified becomes defaults. Useful
	# Create a string at the very top of the class to make it a documentation
	# variables inside functions HAVE NO CONNECTION to the class variables no matter what
	# to access/write stored variables use self.whatever

	# all the additional functionality is quite optional



	#
	# Defaults
	#



	def __init__(self, pootis):
		self.lizard = 'lizard'

	def solids(self, world=True, ents=True):
		pass

	# returns map properties
	# simply because I don't want to add self.mapsettings to the end of the init parser
	@property
	def mapsettings(self):
		pass


	# get a bunch of free ids
	def getfreeid(self, amount, doside=False):
		pass
"""

def whereserver(fl):
	from pathlib import Path
	#
	# Get server root
	#
	server = Path(fl)
	for pr in server.parents:
		if (pr / 'roothook.lizard').is_file():
			server = pr
			break
	return server


def save_context(pl):
	import json
	from pathlib import Path
	try:
		(whereserver(__file__) / 'db' / 'context' / 'context.ct').write_text(json.dumps(pl))
		return json.dumps({'status': 'success', 'details': [str(pl)]}).encode()
	except Exception as e:
		return str(e).encode()
	

def load_context(pl):
	return (whereserver(__file__) / 'db' / 'context' / 'context.ct').read_bytes()

# words cannot express how much I fucking hate CORS gay retarded nigger shit
def load_xml(pl):
	import requests
	rq_url = 'https://feed.pm/api/v1/event/collection-xml/xsport_feed'
	url_prms = {
		'Accept': '*/*'
	}
	headerz = {
		'Accept': '*/*'
	}
	do_request = requests.get(url=rq_url, params=url_prms, headers=headerz)
	data = do_request.content

	if pl.get('testing') == '1':
		data = """<response>
		<name>Катовіце - Регле</name>
		<p1>Катовіце</p1>
		<p2>Регле</p2>
		<url>https://parimatch.com/events/gks-katowice-rogle-8729009/1</url>
		<date_start>2022-09-01 16:05:00</date_start>
		<event_date_utc>2022-09-01T16:05:00.000Z</event_date_utc>
		<sport>IceHockey</sport>
		<category>Європа</category>
		<tournament>Ліга чемпіонів</tournament>
		<coff_p1>10.69</coff_p1>
		<coff_p2>9.69</coff_p2>
		<coff_draw/>
		<p1_id>88365</p1_id>
		<p2_id>81505</p2_id>
		<p1_icon>https://parimatch.com/content/uploads/H/88365.png</p1_icon>
		<p2_icon>https://parimatch.com/content/uploads/H/81505.png</p2_icon>
		<feed_status>3</feed_status>
		<last_update>2022-09-01 18:14:03</last_update>
		</response>""".encode()

	return data

