const express = require('express');
const app = express();
const path = require('path');

const { cr, timeGet , getRandomColor} = require('./helpers');
const PORT = process.env.PORT || 8080;
//debug log in console
const logger = require('morgan');
app.use(logger("dev"));
//handle request bodies incoming from the client
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}))
const session = require('express-session');
//redis for persistence
// const RedisStore = require('connect-redis')(session);
// const sessionStore = new RedisStore({host: "localhost"})

app.use(express.static('build')) 
//near top level otherwise will get unexpected token error and other errors
//express.static is also serving '/'? overwriting any other calls to the root, so place those over?

app.use(session({
	secret: "secretSession",
	// store: sessionStore,
	resave: true,
	saveUninitialized: true,
	cookie: {
		originalMaxAge: null,
  	maxAge: 60 * 60 * 1000,
    httpOnly: true,
		// secure: true, // https only?
	}
}))

app.get('/login', (req,res)=>{
	res.sendFile(path.join(__dirname + '../../index.html'))
})
app.get('/register', (req,res) => {
	res.sendFile(path.join(__dirname + '../../index.html'))
})

app.get('/', (req,res) => {
	res.sendFile(path.join(__dirname + '../../index.html'))
})

const privateRoute = require('./routes/private');
app.use('/chat', privateRoute);

//login POST
const usersRoute = require('./routes/users');
app.use('/users', usersRoute);

//chat history routes
const historyRoute = require('./routes/history');
app.use('/api/history', historyRoute);

const sessionsRoute = require('./routes/usersSessions');
app.use('/sessions', sessionsRoute);

//redirect on 403
app.use(function(err, req, res, next) {
	if(403 == err.status) {
		res.redirect('/login')
	}
});


const server = require('http').createServer(app);
//socket.io
const chat = require('./chat-socket');
chat(server);
// const game = require('./game-socket')
// game(server)
let players = {};
const level = require('./game/level-require')
const gravity = .1,
			friction = .5

let Chatroom = cr();
let usersList = {};
const axios = require('axios');			
const io = require('socket.io')(server);
io.on('connection', function(socket){
	socket.on('join', function(user){
		console.log('server join fired');
		io.emit('history', Chatroom.getChatHistory())
		trackUser = user;
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
		// console.log("disconnect socket running");
		if(usersList[socket.id]){
			console.log(usersList[socket.id], 'user disconnected');
			let disconnectMsg = {usr: "server", msg: `${usersList[socket.id]} has disconnected.`, tme: timeGet()}
			Chatroom.addEntry(disconnectMsg)
			// io.emit('message', Chatroom.getChatHistory())
			io.emit('message',disconnectMsg)
			axios.patch(`http://localhost:8080/sessions`,
			{
				username: usersList[socket.id],
				lastOnline: timeGet("full"),
				currentStatus: "offline"
			}).catch(err => console.log(err))
		}
	});
	socket.on('message', function(msg){
		console.log('server socket.on message fired');
		Chatroom.addEntry(msg)
		// io.emit('message', Chatroom.getChatHistory());
		// io.emit('message', msg)
		socket.broadcast.emit('message',msg)
	});
	socket.on('game create user', function(username){
		players[username] = {
			x: 300 / 2,
			y: 300 / 2,
			width: 20,
			height: 20,
			jumpHeight: 5,
			moveSpeed: 3,
			velX: 0,
			velY: 0,
			jumping: false,
			grounded: false,
			color: getRandomColor(),
			online: true
		}
	})
	socket.on('game update', function(movement, username) {
		let player = players[username] || {};
		if (movement.up){
			if (!player.jumping && player.grounded) {
				player.jumping = true;
				player.grounded = false;
				player.velY = -player.jumpHeight * 1;//how high to jump
			}
		}
		if (movement.left){
			if (player.velX > -player.jumpHeight) {
				player.velX -= player.moveSpeed;
			}
		}
		if (movement.right){
			if (player.velX < player.jumpHeight) {
				player.velX += player.moveSpeed;
			}
		}
		player.velX *= friction;
		player.velY += gravity;

		player.grounded = false; // if walking off level, it will force gravity
		for (var i = 0; i < level.length; i++) { //correct player position if colliding
			var dir = collisionCheck(player, level[i]); //check collision and 'push' player away
			if (dir === "left" || dir === "right") {
					player.velX = 0;
					player.jumping = false;
			} else if (dir === "bottom") {
					player.grounded = true;
					player.jumping = false;
			} else if (dir === "top") {
					player.velY *= -1;
			}
		}
		if(player.grounded){
			player.velY = 0;
		}
	
		player.x += player.velX;
		player.y += player.velY;
	})

	function collisionCheck(a,b){
		let vX = (a.x + (a.width / 2)) - (b.x + (b.width / 2)),
				vY = (a.y + (a.height / 2)) - (b.y + (b.height / 2)),
				hWidths = (a.width / 2) + (b.width / 2),
				hHeights = (a.height / 2) + (b.height / 2),
				collision = null;
		
		if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights){
			let oX = hWidths - Math.abs(vX),
					oY = hHeights - Math.abs(vY)
			if (oX >= oY){
				if (vY > 0){
					collision = "top";
					a.y += oY;
				} else {
					collision = "bottom";
					a.y -= oY;
				}
			} else {
				if (vX > 0){
					collision = "left";
					a.x += oX;
				} else {
					collision = "right";
					a.x -= oX;
				}
			}
		}
		return collision;
	}
})


setInterval(function(){
	io.emit('game update', players)
}, 1000/60)
server.listen(PORT, (err) => {
	console.log(`Listening on port ${PORT}, ${timeGet("hm")}`);
})