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
fluid.defaults("flock.midi.system", {
    gradeNames: ["fluid.modelComponent"],

    sysex: false,

    members: {
        access: undefined
    },

    model: {
        ports: {}
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
            args: [
                "{that}.access",
                "{that}.events.onPortsAvailable.fire"
            ]
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

        "onAccessGranted.bindAutoRefresh": {
            priority: "after:refreshPorts",
            funcName: "flock.midi.system.listenForPortChanges",
            args:     ["{that}", "{arguments}.0"] // accessObject
        },

        "onAccessGranted.fireOnReady": {
            priority: "after:refreshPorts",
            func: "{that}.events.onReady.fire",
            args: ["{that}.ports)"]
        },

        "onAccessError.logError": {
            funcName: "fluid.log",
            args: [fluid.logLevel.WARN, "MIDI Access Error: ", "{arguments}.0"]
        },

        "onPortsAvailable.modelizePorts": {
            funcName: "flock.midi.system.modelizePorts",
            args: ["{that}.applier", "{arguments}.0"]
        }

        // TODO: Provide an onDestroy listener
        // that will close any ports that are open.
    }
});

flock.midi.system.setAccess = function (that, access) {
    that.access = access;
};

flock.midi.system.refreshPorts = function (access, onPortsAvailable) {
    var ports = flock.midi.getPorts(access);
    onPortsAvailable(ports);
};

flock.midi.system.modelizePorts = function (applier, ports) {
    // Delete the entire existing collection of ports
    // and replace with the current member variable.
    var transaction = applier.initiate();
    transaction.fireChangeRequest({ path: "ports", type: "DELETE" });
    transaction.fireChangeRequest({ path: "ports", value: ports });
    transaction.commit();
};

flock.midi.system.listenForPortChanges = function (that, access) {
    if (access) {
        access.onstatechange = that.refreshPorts;
    }
};
