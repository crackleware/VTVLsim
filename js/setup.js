nu_crackleware_vtvlsim_Setup = function (PointerLockControls, Detector, THREE, $) {
    var scope = this;

    $("body").css("overflow", "hidden");

    var WIDTH = $(document).width(),
        HEIGHT = $(document).height();

    var VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 10000;

    var $container = $('#container');

    $container[0].style.background = 'rgb(96, 122, 190)';
    this.container = $container[0];

    var renderer = Detector.webgl ? 
        new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    // var renderer = new THREE.CanvasRenderer();

    renderer.shadowMapEnabled = true;
    renderer.shadowMapType = THREE.PCFShadowMap;


    var stxt = '';
    stxt += 'v0.1';
    stxt += ', ';
    stxt += (renderer instanceof THREE.WebGLRenderer) ? 'webgl' : 'canvas';
    $('#status').text(stxt);


    var camera = this.camera = new THREE.PerspectiveCamera(
        VIEW_ANGLE, ASPECT, NEAR, FAR);


    this.loadState = function () {
        if (localStorage.camposrot) {
            var a = JSON.parse(localStorage.camposrot);
            camera.position.x = a[0];
            camera.position.y = a[1];
            camera.position.z = a[2];
            camera.rotation.x = a[3];
            camera.rotation.y = a[4];
            camera.rotation.z = a[5];
        } else {
            camera.position.x = 0;
            camera.position.y = 50;
            camera.position.z = 200;
        }
    }
    this.loadState();

    this.saveState = function () {
        localStorage.camposrot = JSON.stringify([
            camera.position.x,
            camera.position.y,
            camera.position.z,
            camera.rotation.x,
            camera.rotation.y,
            camera.rotation.z
        ]);
    };
    setInterval(this.saveState, 5000);


    var scene = this.scene = new THREE.Scene();

    renderer.setSize(WIDTH, HEIGHT);

    $container.append(renderer.domElement);

    scene.add(camera);

    var controls = this.controls = new PointerLockControls(camera);
    controls.enabled = true;

    this.requestPointerLock = function () {
        var element = document.body;
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();
    };

    // $container[0].addEventListener('click', function (event) {
    //     scope.requestPointerLock();
    // });

    this.updateScene = null;

    var prev_timestep = null;
    function render(timestep) {
	    requestAnimationFrame(render);

        var dt = 0;
        if (prev_timestep != null) {
            dt = timestep - prev_timestep;
            controls.update(dt);
        }
        prev_timestep = timestep;

        scope.fps = dt == 0 ? 0 : 1000.0/dt;

        if (scope.skyEnabled && scene.children.indexOf(sky) < 0) {
            scene.add(sky);
        } else if (!scope.skyEnabled && scene.children.indexOf(sky) >= 0) {
            scene.remove(sky);
        }

        try {
            if (scope.updateScene)
                scope.updateScene(dt);
        } catch (e) {
            console.log(e.stack); 
            scope.updateScene = null; 
        }

        renderer.render(scene, camera);
    }
    render();


    {
        var sky = this.sky = new THREE.Mesh(
            new THREE.SphereGeometry(5000, 2*8, 2*6), 
            new THREE.MeshBasicMaterial({color: 0xFFFFFF}));
        scene.add(sky);
        sky.material.side = THREE.BackSide;
        sky.material.map = THREE.ImageUtils.loadTexture('sky2.png');
        this.skyEnabled = true;
    }

    {
        var gndmat = new THREE.MeshBasicMaterial({color: 0x989d09});
        var gndplane = this.gndplane = new THREE.Mesh(
            new THREE.PlaneGeometry(2*1000, 2*1000), gndmat);
        gndplane.rotation.x = -Math.PI/2;
        gndplane.position.y = -1;
        scene.add(gndplane);

        gndmat.transparent = true;
        gndmat.opacity = 0.4;
    }

    {
        var size = 1000;
        var step = 100;
        var gridHelper = this.gridHelper = new THREE.GridHelper(size, step);
        gridHelper.position = new THREE.Vector3(0, 0, 0);
        gridHelper.setColors(0xffffff, 0x000000);
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.5;
        scene.add(gridHelper);
    }

    {
        var sun = this.sun = new THREE.DirectionalLight( 0xFFFFFF, 0.3 );
        sun.position.set(500, 500, 0);
        scene.add(sun);

        var ambient = this.ambient = new THREE.AmbientLight( 0xaaaaaa );
        scene.add(ambient);
    }

}
