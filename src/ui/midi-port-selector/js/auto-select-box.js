/*
 * Flocking UI Select Box
 *   Copyright 2014-2019, Colin Clark and Tony Atkins
 *
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */

"use strict";

var flock = fluid.registerNamespace("flock");

fluid.defaults("flock.midi.deviceSelectBox", {
    gradeNames: ["flock.ui.selectBox"],

    preferredOption: undefined,

    listeners: {
        "onRender.selectInitial": {
            priority: "after:renderOptions",
            funcName: "flock.midi.deviceSelectBox.selectInitial",
            args: "{that}"
        }
    }
});

flock.midi.deviceSelectBox.selectInitial = function (that) {
    var optionsLength = fluid.get(that, "model.options.length");
    if (optionsLength) {
        if (!that.model.selection && that.options.preferredOption) {
            var matchingPort = fluid.find(that.model.options, function (portDef) {
                var portName = fluid.get(portDef, "name");
                return portName === that.options.preferredOption ? portDef : undefined;
            });
            if (matchingPort) {
                flock.ui.selectBox.selectElement(that.container, matchingPort.id);
                that.applier.change("selection", matchingPort.id);
                that.events.onSelect.fire();
            }
        }
        else if (that.model.selection) {
            flock.ui.selectBox.selectElement(that.container, that.model.selection);
        }
        else {
            flock.ui.selectBox.selectFirstOption(that);
        }
    }
};
