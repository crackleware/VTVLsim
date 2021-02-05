nu_crackleware_vtvlsim_Tests = function (
    Environment,
    Simulator,
    Rocket,
    MassNode,
    RigidGroundConstraint,
    THREE
) {
    const scope = this;

    scope.testPhysicsSimulationAccuracy1 = function (opts) {
        opts = opts || {quiet: true};

        const env = new Environment();

        const rocket = new Rocket(env);
        const rocketTopNode = rocket.topBodyNode;

        const initialPos = rocketTopNode.position.y;

        const mtotal = rocket.totalMass();
        if (!opts.quiet) console.log('mtotal:', mtotal);
        const mn1 = new MassNode(new THREE.Vector3(30, initialPos, 0), mtotal, env, 'mn1');
        mn1.constraints = [new RigidGroundConstraint(mn1, env)];
        mn1.update = function (dt) {
            mn1.constraints.forEach(function (c) {
                c.distributeForces();
            });
            mn1.constructor.prototype.update.bind(mn1)(dt);
        };

        // rocketTopNode.debug = true;
        // mn1.debug = true;

        const sim = new Simulator([rocket, mn1], [], env);

        const lastPrintoutT = -100.0;
        const thrust = 620e3; // N

        while (sim.currentTime < 30.0) {
            sim.update(sim.physicsDT, function (dt) {
                rocketTopNode.force.y += thrust;
                mn1.force.y += thrust;
            });

            const aAnalytic = thrust/mtotal - env.gravity;
            var   yAnalytic = initialPos + aAnalytic*Math.pow(sim.currentTime, 2)/2;
            const vAnalytic = aAnalytic*sim.currentTime;

            if (!opts.quiet) {
                if (sim.currentTime >= lastPrintoutT + 1.0) {
                    lastPrintoutT = sim.currentTime;
                    console.log('t: '+sim.currentTime+', '+
                                'comparison: '+([100*rocketTopNode.position.y/mn1.position.y,
                                                 100*rocketTopNode.position.y/yAnalytic])+', '+
                                'rocket: '+[rocketTopNode.position.y, rocketTopNode.velocity.y]+', '+
                                'point-mass: '+[mn1.position.y, mn1.velocity.y],
                                'analytic-point-mass: '+[yAnalytic, vAnalytic]);
                }
            }
        }

        const simError = Math.abs(100 - 100*rocketTopNode.position.y/yAnalytic);
        if (simError > 0.01) {
            throw new Error('simulation error is too high ('+simError+'%)');
        } else {
            console.log('simulation error is acceptable ('+simError+'%)');
        }
    }

}

