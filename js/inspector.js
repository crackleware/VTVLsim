nu_crackleware_vtvlsim_Inspector = function (Window, $) {
    var scope = this;

    var Inspector = this.Inspector = function (root, name, opts) {
        Window.call(this, name, opts);

        var self = this;

        this.root = root;

        var chkProps = $('<input type="checkbox"><i>properties</i></input>');
        var chkFuncs = $('<input type="checkbox"><i>functions</i></input>');
        var chkRefresh = $('<input type="checkbox"><i>refresh</i></input>');
        var chkPersist = $('<input type="checkbox"><i>save changed values</i></input>');

        $(this.div0).append(chkProps);
        $(this.div0).append(chkFuncs);
        $(this.div0).append(chkRefresh);
        $(this.div0).append(chkPersist);

        if (this.opts.show_functions == undefined)
            this.opts.show_functions = false;
        
        if (this.opts.show_properties == undefined)
            this.opts.show_properties = true;

        if (this.opts.auto_refresh == undefined)
            this.opts.auto_refresh = false;

        if (this.opts.save_changes == undefined)
            this.opts.save_changes = true;

        $(chkFuncs[0]).attr('checked', this.opts.show_functions);
        $(chkProps[0]).attr('checked', this.opts.show_properties);
        $(chkRefresh[0]).attr('checked', this.opts.auto_refresh);
        $(chkPersist[0]).attr('checked', this.opts.save_changes);

        function restart() {
            self.opts.show_functions = $(chkFuncs[0]).attr('checked');
            self.opts.show_properties = $(chkProps[0]).attr('checked');
            $(self.div2).html('');
            $(self.div2).append(self.createSubInspector(self.root, 0, [name]));
        }

        chkFuncs[0].addEventListener('change', restart);
        chkProps[0].addEventListener('change', restart);
        chkRefresh[0].addEventListener('change', function (evt) {
            self.opts.auto_refresh = $(evt.target).attr('checked');
        });
        chkPersist[0].addEventListener('change', function (evt) {
            self.opts.save_changes = $(evt.target).attr('checked');
        });

        restart();

        this.refreshTimer = setInterval(function (evt) {
            self.onRefreshTimer();
        }, 1000);

    };

    Inspector.prototype = Object.create(Window.prototype);

    Inspector.prototype.remove = function () {
        Window.prototype.remove.call(this);
        clearInterval(this.refreshTimer);
    };

    function escape(s) { return $('<div/>').text(s).html(); }

    Inspector.prototype.createSubInspector = function (obj, depth, path) {
        var self = this;
        var style = 'style="margin-left: '+(depth*20)+'px"';
        var div = $('<div></div>')[0];
        if (typeof obj == 'function') {
            $(div).append('<pre '+style+'>'+obj.toString()+'</pre>');
        } else {
            var keys = [];
            for (var a in obj) keys.push(a);
            keys.sort().forEach(function (a) {
                var v = obj[a];

                if (typeof v == 'function') {
                    if (!self.opts.show_functions)
                        return;
                } else {
                    if (!self.opts.show_properties)
                        return;
                }

                var cls = 'vtvlsim-inspector-uneditable-value';
                if (typeof v == 'boolean' || typeof v == 'number' || typeof v == 'string') {
                    cls = 'vtvlsim-inspector-editable-value';
                }

                var s = self.format(v);
                var path_ = path.concat([a]);

                var tbl = $('<table '+style+' draggable="true">'+
                            '<tr>'+
                            '<td class="vtvlsim-inspector-attr"><b><span title="'+escape(self.getPathExpression(path_))+'">'+a+'</span></b></td>'+
                            '<td class="vtvlsim-inspector-value '+cls+'">'+escape(s)+'</td>'+
                            '</tr></table>')[0];

                tbl.obj = obj;
                tbl.prop = a;
                tbl.value = v;
                tbl.depth = depth;
                tbl.path = path_;
                tbl.collapsed = true;

                tbl.addEventListener('click', self.onClickProperty.bind(self));
                tbl.addEventListener('dragstart', self.onDragStart.bind(self));

                $('.vtvlsim-inspector-value', tbl)[0].addEventListener('click', function (evt) {
                    self.onClickValue(evt, obj, a, path_);
                });

                $(div).append(tbl);
                $(div).append('<div></div>');
            });
        }
        return div;
    }

    Inspector.prototype.onClickProperty = function (evt) {
        var el = evt.target;
        while (true) {
            if (!el) {
                throw new Error("Inspector: can't find TABLE element");
            }
            if (el.tagName == 'TABLE') {
                break;
            }
            el = el.parentNode;
        }
        var v = el.value;

        if (typeof v == 'object' || typeof v == 'function') {
            if (el.collapsed) {
                el.collapsed = false;
                $(el.nextSibling).append(
                    this.createSubInspector(v, el.depth+1, el.path));
            } else {
                el.collapsed = true;
                $(el.nextSibling).html('');
            }
        }
        
        return false;
    };

    Inspector.prototype.onClickValue = function (evt, obj, prop, path) {
        var changed = false;
        var v = obj[prop];
        if        (typeof v == 'number') {
            var s = prompt('Input new value:', v);
            if (s != null) {
                changed = true;
                obj[prop] = Number(s);
            }
        } else if (typeof v == 'string') {
            var s = prompt('Input new value:', v);
            if (s != null) {
                changed = true;
                obj[prop] = s;
            }
        } else if (typeof v == 'boolean') {
            changed = true;
            obj[prop] = !v;
        }
        $(evt.target).html(escape(this.format(obj[prop])));
        if (changed && this.opts.save_changes) {
            localStorage['changed:'+this.getPathExpression(path)] = 
                JSON.stringify(obj[prop]);
        }
    }

    Inspector.prototype.onRefreshTimer = function () {
        var self = this;
        if (!this.opts.auto_refresh) return;
        $('.vtvlsim-inspector-value', this.div2).each(function () {
            var el = this;
            var tbl = el.parentNode.parentNode.parentNode;
            var v = tbl.obj[tbl.prop];
            // if (typeof v == 'boolean' || typeof v == 'number' || typeof v == 'string') {
            if (1) {
                $(el).html(escape(self.format(v)));
            }
        });
    }

    Inspector.prototype.format = function (v) {
        if        (typeof v == 'number') {
            return JSON.stringify(v);
        } else if (typeof v == 'string') {
            return JSON.stringify(v);
        } else if (typeof v == 'boolean') {
            return JSON.stringify(v);
        } else if (typeof v == 'function') {
            return '[function]';
        } else if (v == null) {
            return 'null';
        } else if (typeof v == 'object') {
            if (v.length != undefined) {
                if (typeof v.length == 'function')
                    return '[object] length='+v.length();
                else
                    return '[object] length='+v.length;
            } else {
                return '[object] '+Object.keys(v).length+' props';
            }
        } else {
            return '';
        }
    };

    Inspector.prototype.onDragStart = function (evt) {
        evt.dataTransfer.setData(
            "text/plain", this.getPathExpression(evt.target.path));
    };

    Inspector.prototype.getPathExpression = function (path) {
        var s = '';
        path.forEach(function (p) {
            var chr = p.charCodeAt(0);
            if (chr >= '0'.charCodeAt(0) && chr <= '9'.charCodeAt(0)) {
                s += '['+p+']';
            } else {
                s += '.'+p;
            }
        });
        return s.substring(1);
    };

}
