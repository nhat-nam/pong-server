const WIDTH = 800;
const HEIGHT = 500;
const BALL_COUNT=1;
var pm = new ParticleManager(1000, PixiParticle);
const PADDLE_VEL = 100;
class Player{
  constructor(paddle){
    this.paddle = paddle;
    this.score = 0;
  }
  getPaddle(){
    return this.paddle;
  }
}

class WaitingScene extends Scene{
  constructor(w,h, renderer){
    super(w,h,renderer);
    this.time_to_start = 5000;
    this.circ = new Ball(400,250,10);
    this.gui_label = this.createLabel();
    this.ready = false;
    this.is_player_one = true;
  }
  updateLabel(){
    this.gui_label.renderable.position.x = 240;
    if(this.is_player_one){
      this.gui_label.renderable.text = "You are player 1. Game is beginning..."
    }else if(!this.is_player_one){
      this.gui_label.renderable.text = "You are player 2. Game is beginning..."
    }
  }
  resetLabel(){
    this.gui_label.renderable.position.x = 280;
    this.gui_label.renderable.text = 'Waiting for other player...';
  }
  createLabel(){
    var gui = new Node();
    gui.renderable = new PIXI.Text('Waiting for other player...',{fontFamily : 'Arial', fontSize: 18, fill : 0xffffff, align : 'center'});
    gui.renderable.position.x =280;
    gui.renderable.position.y =200;
    gui.getRenderable = function(){
      if(!this.renderable){
        this.renderable = new RectangleCTX(this.x, this.y, this.w, this.h);
        return this.renderable;
      }
      return this.renderable;
    }
    gui.setRenderable = function(r){this.renderable = r;}
    return gui;
  }
  load(){
    this.circ.setRadius(10);
    this.resetLabel();
    this.addChild(this.circ);
    this.addChild(this.gui_label);
    this.ready = false;
  }
  unload(){
    //remove all children
    this.nodes = [];
    //reset the renderer
    if(this.renderer && this.renderer.reset){
      //destroy this renderer's canvas and then we will draw again when scene loads
     // this.renderer.destroy(true);
      this.renderer.reset();
    }
  }
  update(delta){
    super.update(delta);
    if(this.ready){
      this.time_to_start-=delta;
      this.circ.setRadius((this.time_to_start/1000)*5);
    }
  }
}

class PixiScene extends Scene{
  constructor(w,h,renderer){
    super(w,h,renderer);
    this.ball = new Ball(400, 250, 4);
    this.ball.vel.x= -100;
    this.ball.vel.y = 0;
    
    this.paddle1 = new Paddle(10, 200, 10, 30);
    this.paddle2 = new Paddle(WIDTH-20, 200, 10, 30);

    // which paddle is mine????
    this.player = new Player(new Paddle(-100,-100, 1, 1));
    this.onlinePlayer = new Player(new Paddle(-100,-100, 1, 1));

    this.updates = [];
    this.update_cnt = 0;

    this.gui = new Node();
    this.gui.renderable = new PIXI.Text('0-0',{fontFamily : 'Arial', fontSize: 18, fill : 0xffffff, align : 'center'});
    this.gui.renderable.position.x =10;
    this.gui.renderable.position.y =5;
    this.gui.getRenderable = function(){
      if(!this.renderable){
        this.renderable = new RectangleCTX(this.x, this.y, this.w, this.h);
        return this.renderable;
      }
      return this.renderable;
    }
    this.gui.setRenderable = function(r){this.renderable = r;}
    //create input
    var obj = this;

    InputManager().listenForEvents();
  }
  load(){
    // set ball position to beginning
    this.ball.setPosition(400,250);
    this.ball.vel.x= -200;
    this.ball.vel.y = 200;
    this.paddle1.setPosition(10,200);
    this.paddle2.setPosition(WIDTH-20, 200);
    this.addChild(ParticleManager());
    this.addChild(this.ball);
    this.addChild(this.paddle1);
    this.addChild(this.paddle2);
    this.addChild(this.gui);

  }
  unload(){
    //remove all children
    this.nodes = [];
    //reset the renderer
    if(this.renderer && this.renderer.reset){
      //destroy this renderer's canvas and then we will draw again when scene loads
     // this.renderer.destroy(true);
      this.renderer.reset();
    }
      
  }
  render(ctx){}
  update(delta){
    super.update(delta);
    var myPaddle = this.player.getPaddle();

    // check that my Paddle stays in bounds of game. 
    if(myPaddle.pos.y <=0){
      myPaddle.pos.y=0;
    }else if(myPaddle.pos.y+myPaddle.h >=HEIGHT){
      myPaddle.pos.y = HEIGHT-myPaddle.h;
    }

    if(myPaddle.pos.x <50){
      this.gui.renderable.text = this.player.score + "-"+this.onlinePlayer.score;

    }else{
      this.gui.renderable.text = this.onlinePlayer.score+"-" +this.player.score;
    }

    var obj = this;
    if( InputManager().isKeyDown("ArrowUp") ){
      //if(this.player.getPaddle().vel.y != -1*PADDLE_VEL){
        obj.update_cnt++;
        var data_obj = {
          y_vel: -1*PADDLE_VEL,
          pos:{x: myPaddle.x, y:myPaddle.y},
          update_id: obj.update_cnt,
          timestamp: Date.now()
        };
        socket.emit("paddle", data_obj);
        obj.updates.push(data_obj);

      //}
      this.player.getPaddle().vel.y = -1*PADDLE_VEL;
    }else if( InputManager().isKeyDown("ArrowDown") ){
      //if(this.player.getPaddle().vel.y != PADDLE_VEL){
        obj.update_cnt++;
        var data_obj = {
          y_vel: PADDLE_VEL,
          pos:{x: myPaddle.x, y:myPaddle.y},
          update_id: obj.update_cnt,
          timestamp: Date.now()
        };
        socket.emit("paddle", data_obj);
        obj.updates.push(data_obj);
      //}      
      this.player.getPaddle().vel.y = PADDLE_VEL;
    }else{

      if(this.player.getPaddle().vel.y != 0){
        obj.update_cnt++;
        var data_obj = {
          y_vel: 0,
          pos:{x: myPaddle.x, y:myPaddle.y},
          update_id: obj.update_cnt,
          timestamp: Date.now()
        };
        socket.emit("paddle", data_obj);
        obj.updates.push(data_obj);
      }      
      this.player.getPaddle().vel.y = 0;
    }
    
      // only emit ball information if it hitsmy paddle. 

    if(this.ball.x-this.ball.radius <= 0){
      //score point for player 1 
      new ParticleBurst(this.ball.x, this.ball.y);
      this.ball.reset();
      if(this.player.getPaddle().x < 50){
        //emit event
        socket.emit("score",{});
      }


    }else if(this.ball.x +this.ball.radius>=WIDTH){
      //score point for player 2
      new ParticleBurst(this.ball.x, this.ball.y);
      this.ball.reset();
      if(this.player.getPaddle().x > WIDTH - 100){
        //emit event
        socket.emit("score",{});
      }

    }else{
      //.....
      if(this.ball.intersects(this.player.getPaddle())){
        if(this.player.getPaddle().x < 20){

          var scale = (this.ball.pos.y - this.player.getPaddle().pos.y) -15;
          var delta_v_y = scale*5;
          this.ball.vel.y = delta_v_y+this.ball.vel.y;
          this.ball.vel.x = Math.abs(this.ball.vel.x);

        }else{
          this.ball.vel.x = -1* Math.abs(this.ball.vel.x);  
          var scale = (this.ball.pos.y - this.player.getPaddle().pos.y) -15;
          var delta_v_y = scale*5;
          this.ball.vel.y = delta_v_y+this.ball.vel.y;
        }
        socket.emit("ball", {
          timestamp: Date.now(),
          pos: {x: this.ball.x, y: this.ball.y}, 
          vel: {x:this.ball.vel.x, y: this.ball.vel.y}
        });
      }
      
      if(this.ball.intersects(this.onlinePlayer.getPaddle())){
        if(!this.ball.stuck){
          //this.ball.stuck = true;
          this.ball.vel.x = 0;
          this.ball.vel.y = 0;
        }
      }
    }
  }

}


class Paddle extends RectBody2D{
  constructor(x,y,w,h){
    super(x,y,w,h);
    let r = new Graphics();
    r.beginFill(0xffffff);
    r.drawRect(0,0, this.w, this.h);
    r.endFill();
    r.x = this.x;
    r.y = this.y;
    r.alpha = .5;
    this.setRenderable(r);
  }
}

class Ball extends CircBody2D{
  constructor(x,y,r){
    super(x,y,r);
    this.stuck = false;

    // create the renderable for the ball
    var ccc = new Graphics();
    ccc.beginFill(0xffffff);
    ccc.drawCircle(0, 0, this.radius);
    ccc.endFill();
    ccc.x = this.x;
    ccc.y = this.y;
    ccc.alpha = .5;
    // set it
    this.setRenderable(ccc);

    this.trail = new ParticleEmitter(100,100);
    this.trail.emit_interval = 10;
    this.trail.burst_amount = 1;
      this.trail.min_angle = -.1
      this.trail.max_angle = .1;    
    this.addChild(this.trail);
  }
  setRadius(s){
    this.radius = s;
    var gr = this.getRenderable();
    gr.clear();
    gr.beginFill(0xffffff);
    gr.drawCircle(0, 0, this.radius);
    gr.endFill();
    gr.x = this.x;
    gr.y = this.y;
    gr.alpha = .5;
    // set it

  }
  reset(){
    this.setPosition(WIDTH/2, HEIGHT/2);
    this.vel.x = 0;
    this.vel.y = 0;
  }
  update(delta){
    super.update(delta);
    /*
    if(this.x > WIDTH || this.x < 0){
      this.vel.x *=-1;
    }
    */
    this.trail.x = this.x;
    this.trail.y = this.y;

    /*


        |
        |
        ------------

        tangent(vel_y / vel_x)



  ------o -->
       /
      /

    */
    if(this.vel.x <0){
      this.trail.min_angle = -.1
      this.trail.max_angle = .1;
    }else if(this.vel.x >0){
      this.trail.min_angle = Math.PI-.1;
      this.trail.max_angle = Math.PI+.1;
    }
    
    if(this.y+this.radius > HEIGHT){
      this.vel.y = -1*Math.abs(this.vel.y);
    }else if(this.y -this.radius < 0){
      this.vel.y = Math.abs(this.vel.y);
    }

  }
}

class Game{
  constructor(w,h){
    this.app = new Application({ 
        width: w, 
        height: h,                       
        antialias: true, 
        transparent: false, 
        resolution: 1
      }
    );
    this.default_renderer  = false;
    this.sceneManager = new SceneManager();

    this.inputManager = new InputManager(document.body);

    this.inputManager.settings.listen_to['contextmenu'] = false;
    this.inputManager.settings.listen_to['mousemove'] = false;
    this.inputManager.settings.listen_to['mousedown'] = false;
    this.inputManager.settings.listen_to['mouseup'] = false;
    this.inputManager.settings.listen_to['keypress'] = false;



    //create a PixiRenderer
    var pixi_renderer = new PixiRenderer(WIDTH,HEIGHT,this.app.stage);

    this.waitingScene = new WaitingScene(WIDTH, HEIGHT,pixi_renderer);
    this.sceneManager.addScene("wait", this.waitingScene);

    var s = new PixiScene(WIDTH,HEIGHT,pixi_renderer);
    var pm =new ParticleManager(1000);
    pm.setRenderable(new Container());

    this.sceneManager.addScene("main", s);
    this.sceneManager.changeScene("wait");
  }
  run(){
    var g = this;
    document.body.appendChild(g.app.view);
    this.app.ticker.add(delta => g.loop(delta));
  }
  loop(delta){
    if(this.default_renderer){
      this.update(delta);
      this.render(ctx);
      var gm = this;
      window.requestAnimationFrame(function(){gm.loop(delta)});
    }else{
      delta = (delta/60)*1000;
      this.update(delta);
    }
  }
  update(delta){
    this.sceneManager.update(delta);
  }
  render(ctx){
    this.sceneManager.render(ctx);
  }
}

//Aliases
let Application = PIXI.Application,
    Container = PIXI.Container,
    Graphics = PIXI.Graphics,
    loader = PIXI.Loader.shared,
    resources = loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    PSprite = PIXI.Sprite,
    Rectangle = PIXI.Rectangle;

 var g;
 var g2;
var gameStartTO;

var latency, startTime;

loader
  .load(setup);

function setup() {
  g = new Game(WIDTH,HEIGHT);
  g.run();
  socket.on("invalid_room", function(){
    alert("Invalid room id. Only alphanumeric characters allowed and max length is 16");
  });
  socket.on("quit", function(){
    clearTimeout(gameStartTO);
    g.sceneManager.getScene("wait").ready = false;
    g.sceneManager.changeScene("wait");
  });
  socket.on("spectate", function(){
    // i am a spectator....
    g.sceneManager.changeScene("main");
    InputManager().stopListening();

  });

  startTime = Date.now();
  
  socket.on('ready_to_start', function(data){
    if(socket.id == data.player_1){
      // i am player 1
      g.sceneManager.getScene("main").player = new Player(g.sceneManager.getScene("main").paddle1);
      g.sceneManager.getScene("main").onlinePlayer = new Player(g.sceneManager.getScene("main").paddle2);

      g.sceneManager.getScene("wait").is_player_one = true;
      g.sceneManager.getScene("wait").updateLabel();
      
    }else if(socket.id == data.player_2){
      g.sceneManager.getScene("main").player = new Player(g.sceneManager.getScene("main").paddle2);
      g.sceneManager.getScene("main").onlinePlayer = new Player(g.sceneManager.getScene("main").paddle1);
      
      g.sceneManager.getScene("wait").is_player_one = false;
      g.sceneManager.getScene("wait").updateLabel();

    }else{
      // i am an observer
      g.sceneManager.getScene("main").player = new Player(g.sceneManager.getScene("main").paddle1);
      g.sceneManager.getScene("main").onlinePlayer = new Player(g.sceneManager.getScene("main").paddle2);
    }

    socket.on("game_state", function(data){
      var gScene = g.sceneManager.getScene("main");
      var p_1 = gScene.player.getPaddle();
      var p_2 = gScene.onlinePlayer.getPaddle();
      var ball = gScene.ball;

      //handle the score...
      if(data.player_1 == socket.id){
        gScene.player.score =  data.score.player_1;
        gScene.onlinePlayer.score =  data.score.player_2;
      }else if(data.player_2 == socket.id){
        // here...
        gScene.player.score =  data.score.player_2;
        gScene.onlinePlayer.score =  data.score.player_1;
      }else{
        gScene.player.score =  data.score.player_1;
        gScene.onlinePlayer.score =  data.score.player_2;
      }
      
      // handle the ball state.....trust the server 
      if(true || ball ){
        
        ball.setPosition(data.ball.position.x, data.ball.position.y);
        ball.vel.y = data.ball.velocity.y;
        ball.vel.x = data.ball.velocity.x;
      }
      
      if(data.player_1 == socket.id){
        //this player is player 1
        // DO NOT DO THIS...
        // gScene.updates 
        // our server needs to send UPDATE_ID
        // if the last update in gScene.updates == the id of the last id in game_state, then we're done.

        //my own paddle......server caught up to my inputs...listen to server.

        if(data.paddle_1.update_id == gScene.update_cnt){
          p_1.setPosition(data.paddle_1.position.x, data.paddle_1.position.y);
          p_1.vel.y = data.paddle_1.velocity.y;
        }else{
          // this means, the server hasn't yet updated to the same 
          //  inputs that the client has sent. 
          var server_update_id = data.paddle_1.update_id;
          var client_update = null;
          for(var i=0;i<gScene.updates.length;i++){
            var update = gScene.updates[i];
            if(update.update_id == server_update_id){
              //found our update...
              client_update = update;
              gScene.updates.splice(0,i);
              break;
            }
          }
          var paddle_p = {x: data.paddle_1.position.x,y:data.paddle_1.position.y};
          var paddle_v_y = data.paddle_1.velocity.y;
          
          var time_stamp = client_update.timestamp;
          var update = null;
          for(var i=0;i<gScene.updates.length;i++){
            update = gScene.updates[i];
            if(update.update_id != client_update.update_id){

              var delta = update.timestamp - time_stamp;
              time_stamp = update.timestamp; 
              var new_y = paddle_p.y + paddle_v_y*(delta/1000);
              paddle_p.y = new_y;
              paddle_v_y = update.y_vel;
            }
          }
          p_1.setPosition(paddle_p.x, paddle_p.y);
          p_1.vel.y = paddle_v_y;
        }

        //listen to server. 
        p_2.setPosition(data.paddle_2.position.x, data.paddle_2.position.y);
        p_2.vel.y = data.paddle_2.velocity.y;

      }else if(data.player_2 == socket.id){
        //this p layer is player 2
        if(data.paddle_2.update_id == gScene.update_cnt){
          p_1.setPosition(data.paddle_2.position.x, data.paddle_2.position.y);
          p_1.vel.y = data.paddle_2.velocity.y;
        }else{
          // this means, the server hasn't yet updated to the same 
          //  inputs that the client has sent. 
          var server_update_id = data.paddle_2.update_id;
          var client_update = null;
          for(var i=0;i<gScene.updates.length;i++){
            var update = gScene.updates[i];
            if(update.update_id == server_update_id){
              //found our update...
              client_update = update;
              gScene.updates.splice(0,i);
              break;
            }
          }
          // RECONCILIATION
          // only if client update position != server update position 

          var paddle_p = {x: data.paddle_2.position.x,y:data.paddle_2.position.y};
          var paddle_v_y = data.paddle_2.velocity.y;
          
          var time_stamp = client_update.timestamp;
          var update = null;
          for(var i=0;i<gScene.updates.length;i++){
            update = gScene.updates[i];
            if(update.update_id != client_update.update_id){

              var delta = update.timestamp - time_stamp;
              time_stamp = update.timestamp; 
              var new_y = paddle_p.y + paddle_v_y*(delta/1000);
              paddle_p.y = new_y;
              paddle_v_y = update.y_vel;
            }
          }

          p_1.setPosition(paddle_p.x, paddle_p.y);
          p_1.vel.y = paddle_v_y;
        }

          p_2.setPosition(data.paddle_1.position.x, data.paddle_1.position.y);
          p_2.vel.y = data.paddle_1.velocity.y;

      }else{
        var p_1 = gScene.paddle1;
        var p_2 = gScene.paddle2;
        // i am a spectator...
        p_1.setPosition(data.paddle_1.position.x, data.paddle_1.position.y);
        p_1.vel.y = data.paddle_1.velocity.y;
        p_2.setPosition(data.paddle_2.position.x, data.paddle_2.position.y);
        p_2.vel.y = data.paddle_2.velocity.y;
      }

    });

    socket.on("next_ball", function(data){

      if(data.b_vel_x < 0){
        g.sceneManager.getScene("main").ball.trail.min_angle = -.1
        g.sceneManager.getScene("main").ball.trail.max_angle = .1;

      } else if(data.b_vel_x >0){
        g.sceneManager.getScene("main").ball.trail.min_angle = Math.PI-.1;

        g.sceneManager.getScene("main").ball.trail.max_angle = Math.PI+.1;
      }
       setTimeout(function(){
          g.sceneManager.getScene("main").ball.vel.x = data.b_vel_x;
          g.sceneManager.getScene("main").ball.vel.y = data.b_vel_y;
        }, data.begin_at - Date.now())
    })

    socket.on('ball_state', function(data){
      var x = data.pos.x; 
      var y = data.pos.y;
      var clockDelta =289;
      var delta;

      g.sceneManager.getScene("main").ball.setPosition(x, y);
      g.sceneManager.getScene("main").ball.vel.x = data.vel.x;
      g.sceneManager.getScene("main").ball.vel.y = data.vel.y;
      g.sceneManager.getScene("main").ball.stuck = false;

    });


    g.sceneManager.getScene("wait").time_to_start = data.begin_at - Date.now();
    g.sceneManager.getScene("wait").ready = true;
    gameStartTO = setTimeout(function(){
      g.sceneManager.changeScene("main");
    }, data.begin_at - Date.now() );
    
  });


}
