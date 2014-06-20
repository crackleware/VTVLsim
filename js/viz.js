nu_crackleware_vtvlsim_Viz = function (
    Panels,
    Graph,
    Physics,
    RigidLineConstraints,
    RigidDistanceConstraint,
    THREE
) {
    var recomputeGeom = this.recomputeGeom = function (geom) {
        geom.computeFaceNormals();
        geom.computeVertexNormals();
        geom.computeBoundingSphere();
    }

    var MassNodeViz = this.MassNodeViz = function (node, scene) {
        this.node = node;
        this.scene = scene;

        this.material = new THREE.MeshLambertMaterial({
            color: 0xff0000, ambient: 0xff0000
        });
        this.material.transparent = true;
        this.material.opacity = 0.7;

        var radius = 1, segments = 4, rings = 4;
        this.geom = new THREE.SphereGeometry(radius, segments, rings);
        this.sphere = new THREE.Mesh(this.geom, this.material);
        this.scene.add(this.sphere);
        this.sphere.position = this.node.position;
    };

    MassNodeViz.prototype.remove = function () {
        this.scene.remove(this.sphere);
        this.geom.dispose();
    };

    MassNodeViz.prototype.update = function () {
        var r = 1;
        switch (1) {
        case 1:
            r = 0.002*this.node.mass;
            break;
        case 2:
            var V = 0.01*this.node.mass;
            r = Math.pow(3*V/(4*Math.PI), 1/3);
            break;
        }
        this.sphere.scale.x = r;
        this.sphere.scale.y = r;
        this.sphere.scale.z = r;
    };

    var RocketViz = this.RocketViz = function (rocket, scene) {
        var self = this;

        this.rocket = rocket;
        this.scene = scene;

        this.rocketMat = new THREE.LineBasicMaterial({color: 0x9db4c1});
        // this.rocketMat.linewidth = 1;

        this.brokenConstraints = 0;

        this.thrustNoise = 0;

        this.rocketBody = null;

        this.recreate();
    }

    RocketViz.prototype.recreate = function () {
        var self = this;

        if (this.rocketBody) 
            this.remove();

        this.rocketGeomBody = new THREE.Geometry();

        var nodeById = {};
        var links = {};
        function registerNode(n) {
            if (nodeById[n.id] == undefined)
                nodeById[n.id] = n;
        }
        function registerLink(link) {
            var ids = link.map(function (n) { return n.id; });
            ids.sort();
            links[ids] = ids;
        }

        for (var i = 0; i < this.rocket.constraints.length; i++) {
            var c = this.rocket.constraints[i];
            if (c.aux.visibleLink && !c.broken) {
                if (c instanceof RigidLineConstraints) {
                    registerNode(c.n1);
                    registerNode(c.n2);
                    registerNode(c.n3);
                    registerLink([c.n1, c.n2]);
                    registerLink([c.n2, c.n3]);
                } else if (c instanceof RigidDistanceConstraint) {
                    registerNode(c.n1);
                    registerNode(c.n2);
                    registerLink([c.n1, c.n2]);
                }
            }
        }

        var visualizedLinks = {};
        for (var k in links) {
            var link = links[k];
            var i1 = link[0], i2 = link[1];
            if (!visualizedLinks[[i1, i2]]) {
                visualizedLinks[[i1, i2]] = true;
                this.rocketGeomBody.vertices.push(nodeById[i1].position);
                this.rocketGeomBody.vertices.push(nodeById[i2].position);
            }
        }

        recomputeGeom(this.rocketGeomBody);

        this.rocketBody = new THREE.Line(this.rocketGeomBody, this.rocketMat, THREE.LinePieces);
        this.scene.add(this.rocketBody);

        this.massNodeVizs = [];
        this.rocket.forEachMassNode(function (n) {
            var nv = new MassNodeViz(n, self.scene);
            self.massNodeVizs.push(nv);
        });

        this.thrustArrow = new THREE.ArrowHelper(
            new THREE.Vector3(), new THREE.Vector3(), 1, 0xffcc00);
        this.scene.add(this.thrustArrow);

        this.update();
    };

    RocketViz.prototype.remove = function () {
        var self = this;
        this.scene.remove(this.rocketBody);
        this.scene.remove(this.thrustArrow);
        this.rocketGeomBody.dispose();
        this.massNodeVizs.forEach(function (nv) { 
            nv.remove();
        });
    };

    RocketViz.prototype.update = function () {
        var brokenCnt = this.rocket.brokenConstraintsCount();
        if (brokenCnt > this.brokenConstraints) {
            this.brokenConstraints = brokenCnt;
            this.recreate();
        }

        this.rocketGeomBody.verticesNeedUpdate = true;
        this.massNodeVizs.forEach(function (nv) {
            nv.update();
        });

        if (brokenCnt == 0) {
            this.thrustArrow.visible = true;
            this.thrustArrow.children.forEach(function (obj) { obj.visible = true; }); // do we need this?
            var noise = this.thrustNoise ? 1.0-this.thrustNoise*Math.random() : 1.0;
            Panels.updateArrow(this.thrustArrow, 
                               this.rocket.bodyNodes[0].position, 
                               this.rocket.bodyNodes[0].position.clone().add(
                                   this.rocket.thrust.clone().multiplyScalar(noise*200/this.rocket.maxThrustForce)));
        } else {
            this.thrustArrow.visible = false;
            this.thrustArrow.children.forEach(function (obj) { obj.visible = false; }); // do we need this?
        }
    };

    var LocationHelper = this.LocationHelper = function (size, matopts) {
	    size = size || 1;
        matopts = matopts || {};
        if (matopts.color == undefined) matopts.color = 0x00ffff;
        if (matopts.linewidth == undefined) matopts.linewidth = 2;

	    var geometry = new THREE.Geometry();

        size /= 2;
	    geometry.vertices.push(
		    new THREE.Vector3(-size, 0, 0), new THREE.Vector3(size, 0, 0),
		    new THREE.Vector3(0, -size, 0), new THREE.Vector3(0, size, 0),
		    new THREE.Vector3(0, 0, -size), new THREE.Vector3(0, 0, size)
	    );

	    var material = new THREE.LineBasicMaterial(matopts);

	    THREE.Line.call(this, geometry, material, THREE.LinePieces);
    };
    LocationHelper.prototype = Object.create(THREE.Line.prototype);

    var ThrustControllerViz = this.ThrustControllerViz = function (thrustController, scene) {
        this.thrustController = thrustController;
        this.scene = scene;

        this.locTarget = new LocationHelper(6);
        this.scene.add(this.locTarget);

        this.update();
    }

    ThrustControllerViz.prototype.update = function () {
        if (this.thrustController.target != null) {
            this.locTarget.visible = true;
            this.locTarget.position = this.thrustController.target;
        } else {
            this.locTarget.visible = false;
        }
    };

    ThrustControllerViz.prototype.remove = function () {
        this.scene.remove(this.locTarget);
    };

    var RocketGraphs = this.RocketGraphs = function (dataGetters, x, y, opts) {
        var self = this;

        this.dataGetters = dataGetters;
        this.x = x;
        this.y = y;
        this.opts = opts || {};

        var npoints = 40;
        var idxSteps = 3*(80/npoints);

        function advancePos(g) {
            if (self.opts.horizontal) {
                x += g.width();
            } else {
                y += g.height();
            }
        }

        this.graphAltitude = new Graph('alt', npoints, ["%.1f", "m"], 
                                       {idxSteps: idxSteps, minRange: 1});
        this.graphAltitude.setGeometry(x, y, 80, 80);
        advancePos(this.graphAltitude);

        this.graphVelocity = new Graph('vel', npoints, ["%.1f", "m/s"],
                                       {idxSteps: idxSteps, minRange: 1});
        this.graphVelocity.setGeometry(x, y, 80, 80);
        advancePos(this.graphVelocity);

        this.graphKineticEnergy = new Graph('kinE', npoints, ["%.1f", "J"],
                                            {idxSteps: idxSteps, minRange: 1});
        this.graphKineticEnergy.setGeometry(x, y, 80, 80);
        advancePos(this.graphKineticEnergy);
    }

    RocketGraphs.prototype.remove = function () {
        this.graphAltitude.remove();
        this.graphVelocity.remove();
        this.graphKineticEnergy.remove();
    };

    RocketGraphs.prototype.update = function () {
        this.graphAltitude.addData(this.dataGetters.position());
        this.graphVelocity.addData(this.dataGetters.velocity());
        this.graphKineticEnergy.addData(this.dataGetters.kineticEnergy());
    };

    RocketGraphs.prototype.draw = function () {
        this.graphAltitude.draw();
        this.graphVelocity.draw();
        this.graphKineticEnergy.draw();
    };

}
