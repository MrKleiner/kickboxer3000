// No one ever knows what value variable is..
// or what its type is...
// An array is technically just an object
// objects or object..
// null is technically not an object
// but objects can be null, so they technically can be non-objects
// unless they're an object, so technically null is an object



const remap = function(self){
	for (const func_name of Object.getOwnPropertyNames(self.constructor.prototype)){
		if (func_name == 'constructor'){continue};

		const original_func = self[func_name];

		if (original_func.constructor.name == 'AsyncFunction'){
			self[func_name] = async function(){
				return await original_func(self, ...arguments)
			}
		}

		if (original_func.constructor.name == 'Function'){
			self[func_name] = function(){
				return original_func(self, ...arguments)
			}
		}

		if (original_func.constructor.name == 'GeneratorFunction'){
			self[func_name] = function(){
				return original_func(self, ...arguments)
			}
		}
	}

	return self
}








module.exports = {
	remap,
}