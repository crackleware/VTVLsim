nu_crackleware_vtvlsim_Main = function (
    Setup,

    Tests,

    Graph,
    RocketGraphs,
    Slider,

    Environment,
    Rocket,
    RocketViz,
    Simulator,

    ThrustController,
    ThrustControllerViz,

    dbg,

    THREE,
    $
) {
    const scope = this;

    if (0) {
        try { Tests.testPhysicsSimulationAccuracy1({quiet: true}); }
        catch (e) { console.log('warning: ' +e); }
    }

    const env = this.env = new Environment();
    const rocket = this.rocket = new Rocket(env);
    const rocketViz = this.rocketViz = new RocketViz(rocket, Setup.scene);

    const initialRocketState = rocket.saveState();

    const rocketGraphs = new RocketGraphs({
        position: function () {
            return rocket.topBodyNode.position.y;
        },
        velocity: function () {
            return rocket.topBodyNode.velocity.length();
        },
        kineticEnergy: function () {
            return Physics.kineticEnergyOfNodes(rocket.massNodes);
        }
    }, 0, 50);

    const graphForce = this.graphForce = new Graph('force', 40, ["%.1f", "N"], {minRange: 1, idxSteps: 6});
    graphForce.setGeometry(80, 50, 80, 80);
    graphForce.update = function () {
        graphForce.addData(env.forceMax);
        env.forceMax = 0;
    };

    const graphBroken = this.graphBroken = new Graph('broken', 40, ["%.0f", ""], {minv: 0, idxSteps: 30});
    graphBroken.setGeometry(160, 50, 80, 40);
    graphBroken.update = function () {
        graphBroken.addData(rocket.brokenConstraintsCount());
    };

    const graphFPS = this.graphFPS = new Graph('fps', 40, ["%.0f", ""], {minv: 0, maxv: 120, idxSteps: 30});
    graphFPS.setGeometry(400, 0, 80, 50);
    graphFPS.update = function () { graphFPS.addData(Setup.fps); };

    const sliderThrust = this.sliderThrust = new Slider('thrust', ["%.1f", "N"], [0, 620e3]);
    sliderThrust.setGeometry(80, 130, 40, 160);

    const thrustCtrl = this.thrustCtrl = new ThrustController(rocket, env);
    const thrustCtrlViz = this.thrustCtrlViz = new ThrustControllerViz(thrustCtrl, Setup.scene);
    thrustCtrl.setTarget(new THREE.Vector3(50, 50, 0));

    const sim = this.sim = new Simulator(
        [rocket, thrustCtrl],
        [rocketViz, thrustCtrlViz],
        env
    );

    thrustCtrl.sim = sim;

    this.restart = function () {
        rocket.loadState(initialRocketState);
        rocketViz.brokenConstraints = 0;
        rocketViz.recreate();
        thrustCtrl.resetInternals();
    }

    function removeObjFromArray(arr, obj) { arr.splice(arr.indexOf(obj), 1); }

    keys = {};
    for (var i = 0; i < 256; i++) keys[i] = false;
    document.addEventListener('keydown', function (evt) {
        keys[evt.keyCode] = true;
    }, false);
    document.addEventListener('keyup', function (evt) {
        keys[evt.keyCode] = false;
    }, false);

    this.simPaused = false;
    this.cameraTracksRocket = false;
    this.disablePanels = false;
    this.timeFactor = 1; // >1 to speed up passage of time

    const updateScene = dt => {
        if (keys['P'.charCodeAt(0)]) this.simPaused = true;
        if (keys['O'.charCodeAt(0)]) this.simPaused = false;
        if (keys['C'.charCodeAt(0)]) this.cameraTracksRocket = true;
        if (keys['V'.charCodeAt(0)]) this.cameraTracksRocket = false;

        if (keys['T'.charCodeAt(0)]) {
            const d = Setup.camera.localToWorld(new THREE.Vector3(0, 0, -1)).sub(Setup.camera.position).normalize();
            const ray = new THREE.Ray(Setup.camera.position, d);
            const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            const v = ray.intersectPlane(plane);
            thrustCtrl.setTarget(v);
        }

        if (keys['R'.charCodeAt(0)]) {
            this.restart();
            // rocket.massNodes.forEach(function (n) {
            //     n.position.y += 5e3;
            // });
        }
        if (keys['E'.charCodeAt(0)]) {
            thrustCtrl.resetInternals();
        }
        if (keys['G'.charCodeAt(0)]) {
            thrustCtrl.setTarget(null);
            thrustCtrl.resetInternals();
            const v1 = this.rocket.topBodyNode.position.clone().sub(this.rocket.bodyNodes[0].position).normalize();
            if (v1.y > 0 && Math.abs(v1.x) < Math.abs(v1.y)) {
                this.rocket.setThrust(
                    v1.clone().applyAxisAngle(new THREE.Vector3(0,0,1), Math.PI/8).
                        multiplyScalar(500e3).negate());
            } else {
                this.rocket.setThrust(new THREE.Vector3());
            }
        } else if (thrustCtrl.target == null) {
            this.rocket.setThrust(new THREE.Vector3());
        }

        if (!this.simPaused) {
            sim.update(dt*this.timeFactor, applyForces);

            sliderThrust.value = rocket.thrust.length();

            if (!this.disablePanels) {
                [rocketGraphs,
                 graphForce,
                 graphBroken,
                 graphFPS,
                 sliderThrust
                ].forEach(function (g) {
                     g.update(dt);
                     g.draw();
                 });
            }

            dbg.update(dt);
            dbg.draw();

            if (this.cameraTracksRocket) {
                Setup.camera.position.x = rocket.topBodyNode.position.x;
                Setup.camera.position.y = rocket.topBodyNode.position.y;
            }
        }
    };

    Setup.updateScene = updateScene;

    const applyForces = dt => { };

    function setTargetLocation(x, y) {
        const containerWidth = $(document).width(),
              containerHeight = $(document).height();

        const raycaster = new THREE.Raycaster();
        const mouseVector = new THREE.Vector2(
              2 * (x / containerWidth) - 1,
              1 - 2 * (y / containerHeight));

        raycaster.setFromCamera( mouseVector, Setup.camera );

        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const v = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
        thrustCtrl.setTarget(v);
    }

    scope.mouseDown = false;
    Setup.container.addEventListener('mousedown', function (event) {
        scope.mouseDown = true;
        if (!Setup.controls.pointerLocked) {
            setTargetLocation(event.pageX, event.pageY);
        }
    });
    Setup.container.addEventListener('mouseup', function (event) {
        scope.mouseDown = false;
    });
    Setup.container.addEventListener('mousemove', function (event) {
        if (scope.mouseDown) {
            if (!Setup.controls.pointerLocked) {
                setTargetLocation(event.pageX, event.pageY);
            }
        }
    });

    function onTouch(touch) {
        var x = touch.pageX, y = touch.pageY;
        // dbg.text([x,y,touch.clientX,touch.clientY]);
        setTargetLocation(x, y);
    }

    Setup.container.addEventListener('touchstart', function (event) {
        try {
            for (var i = 0; i < event.touches.length; i++)
                onTouch(event.touches[i]);
            event.preventDefault();
        } catch (e) { alert(e); }
    });
    Setup.container.addEventListener('touchmove', function (event) {
        try {
            for (var i = 0; i < event.touches.length; i++)
                onTouch(event.touches[i]);
            event.preventDefault();
        } catch (e) { alert(e); }
    });
}
