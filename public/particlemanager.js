/* Singleton Class */
var ParticleManager;
(function() {

	var instance;
	//private variables
	var particles = [];
  var active_particles = [];
  var size;
  var nextIndex = 0;
	ParticleManager = function ParticleManager(limit, particleClass) {
    if(!particleClass){
      //set particleClass to default Particle object
      let particleClass = Particle;
    }
		if (instance) {
			return instance;
		}
    size = limit;
    for(var i=0;i<limit;i++){
      var p = new particleClass(0,0);
      particles.push(p);
    }
		// public variables; 
    this._public = "yes";
		
    instance = this;
		//private methods
    //public methods
    this.getRenderable=function(){
      if(!this.renderable){
        //send a default renderable to CTX renderable
        this.renderable = new CollectionCTX();
      }
      return this.renderable;
    }
    this.setRenderable = function(r){
      this.renderable = r;
    }
    this.update = function(delta){
      for(var i=0;i<active_particles.length;i++){
        active_particles[i].update(delta);
        if(active_particles[i].ready_to_delete){
          var p = active_particles[i];
          active_particles.splice(i,1);
      
          this.renderable.removeChildAt(i);
          
          i--;
          //particles.push(p);
        }
      }
    }
    this.render = function(ctx){
      for(var i=0;i<active_particles.length;i++){
        active_particles[i].render(ctx);
      }
    }
    this.getActiveParticles =function(){
      return active_particles;
    }
    this.getParticles =function(){
      return particles;
    }
    this.getParticle = function(){
      if(particles.length!=0){
        var particle = particles[nextIndex];
        nextIndex++;
        if(nextIndex == particles.length){
          nextIndex = 0;
        }
        if(active_particles.length < particles.length){
          active_particles.push(particle);
        }else{
          // the particle is already in active_particles (should be the first one)
          active_particles.push(active_particles.shift());
        }
      }else{
        var particle = active_particles.shift();
        active_particles.push(particle);
      }
      this.renderable.addChild(particle.getRenderable());
      return particle;
    }
    this.availableCount =function(){
      return particles.length;
    }
    return instance;
	};
}());