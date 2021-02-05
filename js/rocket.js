nu_crackleware_vtvlsim_Rocket = function (
    MassNode,
    RigidLineConstraints,
    RigidDistanceConstraint,
    RigidGroundConstraint,
    BREAKABLE,
    Simulator,
    dbg,
    THREE
) {
    const scope = this;

    scope.Rocket = class Rocket {
        constructor(env) {
            this.env = env;

            const ld = 6; // m

            const bodyY = j => 5.33*j;

            this.msection = 500; // kg
            this.mengine = 500; // kg
            this.mfuel = 400; // kg

            const bodyNodes = [
                new MassNode(new THREE.Vector3(0, bodyY(1), 0), this.msection+this.mengine, env, 'body_0'),
                new MassNode(new THREE.Vector3(0, bodyY(2), 0), this.msection+this.mfuel, env, 'body_1'),
                new MassNode(new THREE.Vector3(0, bodyY(3), 0), this.msection, env, 'body_2'),
                new MassNode(new THREE.Vector3(0, bodyY(4), 0), this.msection, env, 'body_3'),
                new MassNode(new THREE.Vector3(0, bodyY(5), 0), this.msection, env, 'body_4'),
                new MassNode(new THREE.Vector3(0, bodyY(6), 0), this.msection, env, 'body_5')
            ];

            this.topBodyNode = bodyNodes[bodyNodes.length-1];

            const lm = 200; // kg

            const legNodes = [
                new MassNode(new THREE.Vector3(-ld, 0,  ld), lm, env, 'leg_0'),
                new MassNode(new THREE.Vector3( ld, 0,  ld), lm, env, 'leg_1'),
                new MassNode(new THREE.Vector3( ld, 0, -ld), lm, env, 'leg_2'),
                new MassNode(new THREE.Vector3(-ld, 0, -ld), lm, env, 'leg_3')
            ];

            this.bodyNodes = bodyNodes;
            this.legNodes = legNodes;

            this.massNodes = [].concat(bodyNodes, legNodes);

            const csBody = [];
            for (var i = 0; i < bodyNodes.length-2; i++) {
                csBody.push(new RigidLineConstraints(
                    bodyNodes[i+0], bodyNodes[i+1], bodyNodes[i+2],
                    BREAKABLE, env, {visibleLink: true}));
            };

            const csLegBody0 = [];
            const csLegLeg = [];
            const csLegBody1 = [];
            for (var i = 0; i < legNodes.length; i++) {
                csLegBody0.push(new RigidDistanceConstraint(
                    legNodes[i], bodyNodes[0],
                    BREAKABLE, env, {visibleLink: true}));
                csLegLeg.push(new RigidDistanceConstraint(
                    legNodes[i], legNodes[(i+1) % legNodes.length],
                    BREAKABLE, env, {visibleLink: false}));

                csLegBody1.push(new RigidDistanceConstraint(
                    legNodes[i], bodyNodes[1],
                    BREAKABLE, env, {visibleLink: false}));
            };

            this.constraints = [].concat(csBody, csLegBody0, csLegLeg, csLegBody1);

            this.constraintDeps = [
                [csLegBody0[0], csLegLeg[0]],
                [csLegBody0[1], csLegLeg[1]],
                [csLegBody0[2], csLegLeg[2]],
                [csLegBody0[3], csLegLeg[3]],

                [csLegBody0[0], csLegBody1[0]],
                [csLegBody0[1], csLegBody1[1]],
                [csLegBody0[2], csLegBody1[2]],
                [csLegBody0[3], csLegBody1[3]],

                [csBody[0], csLegBody1[0]],
                [csBody[0], csLegBody1[1]],
                [csBody[0], csLegBody1[2]],
                [csBody[0], csLegBody1[3]]
            ];

            this.massNodes.forEach(n => {
                this.constraints.push(new RigidGroundConstraint(n, env));
            });

            this.thrust = new THREE.Vector3();

            this.maxThrustForce = 620e3; // N
        }

        forEachMassNode(f) {
            this.massNodes.forEach(f);
        }

        update(dt) {
            this.constraints.forEach(c => {
                c.distributeForces();
            });
            this.constraintDeps.forEach(dep => {
                const c1 = dep[0], c2 = dep[1];
                if (c1.broken) c2.broken = true;
            });

            if (this.brokenConstraintsCount() == 0)
                this.bodyNodes[0].force.add(this.thrust.clone().negate());

            this.massNodes.forEach(n => {
                n.update(dt);
            });
        }

        totalMass() {
            var mtotal = 0;
            this.forEachMassNode(n => { mtotal += n.mass; });
            return mtotal;
        }

        brokenConstraintsCount() {
            var cnt = 0;
            this.constraints.forEach(c => {
                if (c.broken) cnt++;
            });
            return cnt;
        }

        setThrust(t) {
            this.thrust = t;
        }

        saveState() {
            const state = [];
            this.massNodes.forEach(n => {
                state.push(n.velocity.clone());
                state.push(n.position.clone());
            });
            this.constraints.forEach(c => {
                state.push(c.broken);
            });
            return state;
        }

        loadState(state) {
            var i = 0;
            this.massNodes.forEach(n => {
                n.velocity.copy(state[i++]);
                n.position.copy(state[i++]);
            });
            this.constraints.forEach(c => {
                c.broken = state[i++];
            });
        }
    }


    scope.ThrustController = class ThrustController {
        constructor(rocket, env) {
            this.rocket = rocket;
            this.env = env;
            this.setTarget(null);
            this.debug = false;
        }

        setTarget(target) {
            this.target = target;
        }

        resetInternals() {
            // delete this.v1prev;
            delete this.aprev;
            delete this.xvelprev_prev;
            delete this.aacc_prev;
            delete this.f_prev;
        }

        update(dt) {
            const v1 = this.rocket.topBodyNode.position.clone().sub(this.rocket.bodyNodes[0].position).normalize();

            if (this.target == null) {
                this.resetInternals();
                return;
            }

            const vt = this.target.clone(); vt.y = 50000;
            const v2 = vt.clone().sub(this.rocket.bodyNodes[0].position).normalize();
            const v3 = v2.clone().negate().reflect(v1);

            if (this.rocket.bodyNodes[0].position.y > this.rocket.topBodyNode.position.y) {
                this.rocket.setThrust(new THREE.Vector3());
                this.resetInternals();
                return;
            }

            if (Math.abs(v1.x) > Math.abs(v1.y)) {
                this.resetInternals();
                return;
            }

            function r2d(v) { return v/Math.PI*180; }
            function limit(v, lim) {
                return (v > 0) ? Math.min(lim, v) : -Math.min(lim, Math.abs(v));
            }

            const ttime = 2.0;

            const dy = this.target.clone().sub(this.rocket.bodyNodes[0].position).y;
            const yvel = dy/(2*ttime);
            // yvel = limit(yvel, 1*40);
            const yacc = (yvel - this.rocket.bodyNodes[0].velocity.y) / (ttime/4);

            const mtotal = this.rocket.totalMass();
            var f = (yacc + this.env.gravity)*mtotal;

            const lowpass = (label, v, k) => {
                const vp = label+'_prev';
                if (this[vp] == undefined) this[vp] = v;
                v = (1-k)*this[vp] + k*v;
                this[vp] = v;
                return v;
            };

            // NOTE: controller currently works only in 2D (on X-Y plane)!

            {
                var xvelprev = this.rocket.bodyNodes[0].velocity.x;
                xvelprev = lowpass('xvelprev', xvelprev, 0.3); // for stability
                var dx = vt.x - this.rocket.bodyNodes[0].position.x;
                var xvel = dx / (2*ttime);
                xvel = limit(xvel, 30);
                var xacc = (xvel - xvelprev) / (ttime/4);
                var a = r2d(Math.asin(v1.x));
                var at = r2d(Math.asin(xacc/80));
                at = limit(at, 20);
                if (this.aprev == undefined) this.aprev = a;
                var avelprev = (a - this.aprev) / dt;
                this.aprev = a;
                var avel = (at - a) / (ttime/2);
                var aacc = (avel - avelprev) / (ttime/4);
                aacc = limit(aacc, 20);
                aacc = lowpass('aacc', aacc, 0.03); // for stability
                if (this.debug) {
                    dbg.value('dx', dx);
                    dbg.value('xvelprev', xvelprev);
                    dbg.value('xvel', xvel);
                    dbg.value('xacc', xacc);
                    dbg.value('a', a);
                    dbg.value('at', at);
                    dbg.value('avelprev', avelprev);
                    dbg.value('avel', avel);
                    dbg.value('aacc', aacc);
                }
            }

            if (f < 1) f = 1;
            f = limit(f, 200e3);
            f = lowpass('f', f, 0.1);

            if (isNaN(aacc) || isNaN(f)) {
                this.resetInternals();
                f = 0;
                aacc = 0;
            }

            this.rocket.setThrust(
                v1.clone().applyAxisAngle(new THREE.Vector3(0,0,1), aacc/180*Math.PI)
                    .multiplyScalar(f).negate());
        }

        forEachMassNode(f) { }
    }

}
