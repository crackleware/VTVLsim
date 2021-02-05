nu_crackleware_vtvlsim_Window = function ($) {
    const scope = this;

    scope.Window = class Window {
        constructor(name, opts) {
            this.name = name;
            this.opts = opts || {};

            this.div = document.createElement('div');
            $(this.div).css('position', 'absolute');
            $(this.div).css('border', 'solid 1px white');
            $(this.div).css('background', 'rgba(0, 0, 0, 0.4)');
            $(this.div).css('color', '#bbb');
            $(this.div).css('overflow', 'hidden');
            $(this.div).css('cursor', 'default');

            $(this.div).attr('class', 'vtvlsim-window');

            var parent = this.opts.parent || document.body;
            parent.appendChild(this.div);

            var btnClose = $('<a style="float: right; color: rgb(0, 204, 255); text-decoration: none;" href="#"><img src="close.png"/></a>')[0];
            $(this.div).append(btnClose);
            btnClose.addEventListener('click', evt => {
                this.remove();
            });

            $(this.div).append('<h1 style="margin: 0px">'+name+'</h1>');

            if (this.opts.close_cb == undefined)
                this.opts.close_cb = () => { };

            this.div0 = document.createElement('div');
            $(this.div).append(this.div0);

            this.div2 = document.createElement('div');
            $(this.div2).css('overflow', 'auto');
            $(this.div2).css('height', '86%'); // ?
            $(this.div).append(this.div2);

            var w = $(document).width(), h = $(document).height();
            var size = 0.6;
            this.setGeometry(w/2-size*w/2, h/2-size*h/2, size*w, size*h);
        }

        remove() {
            this.div.parentNode.removeChild(this.div);
            this.opts.close_cb(this);
        }

        setGeometry(x, y, width, height) {
            this.div.width = width;
            this.div.height = height;
            $(this.div).css('left', x);
            $(this.div).css('top', y);
            $(this.div).css('width', width);
            $(this.div).css('height', height);
        }
    }

}
