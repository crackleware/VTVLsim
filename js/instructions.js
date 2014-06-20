nu_crackleware_vtvlsim_Instructions = function (Window, $) {
    var scope = this;

    var Instructions = this.Instructions = function (opts) {
        Window.call(this, 'Instructions', opts);

        var self = this;

        $.get('instructions.html', function (d) {
            $(self.div2).html(d);
        });
    }
    
    Instructions.prototype = Object.create(Window.prototype);
}
