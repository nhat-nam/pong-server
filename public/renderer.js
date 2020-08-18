
class Renderer{
  constructor(w,h){
    this.w = w;
    this.h= h;
    this.nodes = [];
  }
  addChild(n){
    n._parent = this;
    this.nodes.push(n);
  }
  render(){

  }
}
class CTXRenderer extends Renderer{
  constructor(w,h,ctx){
    super(w,h);
    this.ctx = ctx;
  }
  render(){
    this.ctx.clearRect(0,0,this.w, this.h);
    for(var i=0;i<this.nodes.length;i++){
      this.nodes[i].render(this.ctx); 
      //not calling render in circBody2d...calling render
      // in circbody2d.getRenderable().render(ctx);
    }
  }
}
class PixiRenderer extends Renderer{
  constructor(w,h,container){
    super(w,h);
    this.container = container;
  }
  reset(){
    //removes all children so we can use it for other scenes
    this.container.removeChildren();
  }
  addChild(n){
    // container holds all of our pixi graphics objects    
    this.container.addChild(n);
  }
}
