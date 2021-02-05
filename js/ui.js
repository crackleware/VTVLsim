nu_crackleware_vtvlsim_UI = function (
    Setup,
    Main,
    Inspector,
    Instructions,
    $
) {
    const scope = this;

    scope.Button = class Button {
        constructor(label, css, click_cb) {
            const style =
                'color: rgb(213, 213, 213);'+
                '-webkit-appearance: none;'+
                'border-radius: 0px;'+
                'margin: 0px;'+
                'padding: 2px;'+
                'white-space: normal;'+
                'position: absolute;'+
                css;
            this.inputElement = $('<input type="button" value="'+label+'" style="'+style+'" class="vtvlsim-ui"></input>')[0];
            $(document.body).append(this.inputElement);
            this.inputElement.addEventListener('click', click_cb);
            this.setActive(false);
        }

        setActive(active) {
            this.active = active;
            $(this.inputElement).css(
                'text-decoration', active ? 'underline' : '');
        }
    }

    scope.btnResetEverything = new scope.Button(
        'Reset everything',
        'background: rgb(141, 48, 48);'+
        'border: solid 1px rgb(214, 58, 58);'+
        'left: 0px; top: 0px; width: 80px; height: 50px',
        evt => {
            localStorage.clear();
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    );

    scope.btnRestart = new scope.Button(
        'Restart',
        'background: rgb(155, 81, 0);'+
        'border: solid 1px rgb(255, 142, 142);'+
        'left: 80px; top: 0px; width: 80px; height: 50px',
        evt => {
            Main.restart();
        }
    );

    scope.inspector = null;
    scope.btnInspectMain = new scope.Button(
        'Inspect Main',
        'background: rgb(23, 104, 192);'+
        'border: solid 1px rgb(58, 214, 195);'+
        'left: 160px; top: 0px; width: 80px; height: 50px',
        evt => {
            if (!scope.inspector) {
                scope.inspector = new Inspector(Main, 'Main', {
                    close_cb: () => {
                        scope.inspector = null;
                        scope.btnInspectMain.setActive(false);
                    }});
                scope.btnInspectMain.setActive(true);
            } else {
                scope.inspector.remove();
                scope.inspector = null;
                scope.btnInspectMain.setActive(false);
            }
        }
    );

    scope.btnFreeLook = new scope.Button(
        'Free-Look',
        'background: rgb(23, 165, 192);'+
        'border: solid 1px rgb(58, 214, 195);'+
        'left: 240px; top: 0px; width: 80px; height: 50px',
        evt => {
            Setup.requestPointerLock();
        }
    );
    Setup.controls.pointerLockChangeCBs.push(function (active) {
        scope.btnFreeLook.setActive(active);
        $('#aiming_cross').css('display', active ? 'initial' : 'none');
    });

    scope.instructions = null;
    scope.btnInstructions = new scope.Button(
        'Instructions',
        'background: rgb(57, 146, 45);'+
        'border: solid 1px rgb(210, 228, 0);'+
        'left: 320px; top: 0px; width: 80px; height: 50px',
        evt => {
            if (!scope.instructions) {
                scope.instructions = new Instructions({
                    close_cb: () => {
                        scope.instructions = null;
                        scope.btnInstructions.setActive(false);
                    }});
                scope.btnInstructions.setActive(true);
            } else {
                scope.instructions.remove();
                scope.instructions = null;
                scope.btnInstructions.setActive(false);
            }
        }
    );

}

