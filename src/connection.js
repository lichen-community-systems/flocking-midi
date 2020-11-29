/*
 * Flocking Web MIDI Connection
 * https://github.com/continuing-creativity/flocking-midi
 *
 * Copyright 2014-2020, Colin Clark
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */

/*global Promise*/

"use strict";

var flock = fluid.registerNamespace("flock");

/**
 * A MIDI Connection represents a connection between an arbitrary set of
 * input and output ports across one or more MIDI devices connected to the system.
 */
// TODO: Handle port disconnection events.
fluid.defaults("flock.midi.connection", {
    gradeNames: ["flock.midi.receiver"],

    openImmediately: false,

    sysex: false,

    distributeOptions: {
        source: "{that}.options.sysex",
        target: "{that > system}.options.sysex"
    },

    // Supported PortSpec formats:
    //  - Number: the index of the input and output port to use (this is the default)
    //  - { manufacturer: "akai", name: "LPD8"}
    //  - { input: Number, output: Number}
    //  - { input: { manufacturer: "akai", name: "LPD8"}, output: {manufacturer: "korg", name: "output"}}
    ports: 0,

    invokers: {
        sendRaw: {
            func: "{that}.events.onSendRaw.fire"
        },

        send: {
            funcName: "flock.midi.connection.send",
            args: ["{that}", "{arguments}.0"]
        },

        open: {
            funcName: "flock.midi.connection.bind",
            args: [
                "{that}.system.model.ports",
                "{that}.options.ports",
                "{that}.events.onReady.fire",
                "{that}.events.raw.fire",
                "{that}.events.onSendRaw"
            ]
        },

        close: {
            funcName: "flock.midi.connection.close",
            args: [
                "{that}.system.model.ports",
                "{that}.events.raw.fire"
            ]
        }
    },

    components: {
        system: {
            type: "flock.midi.system",
            options: {
                events: {
                    onReady: "{connection}.events.onPortsAvailable"
                }
            }
        }
    },

    events: {
        onPortsAvailable: null,
        onReady: null,
        onError: null,
        onSendRaw: null
    },

    listeners: {
        "onPortsAvailable.open": {
            funcName: "flock.midi.connection.autoOpen",
            args: [
                "{that}.options.openImmediately", "{that}.open"
            ]
        },

        "onError.logError": {
            funcName: "fluid.log",
            args: [fluid.logLevel.WARN, "{arguments}.0"]
        },

        "raw.fireMidiEvent": {
            funcName: "flock.midi.connection.fireEvent",
            args: ["{arguments}.0", "{that}.events"]
        },

        "onDestroy.close": "{that}.close()"
    }
});

/**
 *
 * Sends a MIDI message.
 *
 * @param {Object} that - the flock.midi.connection component itself
 * @param {Object} midiMessage - a MIDI messageSpec
 */
flock.midi.connection.send = function (that, midiMessage) {
    var midiBytes = flock.midi.write(midiMessage);
    that.events.onSendRaw.fire(midiBytes);
};

flock.midi.connection.autoOpen = function (openImmediately, openFn) {
    if (openImmediately) {
        openFn();
    }
};

flock.midi.connection.openPort = function (port, openPromises) {
    // Remove this conditional when Chrome 43 has been released.
    if (port.open) {
        var p = port.open();
        openPromises.push(p);
    }

    return openPromises;
};

flock.midi.connection.listen = function (port, onRaw, openPromises) {
    flock.midi.findPorts.eachPortOfType(port, "input", function (port) {
        flock.midi.connection.openPort(port, openPromises);
        port.addEventListener("midimessage", onRaw, false);
    });

    return openPromises;
};

flock.midi.connection.stopListening = function (port, onRaw) {
    flock.midi.findPorts.eachPortOfType(port, "input", function (port) {
        port.close();
        port.removeEventListener("midimessage", onRaw, false);
    });
};

flock.midi.connection.bindSender = function (port, onSendRaw, openPromises) {
    var ports = fluid.makeArray(port);

    fluid.each(ports, function (port) {
        flock.midi.connection.openPort(port, openPromises);
        onSendRaw.addListener(port.send.bind(port));
    });

    return openPromises;
};

flock.midi.connection.fireReady = function (openPromises, onReady) {
    if (!openPromises || openPromises.length < 1) {
        return;
    }

    Promise.all(openPromises).then(onReady);
};

flock.midi.connection.bind = function (ports, portSpec, onReady, onRaw, onSendRaw) {
    portSpec = flock.midi.connection.expandPortSpec(portSpec);

    var input = flock.midi.findPorts(ports.inputs, portSpec.input),
        output = flock.midi.findPorts(ports.outputs, portSpec.output),
        openPromises = [];

    if (input && input.length > 0) {
        flock.midi.connection.listen(input, onRaw, openPromises);
    } else if (portSpec.input !== undefined) {
        flock.midi.connection.logNoMatchedPorts("input", portSpec);
    }

    if (output && output.length > 0) {
        flock.midi.connection.bindSender(output, onSendRaw, openPromises);
    } else if (portSpec.output !== undefined) {
        flock.midi.connection.logNoMatchedPorts("output", portSpec);
    }

    flock.midi.connection.fireReady(openPromises, onReady);
};

flock.midi.connection.close = function (ports, onRaw) {
    flock.midi.connection.stopListening(ports.inputs, onRaw);
    // TODO: Come up with some scheme for unbinding port senders
    // since they use Function.bind().
};

flock.midi.connection.logNoMatchedPorts = function (type, portSpec) {
    fluid.log(fluid.logLevel.WARN,
        "No matching " + type + " ports were found for port specification: ", portSpec[type]);
};

flock.midi.connection.expandPortSpec = function (portSpec) {
    if (portSpec.input !== undefined || portSpec.output !== undefined) {
        return portSpec;
    }

    var expanded = {
        input: {},
        output: {}
    };

    if (typeof portSpec === "number") {
        expanded.input = expanded.output = portSpec;
    } else {
        flock.midi.connection.expandPortSpecProperty("manufacturer", portSpec, expanded);
        flock.midi.connection.expandPortSpecProperty("name", portSpec, expanded);
    }

    return expanded;
};

flock.midi.connection.expandPortSpecProperty = function (propName, portSpec, expanded) {
    expanded.input[propName] = expanded.output[propName] = portSpec[propName];
    return expanded;
};

flock.midi.connection.fireEvent = function (midiEvent, events) {
    var model = flock.midi.read(midiEvent.data),
        eventForType = model.type ? events[model.type] : undefined;

    events.message.fire(model, midiEvent);

    // TODO: Remove this special-casing of noteOn/noteOff events into note events.
    if (model.type === "noteOn" || model.type === "noteOff") {
        events.note.fire(model, midiEvent);
    }

    if (eventForType) {
        eventForType.fire(model, midiEvent);
    }
};
