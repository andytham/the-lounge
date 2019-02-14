//server side socket emitters
function startEmitters(server){
	const io = require('socket.io')(server);
	const { cr, timeGet } = require('./helpers');
	let Chatroom = cr();
	let usersList = {};
	
	io.on('connection', function(socket){
	  //when user joins the server
		socket.on('join', function(user){
			console.log('server join fired');
			io.emit('history', Chatroom.getChatHistory())
			if(user){
				console.log(user, "has joined");
				let joinMsg = {usr: "server", msg: `${user} has joined the server`, tme: timeGet()}
				Chatroom.addEntry(joinMsg)
				// io.emit('message', Chatroom.getChatHistory())
				io.emit('message',joinMsg)
				usersList[socket.id] = user
			}
		})
		socket.on('disconnect', function(){
			if(usersList[socket.id]){
				console.log(usersList[socket.id], 'user disconnected');
				let disconnectMsg = {usr: "server", msg: `${usersList[socket.id]} has disconnected.`}
				Chatroom.addEntry(disconnectMsg)
				// io.emit('message', Chatroom.getChatHistory())
				io.emit('message',disconnectMsg)
			}
		});
		socket.on('message', function(msg){
			console.log('server socket.on message fired');
			Chatroom.addEntry(msg)
			// io.emit('message', Chatroom.getChatHistory());
			// io.emit('message', msg)
			socket.broadcast.emit('message',msg)
		});
	})
}
module.exports = startEmitters;