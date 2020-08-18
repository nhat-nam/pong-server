

class Scene{
  constructor(width, height, rr){
    this.nodes = [];
    //only objects in render_container are rendered. 
    this.render_container = new Node();
    this._parent = null;
    this.clearBeforeRender = true;
    this.width = width;
    this.height = height;
    this.renderer = rr;
  }
  addChild(node){
    node._parent = this;
    this.nodes.push(node);
    // if node has a renderable()
    if(node.getRenderable){
      this.renderer.addChild(node.getRenderable());
    }
//    var renderable = node.getRenderable();
//    this.render_container.addChild(renderable);
  }
  load(){}
  unload(){}
  update(delta){
    for(var i=0;i<this.nodes.length;i++){
      if(this.nodes[i].update){
        this.nodes[i].update(delta);
      }
    }
  }
  render(){
    this.renderer.render();
  }
}

var SceneManager;
(function() {
	var instance;
  //private var
  let scenes = [];
  SceneManager = function SceneManager() {
		if (instance) {
			return instance;
		}
    instance = this;
    // public vars 
    this.currentScene = null;
    // public methods...
    this.update = function(delta){
      this.currentScene.update(delta);
    }
    this.render = function(ctx){
      this.currentScene.render(ctx);
    }
    this.changeScene = function(nextScene){
      if(this.currentScene != null){
        this.currentScene.unload();
      }
      var newScene = this.getScene(nextScene);
      newScene.load();
      this.currentScene = newScene;
    }
    this.addScene = function(name, scene){
      scene._parent = this;
      scenes[name] = scene;
    }
    this.getScene = function(name){
      return scenes[name];
    }
    return instance;
  }
}());