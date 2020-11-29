/*
 * Flocking UI MIDI Port Connector
 * Copyright 2015-2020, Colin Clark
 * https://github.com/continuing-creativity/flocking-midi
 *
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */

"use strict";

var flock = fluid.registerNamespace("flock");

fluid.defaults("flock.midi.connectorView", {
    gradeNames: ["flock.midi.receiver", "fluid.viewComponent"],

    portType: "input",

    preferredPort: undefined,

    components: {
        midiPortSelector: {
            type: "flock.midi.portSelectorView",
            container: "{that}.container",
            options: {
                portType: "{connectorView}.options.portType",
                preferredPort: "{connectorView}.options.preferredPort",
                events: {
                    onPortSelected: "{connectorView}.events.onPortSelected"
                }
            }
        },

        connection: {
            createOnEvent: "onValidPortSelected",
            type: "flock.midi.connection",
            options: {
                openImmediately: true,
                ports: {
                    expander: {
                        funcName: "flock.midi.connectorView.generatePortSpecification",
                        args: [
                            "{connectorView}.options.portType",
                            "{midiPortSelector}.selectBox.model.selection"
                        ]
                    }
                },

                // TODO: These are ultimately midi.connection events.
                // Is there a better way to distribute listeners from this
                // parent "facade" object to its connection subcomponent?
                events: {
                    raw: "{connectorView}.events.raw",
                    message: "{connectorView}.events.message",
                    note: "{connectorView}.events.note",
                    noteOn: "{connectorView}.events.noteOn",
                    noteOff: "{connectorView}.events.noteOff",
                    control: "{connectorView}.events.control",
                    program: "{connectorView}.events.program",
                    aftertouch: "{connectorView}.events.aftertouch",
                    pitchbend: "{connectorView}.events.pitchbend"
                },

                listeners: {
                    "onCreate.fireAfterConnectionOpen": {
                        func: "{connectorView}.events.afterConnectionOpen.fire"
                    }
                }
            }
        }
    },

    events: {
        onPortSelected: null,
        onValidPortSelected: null,
        afterConnectionOpen: null
    },

    listeners: {
        "onPortSelected.validatePortSelection": {
            funcName: "flock.midi.connectorView.validatePortSelection",
            args: ["{that}"]
        }
    }
});

flock.midi.connectorView.generatePortSpecification = function (portType, portIDs) {
    var spec = {};
    spec[portType] = {
        id: portIDs
    };

    return spec;
};

flock.midi.connectorView.validatePortSelection = function (that) {
    var selectedId = fluid.get(that, "midiPortSelector.selectBox.model.selection");
    if (selectedId) {
        that.events.onValidPortSelected.fire();
    }
};
