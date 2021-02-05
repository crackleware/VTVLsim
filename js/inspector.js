nu_crackleware_vtvlsim_Inspector = function (Window, $) {
    const scope = this;

    function escape(s) { return $('<div/>').text(s).html(); }

    scope.Inspector = class Inspector extends Window {
        constructor(root, name, opts) {
            super(name, opts);

            this.root = root;

            const chkProps = $('<input type="checkbox"><i>properties</i></input>');
            const chkFuncs = $('<input type="checkbox"><i>functions</i></input>');
            const chkRefresh = $('<input type="checkbox"><i>refresh</i></input>');
            const chkPersist = $('<input type="checkbox"><i>save changed values</i></input>');

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

            const restart = () => {
                this.opts.show_functions = $(chkFuncs[0]).attr('checked');
                this.opts.show_properties = $(chkProps[0]).attr('checked');
                $(this.div2).html('');
                $(this.div2).append(this.createSubInspector(this.root, 0, [name]));
            };

            chkFuncs[0].addEventListener('change', restart);
            chkProps[0].addEventListener('change', restart);
            chkRefresh[0].addEventListener('change', (evt) => {
                this.opts.auto_refresh = $(evt.target).attr('checked');
            });
            chkPersist[0].addEventListener('change', (evt) => {
                this.opts.save_changes = $(evt.target).attr('checked');
            });

            restart();

            this.refreshTimer = setInterval((evt) => {
                this.onRefreshTimer();
            }, 1000);
        }

        remove() {
            super.remove();
            clearInterval(this.refreshTimer);
        }

        createSubInspector(obj, depth, path) {
            const style = 'style="margin-left: '+(depth*20)+'px"';
            const div = $('<div></div>')[0];
            if (typeof obj == 'function') {
                $(div).append('<pre '+style+'>'+obj.toString()+'</pre>');
            } else {
                const keys = [];
                for (const a in obj) keys.push(a);
                keys.sort().forEach((a) => {
                    const v = obj[a];

                    if (typeof v == 'function') {
                        if (!this.opts.show_functions)
                            return;
                    } else {
                        if (!this.opts.show_properties)
                            return;
                    }

                    var cls = 'vtvlsim-inspector-uneditable-value';
                    if (typeof v == 'boolean' || typeof v == 'number' || typeof v == 'string') {
                        cls = 'vtvlsim-inspector-editable-value';
                    }

                    const s = this.format(v);
                    const path_ = path.concat([a]);

                    const tbl = $('<table '+style+' draggable="true">'+
                                '<tr>'+
                                '<td class="vtvlsim-inspector-attr"><b><span title="'+escape(this.getPathExpression(path_))+'">'+a+'</span></b></td>'+
                                '<td class="vtvlsim-inspector-value '+cls+'">'+escape(s)+'</td>'+
                                '</tr></table>')[0];

                    tbl.obj = obj;
                    tbl.prop = a;
                    tbl.value = v;
                    tbl.depth = depth;
                    tbl.path = path_;
                    tbl.collapsed = true;

                    tbl.addEventListener('click', this.onClickProperty.bind(this));
                    tbl.addEventListener('dragstart', this.onDragStart.bind(this));

                    $('.vtvlsim-inspector-value', tbl)[0].addEventListener('click', (evt) => {
                        this.onClickValue(evt, obj, a, path_);
                    });

                    $(div).append(tbl);
                    $(div).append('<div></div>');
                });
            }
            return div;
        }

        onClickProperty(evt) {
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
            const v = el.value;

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
        }

        onClickValue(evt, obj, prop, path) {
            var changed = false;
            const v = obj[prop];
            if        (typeof v == 'number') {
                const s = prompt('Input new value:', v);
                if (s != null) {
                    changed = true;
                    obj[prop] = Number(s);
                }
            } else if (typeof v == 'string') {
                const s = prompt('Input new value:', v);
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

        onRefreshTimer() {
            if (!this.opts.auto_refresh) return;
            $('.vtvlsim-inspector-value', this.div2).each(() => {
                const el = this;
                const tbl = el.parentNode.parentNode.parentNode;
                const v = tbl.obj[tbl.prop];
                // if (typeof v == 'boolean' || typeof v == 'number' || typeof v == 'string') {
                if (1) {
                    $(el).html(escape(this.format(v)));
                }
            });
        }

        format(v) {
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
        }

        onDragStart(evt) {
            evt.dataTransfer.setData(
                "text/plain", this.getPathExpression(evt.target.path));
        }

        getPathExpression(path) {
            var s = '';
            path.forEach((p) => {
                const chr = p.charCodeAt(0);
                if (chr >= '0'.charCodeAt(0) && chr <= '9'.charCodeAt(0)) {
                    s += '['+p+']';
                } else {
                    s += '.'+p;
                }
            });
            return s.substring(1);
        }
    }

}
