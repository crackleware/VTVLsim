nu_crackleware_vtvlsim_Simulator = function (THREE) {
    const scope = this;

    scope.Simulator = class Simulator {
        constructor(phyobjs, vizobjs, env) {
            this.phyobjs = phyobjs;
            this.vizobjs = vizobjs || [];
            this.env = env;

            this.currentTime = 0;
            this.physicsDT = 1000/60; // ms
            this.dtOverflow = 0;

            this.events = [];
        }

        update(dt, applyExternalForcesFn) {
            var events_ = this.events.slice(0);
            this.events = [];
            events_.forEach(evt => {
                if (this.currentTime >= evt[0])
                    evt[1]();
                else
                    this.events.push(evt);
            });

            this.dtOverflow += dt;
            var dt_ = this.physicsDT/this.env.itersPerPhysicsUpdate;
            while (true) {
                if (this.dtOverflow - dt_ < 0) break;
                this.dtOverflow -= dt_;
                this.currentTime += dt_/1000;

                this.phyobjs.forEach(obj => {
                    obj.forEachMassNode(n => {
                        n.prepareForUpdate();
                        n.force.add(new THREE.Vector3(0, -this.env.gravity*n.mass, 0));
                    });
                });

                if (applyExternalForcesFn)
                    applyExternalForcesFn(dt);

                this.phyobjs.forEach(obj => {
                    obj.update(dt_/1000);
                });
            }

            this.vizobjs.forEach(obj => {
                obj.update();
            });
        }

        scheduleEvent(t, f) {
            this.events.push([t, f]);
        }
    }
}

