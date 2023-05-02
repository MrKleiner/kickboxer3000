
const ops = {};

// Check string for validity
// If the string is invalid, then return span with a message
// IF string IS valid - return the string in question
ops.validate = function(st, msg='empty string'){
	if (str(st).trim() == ''){
		return `<span style="color: gray; user-select: none">${msg}</span>`
	}else{
		return st
	}
}














module.exports = ops;