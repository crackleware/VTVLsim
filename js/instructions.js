nu_crackleware_vtvlsim_Instructions = function (Window, $) {
    const scope = this;

    scope.Instructions = class Instructions extends Window {
        constructor(opts) {
            super('Instructions', opts);

            $.get('instructions.html', d => {
                $(this.div2).html(d);
            });
        }
    }
}
