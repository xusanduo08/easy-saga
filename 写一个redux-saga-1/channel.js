
export default function stdChannel(){
	let takers = [];
  function put(action){
		let currTakers = takers.slice(); // 防止遍历的时候takers发生变化
		let desTakes = [];
		currTakers.forEach(take => {
			if(take.action.type === action.type){
				desTakes.push(index);
				cb(action)
			}
		})

		takers = takers.filter(index => !(desTakes.indexOf(index) >= 0));
	}
	
	function take(action, cb){
		takers.put({action, cb})
	}

	return {
		put,
		take
	}
}