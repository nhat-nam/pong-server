/* GAME ENGINE */
  class Vector2D{
    constructor(x,y){
      this.x = x;
      this.y = y;
    }
    add(vec){
      // vector addition
      this.x = this.x + vec.x;
      this.y = this.y + vec.y;
    }
    scaled(factor){
      return new Vector2D(this.x*factor, this.y*factor);
    }
  }
  class Point2D{
    constructor(x,y){
      this.x = x;
      this.y = y;
    }
  }

// Node -> CanvasNode -> Body2D -> RectBody2D -> Player 
  class Node {
    constructor(){
      this.child_nodes=[];
      this._parent = null;
    }
    addChild(node){
      node._parent = this;
      this.child_nodes.push(node);
    }
  }
  class CanvasNode extends Node{
    constructor(){
      super();
      /* 

        this.settings = {
          strokeStyle = 
          widthfill
          fill style =
        }
      */
    }
    applySettings(ctx){
      //ctx.fillStyle = this.settings.fillStyle;
    }
    render(ctx){
      // render all children
      ctx.save();
      this.applySettings(ctx);
      ctx.translate(this.x, this.y);
      /*
          All child nodes use relative positioning. 
            + All coordinates in child node assume that the parent node's (x,y) is the child's origin (0,0).
            - Require us to add a function to find the absolutePosition of any node. 
              (10, 10) + parent.absolutePosition()
      */
      for(var i=0;i<this.child_nodes.length;i++){

        this.child_nodes[i].render(ctx);
      }
      
      ctx.restore();
    }
  }

  class Segment{
    constructor(x,y,x2,y2){
      this.p1 = new Point2D(x,y);
      this.p2 = new Point2D(x2,y2);
      this.length;
      this.length = this.distance();
    }
    shift(dx,dy){
      this.p1.x = this.p1.x + dx;
      this.p1.y = this.p1.y + dy;
      this.p2.x = this.p2.x + dx;
      this.p2.y = this.p2.y + dy;
    }
    distance(){
      if(typeof this.length != 'undefined') return this.length;
      return Math.sqrt((this.p2.x-this.p1.x)*(this.p2.x-this.p1.x) + (this.p2.y-this.p1.y)*(this.p2.y-this.p1.y));
    }
    intersects(segment){
      var x1 = this.p1.x;
      var y1 = this.p1.y;
      var x2 = this.p2.x;
      var y2 = this.p2.y;

      var x3 = segment.p1.x;
      var y3 = segment.p1.y;
      var x4 = segment.p2.x;
      var y4 = segment.p2.y;

      // calculate the direction of the lines
      var uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
      var uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));

      // if uA and uB are between 0-1, lines are colliding
      if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {

        // optionally, draw a circle where the lines meet
        var intersectionX = x1 + (uA * (x2-x1));
        var intersectionY = y1 + (uA * (y2-y1));
        return true;
      }
      return false;

    }
  }

  class Body2D extends CanvasNode{
    constructor(x,y){
      super();
      this.pos = new Vector2D(x,y);
      this.vel = new Vector2D(0,0);
      this.acc = new Vector2D(0,0);
      this.x = x;
      this.y = y;
      this._deltaX=0;
      this._deltaY=0;
      this.rotation = 0;  // 0 -> 2pi  === (deg/360) * 2pi
      // velocity, acceleration
      // 
    }
    setPosition(x,y){
      this._deltaY = y - this.y;
      this.pos.y = y;
      this.y = this.pos.y;

      this._deltaX = x - this.x;
      this.pos.x = x;
      this.x = this.pos.x;
      for(var i=0;i<this.child_nodes.length;i++){
        var tmp_node = this.child_nodes[i];
        if(typeof(tmp_node.setPosition) != 'undefined'){
          //tmp_node.setPosition(tmp_node.x + this._deltaX, tmp_node.y + this._deltaY);
        }
      }
    }
    getAbsolutePosition(){
      if(this._parent == null){
        return new Point2D(this.x, this.y);
      }
      var x = this.x;
      var y = this.y;
      var parent_pos = this._parent.getAbsolutePosition();
      return new Point2D(x + parent_pos.x, y + parent_pos.y);
    }
    update(delta){
      // update acceleration
      // update velocity 
      // update position 
      
      this.vel.add(this.acc.scaled(delta/1000));
      this.pos.add(this.vel.scaled(delta/1000));
      this._deltaX = this.pos.x - this.x;
      this._deltaY = this.pos.y - this.y;
      this.x = this.pos.x;
      this.y = this.pos.y;

      //update all child nodes
      for(var i =0;i<this.child_nodes.length;i++){
        var tmp_node = this.child_nodes[i];
        //what is this??? 
        if(typeof(this._deltaX) != 'undefined'){
          if(typeof(tmp_node.setPosition) != 'undefined'){
            //tmp_node.setPosition(tmp_node.x + this._deltaX, tmp_node.y + this._deltaY);
          }
        }
        tmp_node.update(delta);
      }
    }
    intersects(body_2d){
      // does this 2d object, intersect with body_2d
      // both rectangles...
      //console.log("**");
      if(this._className == body_2d._className && 
          body_2d._className == 'RectBody2D'){
        // rotations are 0
        if(this.rotation == 0 && body_2d.rotation == 0){
          if(body_2d.x < this.x + this.w
            && body_2d.x + body_2d.w > this.x
            && body_2d.y < this.y + this.h
            && body_2d.y + body_2d.h > this.y){
            
            return true;
          }
        }else{
          // do any of the lines intersect? 
          for(var i=0;i<this.sides.length;i++){
            var side1 = this.sides[i];
            for(var j =0;j<body_2d.sides.length;j++){
              var side2 = body_2d.sides[j];
              if(side1.intersects(side2)){
                return true;
              }
            }
          }
          // is one completely inside the other....
        }
        // else....check if lines intersect...
      }else if (this.constructor.name == body_2d.constructor.name && body_2d.constructor.name == 'CircBody2D'){
        // both circles....
      }else{
        /// one circle, one rectangle....
        var circ; 
        var rect; 
        if(body_2d.constructor.name == 'CircBody2D'){
          circ = body_2d;
          rect = this;
          
        }else{
          circ = this;
          rect = body_2d;
        }
        if(rect.rotation == 0 && rect.constructor.name == 'RectBody2D'){
          // no need to check all the sides... we can check easier...
          if(circ.x - circ.radius < rect.x + rect.w
            && circ.x + circ.radius > rect.x
            && circ.y - circ.radius < rect.y + rect.h
            && circ.y + circ.radius > rect.y){
            return true;
          }
        }else{
          // ax + by + c = 0;
          for(var i =0 ;i<rect.sides.length;i++){
            var side = rect.sides[i];
            var length = side.distance();
            var A = side.p1;
            var B = side.p2;
            var alpha = (1/(length*length))*(( B.x - A.x)*(circ.x-A.x) +  (B.y-A.y)*(circ.y-A.y) )
            var m_point_x = A.x + (B.x - A.x)*alpha;
            var m_point_y = A.y + (B.y - A.y)*alpha;

            var dist = Math.sqrt(
              Math.pow( circ.x - m_point_x  ,2) + 
              Math.pow( circ.y - m_point_y, 2) 
            );
            if(dist <= circ.radius){
              var dist_a_m = Math.sqrt(Math.pow(A.x - m_point_x, 2) + Math.pow(A.y-m_point_y,2));
              var dist_b_m = Math.sqrt(Math.pow(B.x - m_point_x, 2) + Math.pow(B.y-m_point_y,2));

              if( dist_a_m <= length &&  dist_b_m <= length){
                // return which side intersects???
                return true;
              }else{
                // closest point is not in segment...maybe an endpoitn is. 
                var dist_a_c = Math.sqrt(Math.pow(A.x - circ.x, 2) + Math.pow(A.y-circ.y,2));
                if(dist_a_c <= circ.radius){
                  return true;
                }
                var dist_b_c = Math.sqrt(Math.pow(B.x - circ.x, 2) + Math.pow(B.y-circ.y,2));
                if(dist_b_c<= circ.radius){
                  return true;
                }
              }
            }
          }   
        }  
      }
      return false;
    }
    render(ctx){
      super.render(ctx);
    }
  }

  class RenderableCTX{
    constructor(x,y){
      this.x = x;
      this.y =y;
      this.rotation = 0;
      this.stroke = true;
      this.fill = false;
      this.color = {
        r: 0,
        g: 0,
        b: 0,
        a: 1
      }
    }
    render(ctx){

    }
  }
  



  class CircleCTX extends RenderableCTX{
    constructor(x,y,r){
      super(x,y);
      this.radius = r;
    }
    render(ctx){
      super.render(ctx);
      ctx.save();
      //this.loadSettings();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);

      if(this.stroke){
        ctx.strokeStyle="rgba("+this.color.r+
                      ","+this.color.g+
                      ","+this.color.b+
                      ","+this.color.a+")";
        ctx.stroke();
      }
      if(this.fill){
        ctx.fillStyle = "rgba("+this.color.r+
                      ","+this.color.g+
                      ","+this.color.b+
                      ","+this.color.a+")";
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class RectangleCTX extends RenderableCTX{
    constructor(x,y,w,h){
      super(x,y);
      this.w = w;
      this.h = h;
    }
    getCenter(){
      return new Point2D(this.x + this.w/2, this.y + this.h/2);
    }
    render(ctx){
      super.render(ctx);
      ctx.save(); 
      if(this.rotation == 0){
        ctx.strokeRect(this.x, this.y, this.w, this.h);
      }else{
        var center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(this.rotation);
        ctx.strokeRect(this.w/-2, this.h/-2, this.w, this.h);
      }
      ctx.restore();
    }
  }

  class CollectionCTX extends RenderableCTX{
    constructor(x,y){
      super(x,y);
      this.nodes=[];
    }
    addChild(node){
      this.nodes.push(node);
    }
    removeChildAt(i){
      this.nodes.splice(i,1);
    }
    render(ctx){
      super.render(ctx);
      ctx.save();
      for(var i=0;i<this.nodes.length;i++){
        this.nodes[i].render(ctx);
      }
      ctx.restore();
    }
  }

  class CircBody2D extends Body2D{
    constructor(x,y, r){
      super(x,y);
      this.radius = r;
      this._className = 'CircBody2D';
    }
    getRenderable(){
      if(!this.renderable){
        this.renderable = new CircleCTX(this.x, this.y, this.radius);
        return this.renderable;
      }
      return this.renderable;
    }
    setRenderable(r){
      this.renderable = r;
    }
    update(delta){
      super.update(delta);
      //update renderable...
      if(this.renderable){
        this.renderable.x = this.x;
        this.renderable.y = this.y;
      }
    }
    render(ctx){
      console.log("***");
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
      super.render(ctx);
    }
  }

  class RectBody2D extends Body2D{
    constructor(x,y, width, height){
      super(x,y);
      this._className = 'RectBody2D';
      this.w = width;
      this.h = height;
      this.sides = [];
      this.center = this.getCenter();
      this.getSides(true);
    }
    getRenderable(){
      if(!this.renderable){
        this.renderable = new RectangleCTX(this.x, this.y, this.w, this.h);
        return this.renderable;
      }
      return this.renderable;
    }
    setRenderable(r){
      this.renderable = r;
    }    
    getCenter(){
      return new Point2D(this.x + this.w/2, this.y + this.h/2);
    }
    rotate(r){
      this.rotation = this.rotation + r;
      if(!this.renderable){
        this.renderable.rotation = this.rotation;
      }
      this.getSides(true);
    }
    setPosition(x, y){
      super.setPosition(x,y);
      this.getSides(true);
    }
    getSides(forceCalculation){
      if(!forceCalculation && this.sides.length == 4){
        return this.sides;
      }

      if(this.sides.length == 4 && this.rotation==0){
        for(var i=0;i<this.sides.length;i++){
          this.sides[i].shift(this._deltaX,this._deltaY);
        }
        return this.sides;
      }


      // center of rect....
      var c = this.getCenter();
      var p = c.x;
      var q = c.y;
      var new_x = (this.x-p)*Math.cos(this.rotation)+(this.y-q)*Math.sin(this.rotation)+p;
      var new_y = -1*(this.x-p)*Math.sin(this.rotation)+(this.y-q)*Math.cos(this.rotation)+q; 
      // two changes were needed....the Math.sin needed to be multiplied by -1

      // (new_x, new_y) is the top left corner of the rectangle. 

      var top_right = new Point2D(
        new_x + this.w*Math.cos(this.rotation), 
        new_y - this.w*Math.sin(this.rotation));

      var bot_left = new Point2D(
        new_x + this.h*Math.sin(this.rotation), 
        new_y +  this.h*Math.cos(this.rotation));

      var bot_right = new Point2D( 
         new_x + this.h*Math.sin(this.rotation) + + this.w*Math.cos(this.rotation),
         new_y +  this.h*Math.cos(this.rotation) - this.w*Math.sin(this.rotation)
      );

      var s1 = new Segment(new_x, new_y,top_right.x, top_right.y );
      var s2 = new Segment(top_right.x, top_right.y, bot_right.x, bot_right.y);
      var s3 = new Segment(bot_right.x, bot_right.y, bot_left.x, bot_left.y);
      var s4 = new Segment(bot_left.x, bot_left.y, new_x, new_y);

      this.sides = [s1,s2,s3,s4];
      return this.sides;
    }
    update(delta){
      super.update(delta);
      // move our sides too!
      // force sides to update position too
      this.getSides(true);
      if(this.renderable){
        this.renderable.x = this.x;
        this.renderable.y = this.y;
        this.renderable.rotation = this.rotation
      }      
    }
    render(ctx){
      console.log("***");
      ctx.save(); 
      if(this.rotation == 0){
        ctx.strokeRect(this.x, this.y, this.w, this.h);
      }else{
        for(var i =0;i<this.sides.length;i++){
          var side = this.sides[i];
          ctx.beginPath();
          ctx.moveTo(side.p1.x, side.p1.y);
          ctx.lineTo(side.p2.x, side.p2.y);
          ctx.stroke();
        } 
      }
      this.center = this.getCenter();
      ctx.fillRect(this.center.x, this.center.y, 2,2);
      super.render(ctx);
      ctx.restore();

    }
  }
  class ParticleBurst {
    constructor(x,y){
      this.x = x;
      this.y = y;
      for(var i=0;i<100;i++){
        var p = ParticleManager().getParticle();
        p.reset();
        p.setPosition(x,y);
        p.vel = new Vector2D(-250 + Math.random()*500, -250 + Math.random()*500);
        p.acc = new Vector2D( (-1* p.vel.x)/2, (-1* p.vel.y)/2  );
        p.size=2;
      }
    }
  }

  class ParticleEmitter {
    constructor(x,y){
      this.x = x;
      this.y = y;
      this.ready_to_emit = true;
      // options
      this.min_angle = Math.PI/3;
      this.max_angle = 2*Math.PI/3;
      this.emit_interval = 125;
      this.time_to_emit = this.emit_interval;

      this.burst_amount=10;
      // vel and accel 
    }
    emit(){
      for(var i=0;i<this.burst_amount;i++){
        var p = ParticleManager().getParticle();
        p.reset();
        p.setPosition(this.x,this.y);
        var vel = Math.random()*500;
        var angle = Math.random()*(this.max_angle-this.min_angle) + this.min_angle;
        p.vel = new Vector2D( Math.cos(angle)*vel, -1*Math.sin(angle)*vel );
        p.acc = new Vector2D( (-1* p.vel.x)/2, (-1* p.vel.y)/2  );
        p.size=2;
      }
    }
    update(delta){
      if(this.ready_to_emit){
        this.emit();
        this.ready_to_emit = false;
        this.time_to_emit = this.emit_interval;
      }else{
        this.time_to_emit-=delta;
        if(this.time_to_emit <=0){
          this.ready_to_emit = true;
        }
      }
    }
  }
  
  class Particle extends Body2D{
    constructor(x,y){
      super(x,y);
      this.size = 5;
      this.color = {
        "r": 0,
        "g": 0, 
        "b": 200, 
        "a": 1
      }
      this.type = "circle";
      this.time_alive = 1000;
      this.time_to_expire = this.time_alive;
      this.ready_to_delete= false;
    }
    getRenderable(){
      if(!this.renderable){
        this.renderable = new CircleCTX(this.x, this.y, this.size);
        this.renderable.fill=true;
        this.renderable.stroke = false;
        this.renderable.color = this.color;
        return this.renderable;
      }
      return this.renderable;
    }
    setRenderable(r){
      this.renderable = r;
    }
    reset(){
      this.time_alive = 1000;
      this.time_to_expire = 1000;
      this.ready_to_delete = false;
    }
    update(delta){
      super.update(delta);
      this.time_to_expire -= delta;
      this.color.a = (this.time_to_expire/this.time_alive)/1;
      if(this.time_to_expire<=0){
        this.ready_to_delete = true;
      }
      if(this.renderable){
        this.renderable.x = this.x;
        this.renderable.y = this.y;
      }
    }
    render(ctx){

    }
  }
  class PixiParticle extends Particle{
    getRenderable(){
      if(!this.renderable){
          var ccc = new Graphics();
          var hex = ((this.color.r << 16) + (this.color.g << 8) + this.color.b);
          ccc.beginFill(hex);
          ccc.drawCircle(0, 0, this.size);
          ccc.endFill();
          ccc.x = this.x;
          ccc.y = this.y;
          ccc.alpha = .2;
          // set it
          this.setRenderable(ccc);
      }
      return this.renderable;
    }
    update(delta){
      super.update(delta);
      this.renderable.alpha = this.color.a;
    }
  }
  class Sprite {
    constructor(w,h){
      this.runtime = 0;
      this.images = [];
      this.height = h;
      this.width = w;
      this.frame_runtime = 0;
      this.current_img = null;
      this.current_img_index = 0;
      this.reverse = false;
      this.animation_scale = 1;
    }
    addSpriteFrame(img, time_limit, xOffset, yOffset, sWidth, sHeight){
      // img, xOffset, yOffset, sWidth, sHeight
      if(typeof(xOffset) == 'undefined'){
        xOffset = 0;
        yOffset = 0;
        sWidth = img.width;
        sHeight = img.height;
      }
      var tmp = {
        image: img,
        time_limit: time_limit,
        xOffset: xOffset,
        yOffset: yOffset,
        sWidth: sWidth,
        sHeight: sHeight
      }
      this.images.push(tmp);
    }
    start(){
      this.frame_runtime= 0;
      this.runtime = 0;
      this.current_img_index = 0;
      this.current_img = this.images[0];
    }
    animationEnd(){

    }
    nextImage(){
      this.frame_runtime = 0;
      this.current_img_index++;
      if(this.current_img_index >= this.images.length){
        this.current_img_index = 0;
        // this means the animation ended....
        this.animationEnd();
      }
      this.current_img = this.images[this.current_img_index];
    }
    render(ctx){
      // assume that the canvas has already been translated to (this.x, this.y)
      // draw this.current_img.image;
      if(this.current_img){
        ctx.save();
        if(this.reverse){
          ctx.translate(this.width, 0);
          ctx.scale(-1,1);
        }
        ctx.drawImage(this.current_img.image,
            this.current_img.xOffset,
            this.current_img.yOffset,
            this.current_img.sWidth,
            this.current_img.sHeight,
            0,0, this.width, this.height);
        ctx.restore();
      }
    }
    update(delta){
      this.runtime+=(delta*this.animation_scale);  // total time this sprite is running
      this.frame_runtime += (delta*this.animation_scale);
      if(this.current_img && this.frame_runtime >= this.current_img.time_limit){
        this.nextImage();
      }
    }
  }

  class SpriteManager{
    constructor(){
      this.sprites = {};
      this.current_sprite;
      this.sprite_key;
      this.next = [];
      this.recentChange = false;
    }
    addSprite(key, sprite, options){
      if(!options){
        //default options
        options = {
          animation_scale: 1,
          reverse: false,
          can_end_early: true
        };
      }else{
        options.reverse = typeof(options.reverse)=='undefined'? false : options.reverse;
        options.animation_scale = typeof(options.animation_scale) == 'undefined' ? 1 : options.animation_scale;
        options.can_end_early = typeof(options.can_end_early) == 'undefined' ? true : options.can_end_early;       
      }
      var obj = {
        "sprite": sprite,
        "reverse": options.reverse,
        "animation_scale": options.animation_scale,
        "can_end_early": options.can_end_early
      }
      this.sprites[key] = obj;
    }
    change(s){
      if(this.sprite_key && !this.sprites[this.sprite_key].can_end_early){
        //
        // must wait for current_sprite to finish....
        // this.current_sprite.current_img_index  == 0 ???
        if(this.current_sprite.current_img_index != 0){
          this.next.push(s);
          return false;
        }
      }
      if(this.next.length > 0){
        this.next.push(s);
        return false;
      }
      this.sprite_key=s;
      var sprite_obj = this.sprites[s];
      this.current_sprite = sprite_obj.sprite;
      this.current_sprite.reverse = sprite_obj.reverse;
      this.current_sprite.animation_scale = sprite_obj.animation_scale;
      this.current_sprite.start();
    }
    update(delta){
      if(this.next.length > 0 
        && this.current_sprite.current_img_index ==  0 
        && !this.recentChange){

        this.change(this.next.shift());
        this.recentChange = true;
      }else if(this.recentChange && this.current_sprite.current_img_index > 0){
        this.recentChange = false;
      }
      this.current_sprite.update(delta);

    }
    render(ctx){
      this.current_sprite.render(ctx);
    }
  }
