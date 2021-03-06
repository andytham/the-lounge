import config from 'config'; //webpack externals
import axios from 'axios';
function createSession(user){
	const requestOptions = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...user })
	}
	
	//working fetch version
	// fetch(`${config.API_URL}/sessions`, requestOptions)
	// 	.then(data => {
	// 		console.log("post success?", data);
	// 	})
	// 	.then(data => {
	// 		console.log("HELLO?");
	// 	})
	// 	.catch(err => console.log(err))

	if (user.username){
		axios.post(`${config.API_URL}/sessions`, {
			...user
		})
			.then(data => {
			// console.log("post success?");
		})
			.catch(err => console.log(err))
	
	}

}
async function getSessions(){
	const requestOptions = {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	};
	try {
		let resp = await axios(`${config.API_URL}/sessions`)
		let data = resp.data;
		return data
	} catch (err){
		console.log(err);
	}
}

function patchSession(user){
	axios.patch(`${config.API_URL}/sessions`,{...user})
		.catch(err => console.log(err))
}

export const sessionsService = {
	createSession,
	getSessions,
	patchSession
}