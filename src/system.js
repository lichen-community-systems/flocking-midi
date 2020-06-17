/*
 * Flocking Web MIDI System
 * https://github.com/continuing-creativity/flocking-midi
 *
 * Copyright 2014-2020, Colin Clark
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */

"use strict";

var flock = fluid.registerNamespace("flock");

/**
 * Represents the overall Web MIDI system,
 * including references to all the available MIDI ports
 * and the MIDIAccess object.
 */
// TODO: This should be a model component!
fluid.defaults("flock.midi.system", {
    gradeNames: ["fluid.component"],

    sysex: false,

    members: {
        access: undefined,
        ports: undefined
    },

    invokers: {
        requestAccess: {
            funcName: "flock.midi.requestAccess",
            args: [
                "{that}.options.sysex",
                "{that}.events.onAccessGranted.fire",
                "{that}.events.onAccessError.fire"
            ]
        },

        refreshPorts: {
            funcName: "flock.midi.system.refreshPorts",
            args: ["{that}", "{that}.access", "{that}.events.onPortsAvailable.fire"]
        }
    },

    events: {
        onAccessGranted: null,
        onAccessError: null,
        onReady: null,
        onPortsAvailable: null
    },

    listeners: {
        "onCreate.requestAccess": {
            func: "{that}.requestAccess"
        },

        "onAccessGranted.setAccess": {
            func: "flock.midi.system.setAccess",
            args: ["{that}", "{arguments}.0"]
        },

        "onAccessGranted.refreshPorts": {
            priority: "after:setAccess",
            func: "{that}.refreshPorts"
        },

        "onAccessGranted.fireOnReady": {
            priority: "after:refreshPorts",
            func: "{that}.events.onReady.fire",
            args: ["{that}.ports)"]
        },

        "onAccessError.logError": {
            funcName: "fluid.log",
            args: [fluid.logLevel.WARN, "MIDI Access Error: ", "{arguments}.0"]
        }

        // TODO: Provide an onDestroy listener
        // that will close any ports that are open.
    }
});

flock.midi.system.setAccess = function (that, access) {
    that.access = access;
};

flock.midi.system.refreshPorts = function (that, access, onPortsAvailable) {
    that.ports = flock.midi.getPorts(access);
    onPortsAvailable(that.ports);
};
