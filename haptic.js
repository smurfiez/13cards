function hapticTap() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
    }
}

function hapticSuccess() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([10, 40, 10]);
    }
}

function hapticError() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([20, 30, 20]);
    }
}
