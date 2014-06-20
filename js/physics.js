nu_crackleware_vtvlsim_Physics = function (THREE) {
    var scope = this;

    var Environment = this.Environment = function () {
        this.gravity = 9.81; // m/s^2

        this.rigidCoef = 20;
        this.itersPerPhysicsUpdate = 10;
        this.defaultDispForceCoef = 150000;

        this.damageForceThreshold = 1.5e6;

        this.dampingCoef = 1.0;

        this.forceMax = 0;
    }

    Environment.prototype.updateForceMax = function(fs) {
        var self = this;
        fs.forEach(function (f) {
            self.forceMax = Math.max(f.length(), self.forceMax);
        });
    }

    this.nodeIndex = 0;
    var nextNodeUniqueId = this.nextNodeUniqueId = function () { 
        return scope.nodeIndex++; 
    }

    var MassNode = this.MassNode = function (position, mass, env, name) {
        this.id = nextNodeUniqueId();
        this.position = position;
        this.velocity = new THREE.Vector3();
        this.mass = mass;
        this.env = env;
        this.name = name;

        this.debug = false;

        this.prepareForUpdate();
    };

    MassNode.prototype.prepareForUpdate = function () {
        this.force = new THREE.Vector3();
        this.damping = new THREE.Vector3(1, 1, 1);
    };

    this.low_pass_V3 = function(v, vnew, k) {
        v.copy(v.clone().multiplyScalar(1-k).add(
            vnew.clone().multiplyScalar(k)));
    }

    MassNode.prototype.update = function (dt) {
        this.velocity.add(this.force.clone().multiplyScalar(dt/this.mass));
        this.velocity.multiply(
            this.damping.clone().multiplyScalar(this.env.dampingCoef));

        this.position.add(this.velocity.clone().multiplyScalar(dt));

        this.env.updateForceMax([this.force]);

        if (this.debug) {
            console.log(this.name+': '+
                        'f=['+[this.force.x, this.force.y, this.force.z]+'], '+
                        'v=['+[this.velocity.x, this.velocity.y, this.velocity.z]+'], '+
                        'pos=['+[this.position.x, this.position.y, this.position.z]+']'
                       );
        }
    };

    MassNode.prototype.forEachMassNode = function (f) {
        f(this);
    };

    NON_BREAKABLE = false;
    BREAKABLE = true;

    var RigidLineConstraints = this.RigidLineConstraints = function (
        node1, node2, node3, breakable, env, aux) {
        this.n1 = node1;
        this.n2 = node2;
        this.n3 = node3;
        this.breakable = breakable;
        this.env = env;
        this.aux = aux || {};

        this.broken = false;

        this.r12 = (new THREE.Vector3()).subVectors(
            this.n2.position, this.n1.position).length();
        this.r23 = (new THREE.Vector3()).subVectors(
            this.n3.position, this.n2.position).length();
    }

    RigidLineConstraints.prototype = {
        distributeForces: function () {
            if (this.broken) return;

            var k = this.env.defaultDispForceCoef*
                this.env.rigidCoef*
                this.env.itersPerPhysicsUpdate;

            var f3 = this._accForce(k, this.n1, this.n2, this.n3, this.r23);
            var f1 = this._accForce(k, this.n3, this.n2, this.n1, this.r12);

            var f2 = new THREE.Vector3();
            f2.add(f3);
            f2.add(f1);
            this.n2.force.add(f2.negate());

            if (this.breakable && (
                f1.length() > this.env.damageForceThreshold || 
                    f2.length() > this.env.damageForceThreshold ||
                    f3.length() > this.env.damageForceThreshold))
                this.broken = true;
        },
        _accForce: function (k, Na, Nb, Nc, Rbc) {
            var Dbc = (new THREE.Vector3()).subVectors(
                Nb.position, Na.position
            ).normalize().multiplyScalar(Rbc);
            var v = Nb.position.clone().add(Dbc)
                .sub(Nc.position).multiplyScalar(k);
            Nc.force.add(v);
            return v;
        }
    };

    var RigidDistanceConstraint = this.RigidDistanceConstraint = function (
        node1, node2, breakable, env, aux) {
        this.n1 = node1;
        this.n2 = node2;
        this.breakable = breakable;
        this.env = env;
        this.aux = aux || {};
        
        this.broken = false;
        
        this.r = this.distance();
    }

    RigidDistanceConstraint.prototype = {
        distance: function () {
            return (new THREE.Vector3()).subVectors(
                this.n2.position, this.n1.position).length();
        },
        distributeForces: function () {
            if (this.broken) return;

            var k = this.env.defaultDispForceCoef*
                this.env.rigidCoef*
                this.env.itersPerPhysicsUpdate;

            var f1 = this._accForce(k, this.n1, this.n2, this.r);
            var f2 = this._accForce(k, this.n2, this.n1, this.r);

            if (this.breakable && (
                f1.length() > this.env.damageForceThreshold || 
                    f2.length() > this.env.damageForceThreshold))
                this.broken = true;
        },
        _accForce: function (k, Na, Nb, R) {
            var Dab = (new THREE.Vector3()).subVectors(
                Nb.position, Na.position
            ).normalize().multiplyScalar(R);
            var v = Na.position.clone().add(Dab)
                .sub(Nb.position).multiplyScalar(k);
            Nb.force.add(v);
            return v;
        }
    };

    var RigidGroundConstraint = this.RigidGroundConstraint = function (
        node, env, aux) {
        this.node = node;
        this.env = env;
        this.aux = aux || {};
    };

    RigidGroundConstraint.prototype = {
        distributeForces: function () {
            var k = 100e3*this.env.itersPerPhysicsUpdate;
            if (this.node.position.y < 0) {
                var f = new THREE.Vector3(0, -this.node.position.y*k, 0);
                this.node.force.add(f);
                this.node.damping.multiply(new THREE.Vector3(0.97, 0.90, 0.97));
            }
            this.node.groundContact = this.node.position.y < 1;
        }
    };

    this.kineticEnergyOfNodes = function (nodes) {
        var energy = 0;
        nodes.forEach(function (n) {
            var v = n.velocity.length();
            energy += n.mass*(v*v)/2;
        });
        return energy;
    }

}
