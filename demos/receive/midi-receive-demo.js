/*
 * Flocking MIDI Receive Demo
 * https://github.com/continuing-creativity/flocking-midi
 *
 * Copyright 2017-2020, Colin
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */

"use strict";

flock.init();

fluid.defaults("flock.midiDemo", {
    gradeNames: "fluid.viewComponent",

    components: {
        enviro: "{flock.enviro}",

        midiMessageView: {
            type: "flock.midi.messageMonitorView",
            container: "{that}.dom.messageRegion"
        },

        midiConnector: {
            type: "flock.midi.connectorView",
            container: "{that}.dom.midiPortSelector",
            options: {
                components: {
                    connection: {
                        options: {
                            sysex: true
                        }
                    }
                },

                listeners: {
                    "noteOn.forwardToSynth": {
                        func: "{synth}.noteOn",
                        args: [
                            "{arguments}.0.note",
                            {
                                "freq.note": "{arguments}.0.note",
                                "amp.velocity": "{arguments}.0.velocity"
                            }
                        ]
                    },

                    "noteOff.forwardToSynth": {
                        func: "{synth}.noteOff",
                        args: ["{arguments}.0.note"]
                    }
                }
            }
        },

        synth: {
            type: "flock.midiDemo.synth"
        }
    },

    listeners: {
        "onCreate.startEnviro": "{that}.enviro.start()"
    },

    selectors: {
        midiPortSelector: "#midi-port-selector",
        messageRegion: "#midiMessageRegion"
    }
});


fluid.defaults("flock.midiDemo.synth", {
    gradeNames: ["flock.synth.polyphonic"],

    synthDef: {
        ugen: "flock.ugen.square",
        freq: {
            id: "freq",
            ugen: "flock.ugen.midiFreq",
            note: 60
        },
        mul: {
            id: "env",
            ugen: "flock.ugen.envGen",
            envelope: {
                type: "flock.envelope.adsr",
                attack: 0.2,
                decay: 0.1,
                sustain: 1.0,
                release: 1.0
            },
            gate: 0.0,
            mul: {
                id: "amp",
                ugen: "flock.ugen.midiAmp",
                velocity: 0
            }
        }
    }
});
