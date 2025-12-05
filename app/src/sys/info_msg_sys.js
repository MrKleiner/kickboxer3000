const msgsys = {};


const MSG_POOL_DOM = qsel('hintsys-bar #hintsys_bar_msgs');



// Todo: the magic circle timing is half-broken
// It's not broken. It's simply impossible to trigger a function
// faster than n-whatever milliseconds.

const polarToCartesian = function(centerX, centerY, radius, angleInDegrees) {
	const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
	return {
		x: centerX + (radius * Math.cos(angleInRadians)),
		y: centerY + (radius * Math.sin(angleInRadians)),
	};
}

const describeArc = function(x, y, radius, startAngle, endAngle){
	const start = polarToCartesian(x, y, radius, endAngle);
	const end = polarToCartesian(x, y, radius, startAngle);

	const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

	const d = [
	    'M', start.x, start.y, 
	    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
	].join(' ');

	return d
}



const MagicCircle = class{
	constructor(params){
		const self = this;
		ksys.util.cls_pwnage.remap(self);

		self.get_stuck = params?.get_stuck || false;

		self.dom = $(`
			<svg viewBox="-100 -100 200 200">
				<path fill="none" stroke="white" stroke-width="${params?.stroke_w || 190}px" />
			</svg>
		`)[0];

		self.tgt_path = self.dom.querySelector('path');
	}

	async _launch_anim(self, dur=500){
		const step_angle = 1;
		const step_count = 360 / step_angle;
		// const step_dur = step_count / dur;
		const step_dur = dur / step_count;

		let current_angle = 0;

		while (true){
			await ksys.util.sleep(step_dur)
			current_angle += step_angle;
			self.tgt_path.setAttribute('d', describeArc(0, 0, 100-10, 0, current_angle.clamp(0, 360)))

			if (current_angle >= 140 && self.get_stuck){
				break
			}

			if (current_angle >= 359){
				break
			}
		}
	}

	async launch_anim(self, dur=500){
		const step = 1;
		for (const angle of range(360)){
			// self.tgt_path.setAttribute('d', describeArc(0, 0, 100-10, 0, angle.clamp(0, 360)));
			self.tgt_path.setAttribute('d', describeArc(0, 0, 100-10, 0, angle.clamp(0, 360)));
			await ksys.util.sleep(dur / 360);
			if (angle >= 140 && self.get_stuck){
				break
			}
		}
	}
}


// - text: Text
// - msg_type:
//     - 'err': Red Error
//     - 'ok': Green ok
//     - 'warn': Yellow warning
const InfoMessage = class{
	constructor(text, msg_type='warn', dur=1000){
		const self = this;

		self.pie = new MagicCircle();
		self.msg_body = $(`<div ${msg_type} class="kbmsg">${text}</div>`)[0];
		self.msg_body.prepend(self.pie.dom);
		$('hintsys-bar #hintsys_bar_msgs').prepend(self.msg_body);

		if (msg_type == 'warn'){
			self.body_warn('warn');
		}
		if (msg_type == 'err'){
			self.body_warn('err');
		}

		self.pie.launch_anim(
			dur + ((msg_type == 'warn' || msg_type == 'err') ? 1500 : 0)
		)
		.then((value) => {
			self.msg_body.remove();
		});
		
	}

	async body_warn(warn_type='warn'){
		let color = null;

		if (warn_type == 'warn'){
			color = 'rgba(255, 200, 0, 1)';
		}
		if (warn_type == 'err'){
			color = '#F23A27';
		}

		// box-shadow: inset 0px 0px 77px 45px rgba(255, 200, 0, 1);
		let shadow_size = 97;

		if (!ksys.util.isDev()){
			for (const i of range(4)){
				document.body.style.boxShadow = `inset 0px 0px ${shadow_size}px ${shadow_size}px ${color}`;
				document.querySelector('html').style.filter = 'invert(1)'
				await ksys.util.sleep(50);
				document.body.style.boxShadow = `inset 0px 0px ${shadow_size/2}px ${shadow_size/2}px ${color}`;
				document.querySelector('html').style.filter = ''
				await ksys.util.sleep(50);
			}

			for (const i of range(shadow_size)){
				document.body.style.boxShadow = `inset 0px 0px ${shadow_size}px ${shadow_size}px ${color}`;
				await ksys.util.sleep(10);
				shadow_size -= 1;
			}
		}

		shadow_size -= 1;

		document.body.style.boxShadow = '';
	}
}


// the "new" keyword is stoopid
const send_msg = function(text, msg_type='warn', dur=1000){
	for (const msg of qselAll('hintsys-bar #hintsys_bar_msgs .kbmsg')){
		if ((msg.innerText == text) && (msg_type == 'warn')){
			return
		}
	}
	return new InfoMessage(text, msg_type, dur)
}


module.exports = {
	send_msg,
	MagicCircle,
}








