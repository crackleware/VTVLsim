nu_crackleware_vtvlsim_Panels = function (THREE, $) {

    function roundRect(ctx, x, y, width, height, radius, mode) {
        if (typeof radius === "undefined") {
            radius = 5;
        }
        if (typeof mode == "undefined" ) {
            mode = 'fill';
        }
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (mode == 'stroke') {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    function drawTextWithOutline(ctx, txt, x, y) {
        ctx.save();

        ctx.strokeStyle = 'black';

        ctx.miterLimit = 2;
        ctx.lineJoin = 'circle';

        ctx.lineWidth = 2;
        ctx.strokeText(txt, x, y);
        ctx.fillText(txt, x, y);

        ctx.restore();
    }

    function formatQuantity(fmt, unit, v) {
        var order = 0;
        if (Math.abs(v) >= 1)
            order = Math.floor(Math.log(Math.abs(v))/Math.log(10));
        order = Math.floor(order/3);
        var unitprefixes = ["", "K", "M", "G", "T", "P", "E", "Z", "Y"];
        if (order < unitprefixes.length) {
            var divisor = Math.exp(Math.log(10)*order*3);
            return sprintf(fmt+unitprefixes[order]+unit, v/divisor);
        } else {
            return sprintf(fmt+unit, v);
        }
    }

    var Instrument = this.Instrument = function (title, fmt, opts) {
        this.title = title;
        this.fmt = fmt;
        this.opts = opts || {};

        this.value = this.opts.initialValue || 0;
        this.minv = this.maxv = 0;

        this.canvas = document.createElement('canvas');
        $(this.canvas).css('position', 'absolute');
        var parent = this.opts.parent || document.body;
        parent.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.redraw = true;
    }

    Instrument.prototype.remove = function () {
        this.canvas.parentNode.removeChild(this.canvas);
    };

    Instrument.prototype.setGeometry = function (x, y, width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        $(this.canvas).css('left', x);
        $(this.canvas).css('top', y);
        $(this.canvas).css('width', width);
        $(this.canvas).css('height', height);
        this.draw();
    };

    Instrument.prototype.width = function () { return this.canvas.width; };
    Instrument.prototype.height = function () { return this.canvas.height; };

    Instrument.prototype.draw = function () {
        if (!this.redraw) return;
        this.redraw = false;

        this.updateMinMax();

        var w = this.canvas.width,
            h = this.canvas.height;

        this.ctx.clearRect(0, 0, w, h);

        this.ctx.fillStyle = 'rgba(0,0,0, 0.3)';
        this.ctx.fillRect(0, 0, w, h);

        this.drawContent();

        this.ctx.strokeStyle = 'rgba(255,255,0, 1.0)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, w, h);

        this.ctx.fillStyle = 'rgba(255,255,0, 0.8)';

        this.ctx.font = '10px arial';
        var txtx2 = 2,
        txty2 = this.ctx.measureText('M').width;
        drawTextWithOutline(this.ctx, this.formatValue(this.maxv), txtx2, txty2);
        drawTextWithOutline(this.ctx, this.formatValue(this.minv), txtx2, h-2);
        drawTextWithOutline(this.ctx, this.formatValue(this.value), txtx2, h/2+txty2/2);

        this.ctx.font = '13px verdana';
        var txtx = w - this.ctx.measureText(this.title).width,
        txty = this.ctx.measureText('M').width;
        if (this.opts.verticalTitle) {
            this.ctx.save();
            this.ctx.rotate(Math.PI/2);
            drawTextWithOutline(this.ctx, this.title, txty2, -(w-txty));
            this.ctx.restore();
        } else {
            drawTextWithOutline(this.ctx, this.title, txtx, txty);
        }
    };

    Instrument.prototype.updateMinMax = function () { };

    Instrument.prototype.formatValue = function (v) {
        return formatQuantity(this.fmt[0], this.fmt[1], v);
    };

    var Graph = this.Graph = function (title, n, fmt, opts) {
        Instrument.call(this, title, fmt, opts);

        this.data = [];
        for (var i = 0; i < n; i++) this.data.push(0);
        this.idx = 0;

        this.idxStep = 0;
        this.idxSteps = this.opts.idxSteps || 1;
    }

    Graph.prototype = Object.create(Instrument.prototype);

    Graph.prototype.addData = function (v) {
        if (this.idxStep == 0) {
            this.data[this.idx] = v;
            this.value = v;
            this.idx = (this.idx + 1) % this.data.length;
            this.redraw = true;
        }
        this.idxStep = (this.idxStep + 1) % this.idxSteps;
    };

    Graph.prototype.updateMinMax = function () {
        var minv, maxv;

        for (var i = 0; i < this.data.length; i++) {
            var v = this.data[(this.idx + i) % this.data.length];
            if (i == 0) {
                minv = maxv = v;
            } else {
                if (v < minv) minv = v;
                if (v > maxv) maxv = v;
            }
        }

        if (this.opts.minv != undefined)
            minv = this.opts.minv;

        if (this.opts.maxv != undefined)
            maxv = this.opts.maxv;

        if (this.opts.minRange) {
            var d = maxv - minv,
            mid = (maxv + minv)/2;
            if (d < this.opts.minRange) {
                minv = mid - this.opts.minRange/2;
                maxv = mid + this.opts.minRange/2;
            }
        }

        this.minv = minv;
        this.maxv = maxv;
    };

    Graph.prototype.drawContent = function () {
        var w = this.canvas.width,
            h = this.canvas.height;

        this.ctx.strokeStyle = 'rgba(255,255,0, 0.9)';
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        for (var i = 0; i < this.data.length; i++) {
            var v = this.data[(this.idx + i) % this.data.length];
            var x = i*w/this.data.length;
            var y = h - h*(v-this.minv)/(this.maxv-this.minv);
            if (i == 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
    };

    var Slider = this.Slider = function (title, fmt, minmax, opts) {
        Instrument.call(this, title, fmt, opts);

        var self = this;

        this.minv = minmax[0];
        this.maxv = minmax[1];

        this.mouseDown = false;

        this.canvas.onmousedown = function (evt) {
            self.mouseDown = true;
            evt.stopPropagation();
            return false;
        };
        this.canvas.onmousemove = function (evt) {
            if (self.mouseDown) {
                self.value = self.minv + (self.maxv-self.minv) * (self.height()-evt.layerY)/self.height();
            }
            evt.stopPropagation();
            return false;
        };
        this.canvas.onmouseup = function (evt) {
            self.mouseDown = false;
            evt.stopPropagation();
            return false;
        };

        this.opts.verticalTitle = true;

        this.t = 0.0;
        this.redrawPeriod =
            this.opts.maxv != undefined ? this.opts.maxv : 100; // ms
    }

    Slider.prototype = Object.create(Instrument.prototype);

    Slider.prototype.drawContent = function () {
        var w = this.canvas.width,
        h = this.canvas.height;

        this.ctx.strokeStyle = '#aaaa00';
        this.ctx.lineWidth = 10;
        this.ctx.beginPath();
        var y = h - h*(this.value-this.minv)/(this.maxv-this.minv);
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(w, y);
        this.ctx.stroke();
    };

    Slider.prototype.update = function (dt) {
        this.t += dt;
        if (this.t >= this.redrawPeriod) {
            this.t -= this.redrawPeriod;
            this.redraw = true;
        }
    }

    var Text = this.Text = function (title, opts) {
        this.title = title;
        this.opts = opts || {};

        this.div = document.createElement('div');
        $(this.div).css('position', 'absolute');
        $(this.div).css('background-color', 'rgba(0,0,0, 0.3)');
        $(this.div).css('border', '1px solid yellow');
        $(this.div).append('<div style="float:right; color: yellow; font: 13px verdana;">'+title+'</div>');
        this.content = $('<pre style="color: yellow; font: 10px verdana; margin: 0px"></pre>');
        $(this.div).append(this.content);
        var parent = this.opts.parent || document.body;
        parent.appendChild(this.div);
    }

    Text.prototype.remove = function () {
        this.div.parentNode.removeChild(this.div);
    };

    Text.prototype.setGeometry = function (x, y, width, height) {
        $(this.div).css('left', x);
        $(this.div).css('top', y);
        $(this.div).css('width', width);
        $(this.div).css('height', height);
    };

    Text.prototype.setContent = function (s) {
        $(this.content).text(s);
    };


    var updateArrow = this.updateArrow = function (arrow, vFrom, vTo, col) {
        if (vFrom instanceof Array)
            vFrom = new THREE.Vector3(vFrom[0], vFrom[1], vFrom[2]);
        if (vTo instanceof Array)
            vTo = new THREE.Vector3(vTo[0], vTo[1], vTo[2]);
        arrow.position.copy(vFrom);
        var d = vTo.clone().sub(vFrom);
        arrow.setDirection(d.clone().normalize());
        var r = d.length() || 0.000001;
        // arrow.setLength(r, 0.2*r, 0.1*r);
        arrow.setLength(r, 0.3*r, 0.12*r);
        if (col != undefined) arrow.setColor(col);
    }


    var Dbg = this.Dbg = function (scene) {
        this.scene = scene;

        this.txt = '';
        this.textDebug = new Text('debug');
        this.textDebug.setGeometry(0, 360, 300, 150);
        this.textUpdatePeriod = 0;

        this.arrows = {};

        this.graphs = {};
        this.graphWidth = 80;
        this.graphHeight = 80;
        this.nextGraphX = null;
        this.nextGraphY = null;
    }

    Dbg.prototype.remove = function (s) {
        this.textDebug.remove();
        for (var label in this.arrows)
            this.scene.remove(this.arrows[label]);
        for (var label in this.graphs)
            this.graphs[label].remove();
    };

    Dbg.prototype.update = function (dt) {
        this.textUpdatePeriod += dt;
        if (this.textUpdatePeriod < 1000/10) return;
        this.textUpdatePeriod = 0;

        this.textDebug.setContent(this.txt);
        this.txt = '';
    };

    Dbg.prototype.text = function (s) {
        this.txt += s+'\n';
    };

    Dbg.prototype.arrow = function (label, vFrom, vTo, col) {
        var arrow = this.arrows[label];
        if (arrow == undefined) {
            arrow = this.arrows[label] = new THREE.ArrowHelper(
                new THREE.Vector3(1,0,0), new THREE.Vector3(), 1, 0xffffff);
            this.scene.add(arrow);
        }
        updateArrow(arrow, vFrom, vTo, col);
    };

    Dbg.prototype.value = function (label, v, idxSteps) {
        var graph = this.graphs[label];
        if (graph == undefined) {
            var docw = $(document).width();
            if (this.nextGraphX == null || this.nextGraphX <= docw - 3*this.graphWidth) {
                this.nextGraphX = docw - this.graphWidth;
                this.nextGraphY = this.nextGraphY != null ? this.nextGraphY + this.graphHeight : 0;
            } else {
                this.nextGraphX -= this.graphWidth;
            }
            graph = this.graphs[label] = new Graph(
                label, this.graphWidth/2, ["%.4f", ""],
                {idxSteps: idxSteps || 60, minRange: 1e-30});
            graph.setGeometry(this.nextGraphX, this.nextGraphY,
                              this.graphWidth, this.graphHeight);
        }
        graph.addData(v);
    };

    Dbg.prototype.draw = function () {
        for (var label in this.graphs)
            this.graphs[label].draw();
    };

}
