/*
 * Flocking MIDI Receiver
 * https://github.com/continuing-creativity/flocking-midi
 *
 * Copyright 2014-2020, Colin Clark
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */

"use strict";

/**
 * An abstract grade that the defines the event names
 * for receiving MIDI messages
 */
fluid.defaults("flock.midi.receiver", {
    gradeNames: ["fluid.component"],

    events: {
        raw: null,
        message: null,
        note: null,
        noteOn: null,
        noteOff: null,
        control: null,
        program: null,
        aftertouch: null,
        pitchbend: null,
        sysex: null,
        songPointer: null,
        songSelect: null,
        tuneRequest: null,
        clock: null,
        start: null,
        continue: null,
        stop: null,
        activeSense: null,
        reset: null
    }
});
