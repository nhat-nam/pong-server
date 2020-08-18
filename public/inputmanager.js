/* Singleton Class */
var InputManager;

(function() {

	var instance;
	var element;
	//private variables

	/// these are functions to run on the events.
  var _keyPresses = [];
	var _keyDowns = [];
	var _keyUps = [];
  var _mButtonsUps = [];
  var _mButtonsDowns = [];
  // stores true or false for which keys are currently pressed down
	var _keysDown = [];
  var _mButtonsDown = [];
  var _clicks = [];

  var _mousePositions = [];

	var _mousePosition = {x:0, y:0};

	InputManager = function InputManager(el) {
		if (instance) {
			return instance;
		}

		// public variables;
		this.listening = false;
		element = el;
		this.trackingKeys = true;
		this.trackMousePosition = false;
    this.settings = {
      listen_to: {
        "contextmenu": true,
        "mousemove": true,
        "mousedown": true, 
        "mouseup": true, 
        "click": true,
  			"keydown": true,
  			"keyup": true,
  			"keypress": true
      }
    }
		instance = this;

		//private methods
		function runKeyPress(ev){
			if(_keyPresses[ev.code]){
				// if an action is set, run it
				_keyPresses[ev.code](ev);
			}
		}
		function runKeyDown(ev){
			if(_keyDowns[ev.code]){
				// if an action is set, run it
				_keyDowns[ev.code](ev);
			}
			_keysDown[ev.key] = true;
		}
		function runKeyUp(ev){
			if(_keyUps[ev.code]){
				// if an action is set, run it
				_keyUps[ev.code](ev);
			}
			_keysDown[ev.key] = false;
		}
    function runContextMenu(ev){
      ev.preventDefault();
      ev.stopPropagation();
      runMouseClick(ev);
    }
    
    function runMouseDown(ev){
			if(_mButtonsDowns[ev.button]){
				// if an action is set, run it
				_mButtonsDowns[ev.button](ev);
			}
			_mButtonsDown[ev.button] = true;
		}
    
		function runMouseUp(ev){
			if(_mButtonsUps[ev.button]){
				// if an action is set, run it
				_mButtonsUps[ev.button](ev);
			}
			_mButtonsDown[ev.button] = false;
		}

    function runMouseClick(ev){
			_clicks.push(ev);
    }
    function resetMouseClicks(){
      _clicks = [];
    }
		function runMouseMove(ev){
			_mousePosition = {
				x:ev.offsetX, 
				y:ev.offsetY
			}
      if(this.trackMousePosition){
        _mousePositions.push(_mousePosition);
      }
		}
		this.getMousePosition = function(){
			return _mousePosition;
		}
    this.getMouseClick = function(persist){
      if(_clicks.length > 0){
        if(persist){
          return _clicks[0];
        }
        var tmp = _clicks[0];
        resetMouseClicks();
        return tmp;
      }
      return null;
    }
    this.getMouseClicks = function(persist){
      if(persist){
        return _clicks;
      }
      var tmp = _clicks;
      resetMouseClicks();
      return tmp;
    }
    this.isMouseButtonDown = function(button){
			if(_mButtonsDown[button]){
				return true;
			}
			return false;
		}
		this.isKeyDown = function(code){
			if(_keysDown[code]){
				return true;
			}
			return false;
		}

    // on mousedown events
		this.unregisterMouseDown = function(button){
			delete _mButtonsDowns[button];
		}
		this.registerMouseDown = function(button, action){
			_mButtonsDowns[button] = action;
		}
    this.unregisterMouseUp = function(button){
			delete _mButtonsUps[button];
		}
		this.registerMouseUp = function(button, action){
			_mButtonsUps[button] = action;
		}

		// on keydown events
		this.unregisterKeyDown = function(key){
			delete _keyDowns[key];
		}
		this.registerKeyDown = function(key, action){
			_keyDowns[key] = action;
		}
		//on keyup events
		this.unregisterKeyUp = function(key){
			delete _keyUps[key];
		}
		this.registerKeyUp = function(key, action){
			_keyUps[key] = action;
		}
		// on keypress events
		this.unregisterKeyPress = function(key, action){
			delete _keyPresses[key];
		}
		this.registerKeyPress = function(key, action){
			_keyPresses[key] = action;
		}

		this.stopListening = function(){
			if(this.listening){
        element.removeEventListener("contextmenu", runContextMenu);
				element.removeEventListener("mousemove", runMouseMove);		
        element.removeEventListener("mousedown", runMouseUp);
        element.removeEventListener("mouseup", runMouseDown);        	
        element.removeEventListener("click", runMouseClick);
				element.removeEventListener("keydown", runKeyDown);
				element.removeEventListener("keyup", runKeyUp);
				element.removeEventListener("keypress", runKeyPress);
			}
			this.listening = false;
		}
		this.listenForEvents = function(){
			if(!this.listening){
        if(this.settings.listen_to['contextmenu']){
          element.addEventListener("contextmenu", runContextMenu);	
        }
        if(this.settings.listen_to['mousemove']){
  			  element.addEventListener("mousemove", runMouseMove);
        }
        if(this.settings.listen_to['mousedown']){
          element.addEventListener("mousedown", runMouseUp);
        }
        if(this.settings.listen_to['mouseup']){
          element.addEventListener("mouseup", runMouseDown);
        }
        if(this.settings.listen_to['click']){
          element.addEventListener("click", runMouseClick);
        }
        if(this.settings.listen_to['keydown']){
				  element.addEventListener("keydown", runKeyDown);
        }
        if(this.settings.listen_to['keyup']){
				  element.addEventListener("keyup", runKeyUp);
        }
        if(this.settings.listen_to['keypress']){
				  element.addEventListener("keypress", runKeyPress);
        }
				this.listening = true;
			}
		}

    return instance;
	};
}());