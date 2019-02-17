const socket = io();

let movement = {
	up: false,
	left: false,
	right: false
}

document.addEventListener('keydown', function(event) {
	if(event.target == canvas){
		switch (event.keyCode) {
			case 65: // a
			case 37: // arrow 
				movement.left = true;
				break;
			case 87: // w
			case 38: // arrow
			case 32: // space
				movement.up = true;
				break;
			case 68: // d
			case 39: // arrow
				movement.right = true;
				break;
		}
	}
});

document.addEventListener('keyup', function(event) {
  switch (event.keyCode) {
		case 65: // a
		case 37: // arrow 
      movement.left = false;
      break;
		case 87: // w
		case 38: // arrow
		case 32: // space
      movement.up = false;
      break;
		case 68: // d
		case 39: // arrow
      movement.right = false;
      break;
  }
});

const canvas = document.getElementById('canvas'),
			ctx = canvas.getContext('2d'),
			width = 300,
			height = 300,
			gravity = .8,
			friction = .5
canvas.width = width;
canvas.height = height;

import level from './level.js';
setInterval(function(){
	socket.emit('game update', movement)
}, 1000 / 30)

socket.on('game update', function(players){
	ctx.clearRect(0, 0, width, height)
	for (var i = 0; i < level.length; i++) {//print level
		ctx.fillStyle = level[i].color;
		ctx.rect(level[i].x, level[i].y, level[i].width, level[i].height);
	}
	for(let i = 0;i < list.length; i++){
		let cPlayer = players[list[i][0]]
		if (cPlayer.online){
			ctx.fillStyle = cPlayer.color;
			ctx.fillRect(cPlayer.x, cPlayer.y, cPlayer.width, cPlayer.height);
			ctx.fillText(list[i][0], cPlayer.x, cPlayer.y)
		}
	}
})