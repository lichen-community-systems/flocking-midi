/*
 * Flocking UI MIDI Message View
 * Copyright 2015-2020, Colin Clark
 * https://github.com/continuing-creativity/flocking-midi
 *
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */

 /*global ArrayBuffer, DataView, CodeMirror*/

"use strict";

var flock = fluid.registerNamespace("flock");

/**
 * Logs incoming MIDI messages from all <code>flock.midi.connection</code>s, globally.
 */
fluid.defaults("flock.midi.messageMonitorView", {
    gradeNames: "fluid.codeMirror",

    codeMirrorOptions: {
        lineWrapping: true,
        readOnly: true
    },

    theme: "flockingcm",
    lineNumbers: true,
    lineWrapping: true,
    readOnly: true,

    distributeOptions: {
        // TODO: This is probably, umm, a bit heavy-handed.
        target: "{/ flock.midi.connection}.options",
        record: {
            listeners: {
                "message.logMIDI": {
                    func: "flock.midi.messageMonitorView.logMIDI",
                    args: [
                        "{midiMessageView}",
                        "{midiMessageView}.options.strings.midiLogMessage",
                        "{arguments}.0",
                        "{arguments}.1"
                    ]
                }
            }
        }
    },

    strings: {
        midiLogMessage: "%hours:%minutes:%seconds.%millis - %manufacturer %name: %msg"
    }
});

flock.midi.messageMonitorView.typedArrayReplacer = function (key, value) {
    if (!ArrayBuffer.isView(value) || value instanceof DataView) {
        return value;
    }

    var arr = new Array(value.length);
    for (var i = 0; i < value.length; i++) {
        arr[i] = value[i];
    }

    return arr;
};

/**
 * Pads a number to four digits with zeros.
 *
 * @param {Number} num the number to pad
 * @return {String} the padded number, as a string
 */
flock.midi.messageMonitorView.zeroPad = function (num) {
    if (num >= 10000) {
        return num;
    }

    return ("0000" + num).slice(-4);
};

flock.midi.messageMonitorView.renderMIDILog = function (msgTemplate, msg, port) {
    var nowDate = new Date();

    return fluid.stringTemplate(msgTemplate, {
        hours: nowDate.getHours(),
        minutes: nowDate.getMinutes(),
        seconds: nowDate.getSeconds(),
        millis: flock.midi.messageMonitorView.zeroPad(nowDate.getMilliseconds()),
        manufacturer: port.manufacturer,
        name: port.name,
        msg: JSON.stringify(msg, flock.midi.messageMonitorView.typedArrayReplacer)
    });
};

flock.midi.messageMonitorView.logMIDI = function (that, msgTemplate, msg, rawEvent) {
    var port = rawEvent.target,
        messageText = flock.midi.messageMonitorView.renderMIDILog(msgTemplate, msg, port),
        lastLinePos = CodeMirror.Pos(that.editor.lastLine());

    that.editor.replaceRange(messageText + "\n", lastLinePos);
};
