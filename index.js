var app = require("express")();
var http = require("http").createServer(app);
var io = require('socket.io')(http, {pingInterval:5000});

//socket.to(ROOM) doesn't send to sender..

// use io.in(ROOM) to send to all


app.use(require("express").static('public'));

let clients = {};
let player_1 = null;
let player_2 = null;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

function randomVelocity(){
  // create a random speed for the ball. 
  var vel_x = 200 + Math.random()*50;
  if(Math.random() > .5){
    vel_x = vel_x * -1;
  }
  var vel_y = 200 + Math.random()*50;
  if(Math.random() > .5){
    vel_y = vel_y * -1;
  }
  return { x: vel_x, y:vel_y};
}

class Room{
  constructor(id){
    this.id = id;
    this.player_1 = null;
    this.player_2 = null;
    this.started_already = false;
    this.gameState = null;
  }
  loop(){
    var now = Date.now();
    var delta = Date.now() - this.gameState.timestamp;  
    this.gameState.update(delta);
    this.gameState.timestamp = now;
    io.in(this.id).emit("game_state", this.gameState.getState());
  }
  resetGame(){
    this.gameState = null;
    this.gameState =  new GameState();
    this.gameState.room = this;
  }
}
class GameUpdate{
  constructor(data_obj, n){
      this.paddle_1 = {};
      this.paddle_2 = {};
      this.ball = {};
      if(n == 1){

        this.paddle_1 = {
          update_timestamp: data_obj.timestamp,
          update_id: data_obj.update_id,
          position: {
            x: data_obj.pos.x, 
            y: data_obj.pos.y
          },
          velocity: {
            x: 0,
            y: data_obj.y_vel
          }
        };

      }else if(n ==2){
        this.paddle_2 = {
          update_timestamp: data_obj.timestamp,
          update_id: data_obj.update_id,
          position: {
            x: data_obj.pos.x, 
            y: data_obj.pos.y
          },
          velocity: {
            x: 0,
            y: data_obj.y_vel
          }
        };
      }
  }
}
class GameState{
  constructor(){
    this.player_1_score =0;
    this.player_2_score =0 ;
    this.timestamp = Date.now();
    this.ball = {
        position: {x: 400, y:250 },
        velocity: {x: 0, y:0 }
      };
    this.paddle_1 =  {
        update_timestamp: 0,
        update_id: 0,
        position: {x: 10, y:200 },
        velocity: {x: 0, y:0 }
      };
    this.paddle_2 = {
        update_timestamp: 0,
        update_id: 0,
        position: {x:780, y:200 },
        velocity: {x: 0, y:0 }
      };
    this.room = null;

    this.updates_p1 = [];
    this.updates_p2 = [];
    this.update_id_p1;
    this.update_id_p2;
    this.ref_timestamp_p1 =0;
    this.ref_timestamp_p2 =0;
  }
  update(delta){

    // update the ball...
    // 100 ms.
    // server delta is approx. 100ms.
    

    // we know where the ball should be after 100ms. 
    

    var current_server_timestamp = Date.now();
    
    var preupdate_server_timestamp = current_server_timestamp - delta;

    var paddle_1_time_positions = [];
    paddle_1_time_positions.push(
          {
            position: {
              x: this.paddle_1.position.x,
              y: this.paddle_1.position.y
            },
            timestamp: preupdate_server_timestamp
          }
        );
    /// every 100 ms. 
    // run all of the updates inside of updates_p1 and updates_p2
    var server_update_timestamp = preupdate_server_timestamp;

    for(var i=0;i<this.updates_p1.length;i++){
      var up = this.updates_p1[i];
      // validate that up.velocity.x is allowed..
      //up.paddle_1.update_id, velocity
      if(this.ref_timestamp_p1 == 0 || (this.paddle_1.velocity.y == 0 && up.paddle_1.velocity.y != 0) ){
        this.ref_timestamp_p1 = up.paddle_1.update_timestamp;
        this.paddle_1.velocity.y = up.paddle_1.velocity.y;
      }else{
        var dd = up.paddle_1.update_timestamp - this.ref_timestamp_p1;
        this.paddle_1.position.y = this.paddle_1.position.y + this.paddle_1.velocity.y *(dd/1000);
        this.paddle_1.velocity.y = up.paddle_1.velocity.y;
        this.ref_timestamp_p1 = up.paddle_1.update_timestamp;

        //check that paddle stays in bounds of game.
        if(this.paddle_1.position.y <=0){
          this.paddle_1.position.y = 0;
        }else if(this.paddle_1.position.y +30 >= 500){
          this.paddle_1.position.y = 470;
        }
        
        server_update_timestamp+= dd;
        paddle_1_time_positions.push(
          {
            position: {
              x: this.paddle_1.position.x,
              y: this.paddle_1.position.y
            },
            timestamp: server_update_timestamp
          }
        );

      }
      this.paddle_1.update_id = up.paddle_1.update_id;
      this.update_id_p1 = up.paddle_1.update_id;
    }

    // check ball interesction with paddle in past and present.
    paddle_1_time_positions.push(
          {
            position: {
              x: this.paddle_1.position.x,
              y: this.paddle_1.position.y
            },
            timestamp: current_server_timestamp
          }
        );
    this.updates_p1 = [];

    var paddle_2_time_positions = [];
    var server_update_timestamp = preupdate_server_timestamp;
    paddle_2_time_positions.push(
          {
            position: {
              x: this.paddle_1.position.x,
              y: this.paddle_1.position.y
            },
            timestamp: preupdate_server_timestamp
          }
    );

    for(var i=0;i<this.updates_p2.length;i++){
      var up = this.updates_p2[i];
      // validate that up.velocity.x is allowed..
      //up.paddle_1.update_id, velocity
      if(this.ref_timestamp_p2 == 0 || (this.paddle_2.velocity.y == 0 && up.paddle_2.velocity.y != 0) ){
        this.ref_timestamp_p2 = up.paddle_2.update_timestamp;
        this.paddle_2.velocity.y = up.paddle_2.velocity.y;
      }else{
        var dd = up.paddle_2.update_timestamp - this.ref_timestamp_p2;
        this.paddle_2.position.y = this.paddle_2.position.y + this.paddle_2.velocity.y *(dd/1000);
        this.paddle_2.velocity.y = up.paddle_2.velocity.y;
        this.ref_timestamp_p2 = up.paddle_2.update_timestamp;

        //check that paddle stays in bounds of game.
        if(this.paddle_2.position.y <=0){
          this.paddle_2.position.y = 0;
        }else if(this.paddle_2.position.y +30 >= 500){
          this.paddle_2.position.y = 470;
        }

        server_update_timestamp+= dd;
        paddle_2_time_positions.push(
          {
            position: {
              x: this.paddle_2.position.x,
              y: this.paddle_2.position.y
            },
            timestamp: server_update_timestamp
          }
        );

      }
      this.paddle_2.update_id = up.paddle_2.update_id;
      this.update_id_p2 = up.paddle_2.update_id;
    }
    paddle_2_time_positions.push(
          {
            position: {
              x: this.paddle_2.position.x,
              y: this.paddle_2.position.y
            },
            timestamp: current_server_timestamp
          }
        );
    this.updates_p2 = [];


    var denom = Math.floor(delta/16);
    var server_update_timestamp = preupdate_server_timestamp;
    for(var i=0;i<denom;i++){
      // temp_delta is approx 16ms.
      var tmp_delta = delta/denom;
      server_update_timestamp += tmp_delta;
      var delta_x = this.ball.velocity.x * (tmp_delta/1000);
      var delta_y = this.ball.velocity.y * (tmp_delta/1000); 
      this.ball.position.x = this.ball.position.x + delta_x;
      this.ball.position.y = this.ball.position.y + delta_y;

      // does ball intersect a paddle? 
      var b_p = this.ball.position;

      // check paddle_intersection at what time????? @ server time = server_update_timestamp
      var p_t_positions;
      if(b_p.x < 400){
        // paddle 1
        p_t_positions = paddle_1_time_positions;
      }else{
        // paddle_2
        p_t_positions = paddle_2_time_positions;
      }
      for(var j=0;j<p_t_positions.length;j++){
        var ptp = p_t_positions[j];
        if(ptp.timestamp < server_update_timestamp){
          continue;
        }else{
          var p_1_p = ptp.position;
          if( b_p.x + 4 >= p_1_p.x &&  b_p.x - 4 <= p_1_p.x + 10 
              && b_p.y +4 >= p_1_p.y && b_p.y-4 <= p_1_p.y + 30){
            // intersects paddle 1
            if(b_p.x < 400){
              //this.ball.velocity.y = this.ball.velocity.y + (-4 * Math.random()*8);

              var scale = (b_p.y - p_1_p.y) -15;
              var delta_v_y = scale*5;
              this.ball.velocity.y = delta_v_y+this.ball.velocity.y;

              this.ball.velocity.x = Math.abs(this.ball.velocity.x);     
            }else{
              //intersect paddle 2
              //this.ball.velocity.y = this.ball.velocity.y + (-4 * Math.random()*8);
              var scale = (b_p.y - p_1_p.y) -15;
              var delta_v_y = scale*5;
              this.ball.velocity.y = delta_v_y+this.ball.velocity.y;

              this.ball.velocity.x = -1*Math.abs(this.ball.velocity.x);     
            }
          }
        }
      }
      

      // does ball intersect a wall? 
      if(this.ball.position.y >= 500){
        this.ball.velocity.y = -1* Math.abs(this.ball.velocity.y);
      }else if(this.ball.position.y <=0){
        this.ball.velocity.y = Math.abs(this.ball.velocity.y);
      }

      // must reset the ball and then emit a score event to clients. 
      if(this.ball.position.x <=0 || this.ball.position.x>=800){
        // scored??
        if(this.ball.position.x <=0){
          //player_2 scored
          this.player_2_score++;
        }else{
          //player 1 scored....
          this.player_1_score++;
        }

        var vel = randomVelocity();
        vel_x = vel.x;
        vel_y = vel.y;
        // delay 4 seconds then ball starts again.
        this.ball.velocity.x = 0;
        this.ball.velocity.y = 0;
        this.ball.position.x = 400;
        this.ball.position.y = 250;
        var ball = this.ball;
        setTimeout(function(){
          ball.velocity.x = vel_x;
          ball.velocity.y = vel_y;
        },4000);
      }

    }
  }
  getState(){

    return {
      player_1: this.room.player_1,
      player_2: this.room.player_2,
      score: {
        player_1: this.player_1_score,
        player_2: this.player_2_score
      },
      ball: {
        position: {
          x: this.ball.position.x,
          y: this.ball.position.y
        },
        velocity: {
          x: this.ball.velocity.x,
          y: this.ball.velocity.y
        }
      },
      paddle_1: {
        update_timestamp: this.paddle_1.update_timestamp,
        update_id: this.paddle_1.update_id,
        position: {
          x: this.paddle_1.position.x,
          y: this.paddle_1.position.y
        },
        velocity: {
          x: this.paddle_1.velocity.x,
          y: this.paddle_1.velocity.y
        }
      },
      paddle_2: {
        update_timestamp: this.paddle_2.update_timestamp,
        update_id: this.paddle_2.update_id ,
        position: {
          x: this.paddle_2.position.x,
          y: this.paddle_2.position.y
        },
        velocity: {
          x: this.paddle_2.velocity.x,
          y: this.paddle_2.velocity.y
        }
      }
    }

  }
}

let rooms = [];

let started_already = false;
io.on('connection', (socket) => {
  var room = null;
  var room_id;

  // handle input from users. 
  socket.on("paddle", (data)=>{
    if(!room){
      return;
    }
    data['socket_id'] = socket.id;
    if(socket.id == room.gameState.room.player_1){
      var this_update = new GameUpdate(data, 1);
      room.gameState.updates_p1.push(this_update);
      // save the update_no
    }else if(socket.id == room.gameState.room.player_2){
      var this_update = new GameUpdate(data, 2);
      room.gameState.updates_p2.push(this_update);
    }
  });



  socket.on("join_room", function(data){
    // escape data.id...pass it through a function to validate

    var validEx = /[^a-z\d\s]/i;
    var isValid = !validEx.test(data.id);
    if(!isValid || data.id.length>16){
      socket.emit("invalid_room");
      return;
    }

    // also search rooms to see if player was already in a room. 
    if(data.id){
      var new_room = null;
      room_id = data.id;
      //find that room
      var previous_rooms = [];
      for(var i=0;i<rooms.length;i++){
        //remove this player from his other rooms
        if(socket.id == rooms[i].player_1 || socket.id==rooms[i].player_2){
          if(socket.id == rooms[i].player_1){
            rooms[i].player_1 = null;
            rooms[i].ready_to_start = false;
            rooms[i].started_already = false;
            clearInterval(rooms[i].intervalId);
            rooms[i].resetGame();
            io.in(rooms[i].id).emit("quit", {});
          }else{
            rooms[i].player_2 = null;
            rooms[i].ready_to_start = false;
            rooms[i].started_already = false;
            clearInterval(rooms[i].intervalId);
            rooms[i].resetGame();
            io.in(rooms[i].id).emit("quit", {});
          }
          // leave the previous channel.
          socket.leave(rooms[i].id);
        }
        if(rooms[i].id == data.id){
          //found the room
          new_room = rooms[i];
        }
      }

      // create a new room if this room does not exist
      if(!new_room){
        room = new Room(data.id);
        rooms.push(room);
      }else{
        room = new_room;
      }

      // player is already in room
      if(socket.id == room.player_1 || socket.id == room.player_2){
        return;
      }

      // join the Socket.io channel.
      socket.join(room.id);

      // set player_1 or player_2 id for this room. 
      if(room.player_1 == null){
        room.player_1 = socket.id;
      }else if(room.player_2 == null){
        room.player_2 = socket.id;
      }
      clients[socket.id] = socket;

      if(room.player_1 && room.player_2 && !room.started_already) {
        // create a new GameState for the room 
        room.gameState = new GameState();
        room.gameState.room = room;
        room.started_already = true;
        var data_obj = {
            player_1: room.player_1,
            player_2: room.player_2,
            begin_at: Date.now() + 3000
          };
        
        var vel = randomVelocity();
        vel_x = vel.x;
        vel_y = vel.y;


        // start updating this game state in 5 seconds. 
        setTimeout(function(){
          if(room && room.gameState && room.gameState.ball){
            room.gameState.ball.velocity.x = vel_x;
            room.gameState.ball.velocity.y = vel_y;
          }
        }, 5000);



        // tell the clients the game is about to start. 
        io.in(room.id).emit("ready_to_start", 
          data_obj
        );

        room.intervalId = setInterval(
          function(){
            room.loop();
        },100);

      }else if(room.player_1 && room.player_2 ){
        // this client is a spectator...
        socket.emit("spectate");
        socket.emit("ready_to_start",  {
            player_1: room.player_1,
            player_2: room.player_2,
            begin_at: Date.now()
          });
      }
    }// end if data.id
  });
  
  socket.on('disconnect', ()=>{
    if(!room){
      return;
    }
    if(socket.id == room.player_1){
      room.player_1 = null;
      room.started_already = false;
      clearInterval(room.intervalId);
      room.resetGame();
      io.in(room.id).emit("quit", {});
    }else if(socket.id == room.player_2){
      room.player_2 = null;
      room.started_already = false;
      clearInterval(room.intervalId);
      room.resetGame();
      io.in(room.id).emit("quit", {});
    }

    // delete empty rooms from array
    //if(room.player_1 == null && room.player_2 == null){
      for(var i=0;i<rooms.length;i++){

        if(rooms[i].player_1 == null && rooms[i].player_2 == null){
          clearInterval(rooms[i].intervalId);
          rooms.splice(i,1);
          i--;
        }
      }
    //}
  });
});


http.listen(3000, () => {
  console.log("listening on *:3000");
})