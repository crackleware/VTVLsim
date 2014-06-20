nu_crackleware_vtvlsim_PointerLockControls = function ( camera ) {
	var scope = this;

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;

	var velocity = new THREE.Vector3();

	var PI_2 = Math.PI / 2;

    var pointerLocked = false;
    this.pointerLocked = false;

    this.pointerLockChangeCBs = [];

    var pointerlockchange = function (event) {
        var elem = document.body;
        pointerLocked = 
            document.mozPointerLockElement === elem ||
            document.webkitPointerLockElement === elem;
        // console.log({pointerLocked: pointerLocked});
        scope.pointerLocked = pointerLocked;
        scope.pointerLockChangeCBs.forEach(function (cb) {
            cb(pointerLocked);
        });
    };

    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
	document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
	document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

        if (!pointerLocked) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        var v1 = camera.localToWorld(new THREE.Vector3(1, 0, 0)).sub(camera.position);
        var v2 = camera.localToWorld(new THREE.Vector3(0, 1, 0)).sub(camera.position);
        var v3 = camera.localToWorld(new THREE.Vector3(0, 0, -1)).sub(camera.position);
        v3.applyAxisAngle(v1, movementY * -0.002);
        v3.applyAxisAngle(v2, movementX * -0.002);
        camera.lookAt(camera.position.clone().add(v3));
	};

	var onKeyDown = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true; break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;

		}

	};

	var onKeyUp = function ( event ) {
		switch( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // a
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;

			case 70: // f
                {
                    var element = document.body;
                    element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
                    element.requestFullscreen();
                }

				break;
		}

	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	this.enabled = false;

	this.update = function ( delta ) {

		if ( scope.enabled === false ) return;

        if (!pointerLocked) return;

        var d = 3;

		if ( moveForward ) velocity.z = -d;
		else if ( moveBackward ) velocity.z = +d;
        else velocity.z = 0.0;

		if ( moveLeft ) velocity.x = -d;
		else if ( moveRight ) velocity.x = +d;
        else velocity.x = 0.0;

		camera.translateX( velocity.x );
		camera.translateY( velocity.y ); 
		camera.translateZ( velocity.z );
	};

};
