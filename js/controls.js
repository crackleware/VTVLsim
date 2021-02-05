nu_crackleware_vtvlsim_PointerLockControls = function ( camera ) {
	const scope = this;

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;

	const velocity = new THREE.Vector3();

	const PI_2 = Math.PI / 2;

    scope.pointerLocked = false;

    scope.pointerLockChangeCBs = [];

    const pointerlockchange = function (event) {
        const elem = document.body;
        scope.pointerLocked =
            document.pointerLockElement === elem ||
            document.mozPointerLockElement === elem ||
            document.webkitPointerLockElement === elem;
        // console.log({pointerLocked: scope.pointerLocked});
        scope.pointerLockChangeCBs.forEach(cb => {
            cb(scope.pointerLocked);
        });
    };

    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
	document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
	document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

	const onMouseMove = event => {
		if (scope.enabled === false) return;

        if (!scope.pointerLocked) return;

		const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        const v1 = camera.localToWorld(new THREE.Vector3(1, 0, 0)).sub(camera.position);
        const v2 = camera.localToWorld(new THREE.Vector3(0, 1, 0)).sub(camera.position);
        const v3 = camera.localToWorld(new THREE.Vector3(0, 0, -1)).sub(camera.position);
        v3.applyAxisAngle(v1, movementY * -0.002);
        v3.applyAxisAngle(v2, movementX * -0.002);
        camera.lookAt(camera.position.clone().add(v3));
	};

	const onKeyDown = event => {
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

	const onKeyUp = event => {
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
                    const element = document.body;
                    element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
                    element.requestFullscreen();
                }

				break;
		}
	};

	document.addEventListener('mousemove', onMouseMove, false);
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);

	scope.enabled = false;

	scope.update = delta => {
		if (scope.enabled === false) return;

        if (!scope.pointerLocked) return;

        const d = 3;

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
