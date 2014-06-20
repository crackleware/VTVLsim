nu_crackleware_vtvlsim_Simulator = function (THREE) {

    var Simulator = this.Simulator = function (phyobjs, vizobjs, env) {
        this.phyobjs = phyobjs;
        this.vizobjs = vizobjs || [];
        this.env = env;

        this.currentTime = 0;
        this.physicsDT = 1000/60; // ms
        this.dtOverflow = 0;

        this.events = [];
    }

    Simulator.prototype.update = function (dt, applyExternalForcesFn) {
        var self = this;

        var events_ = this.events.slice(0);
        this.events = [];
        events_.forEach(function (evt) {
            if (self.currentTime >= evt[0])
                evt[1]();
            else
                self.events.push(evt);
        });

        this.dtOverflow += dt;
        dt_ = this.physicsDT/this.env.itersPerPhysicsUpdate;
        while (true) {
            if (this.dtOverflow - dt_ < 0) break;
            this.dtOverflow -= dt_;
            this.currentTime += dt_/1000;

            this.phyobjs.forEach(function (obj) {
                obj.forEachMassNode(function (n) {
                    n.prepareForUpdate();
                    n.force.add(new THREE.Vector3(0, -self.env.gravity*n.mass, 0));
                });
            });

            if (applyExternalForcesFn)
                applyExternalForcesFn(dt);

            this.phyobjs.forEach(function (obj) {
                obj.update(dt_/1000);
            });
        }

        this.vizobjs.forEach(function (obj) {
            obj.update();
        });
    };

    Simulator.prototype.scheduleEvent = function (t, f) {
        this.events.push([t, f]);
    };

}

