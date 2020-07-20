/*
 * Flocking UI MIDI Port Selector
 * Copyright 2015-2020, Colin Clark
 * https://github.com/continuing-creativity/flocking-midi
 *
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */

"use strict";

var flock = fluid.registerNamespace("flock");

// TODO: add support for rendering errors
// TODO: add user-friendly rendering in the case when no midi ports are available
// TODO: move selectBox container rendering into the selectBox component
fluid.defaults("flock.midi.portSelectorView", {
    gradeNames: "fluid.viewComponent",

    portType: "input",

    preferredPort: undefined,

    implicitPorts: [
        {
            id: "flock-no-port-selected",
            name: "None"
        }
    ],

    model: {
        ports: []
    },

    components: {
        selectBox: {
            createOnEvent: "onReady",
            type: "flock.midi.portSelectBox",
            container: "{that}.dom.selectBox",
            options: {
                preferredPort: "{midiPortSelector}.options.preferredPort",

                model: {
                    options: "{midiPortSelector}.model.ports"
                },

                events: {
                    onSelect: "{midiPortSelector}.events.onPortSelected"
                }
            }
        },

        midiSystem: {
            type: "flock.midi.system",
            options: {
                events: {
                    onPortsAvailable: "{midiPortSelector}.events.onPortsAvailable"
                }
            }
        }
    },

    invokers: {
        refreshView: "{that}.events.onRender.fire()"
    },

    events: {
        onPortsAvailable: null,
        onRender: null,
        afterRender: null,
        onReady: {
            events: {
                onPortsAvailable: "{that}.events.onPortsAvailable",
                afterRender: "{that}.events.afterRender"
            }
        },
        onRefresh: null,
        onPortSelected: null
    },

    listeners: {
        "onCreate.refreshView": "{that}.refreshView()",

        // TODO: Move the selectBox portions of this to the selectBox component.
        "onRender.renderLabel": {
            funcName: "flock.midi.portSelectorView.render",
            args: [
                "{that}.container",
                "{that}.options.markup.label",
                "{that}.options.selectBoxStrings"
            ]
        },

        "onRender.renderSelectBox": {
            priority: "after:renderLabel",
            funcName: "flock.midi.portSelectorView.render",
            args: [
                "{that}.container",
                "{that}.options.markup.selectBox",
                "{that}.options.selectBoxStrings"
            ]
        },

        "onRender.renderRefreshButton": {
            priority: "after:renderSelectBox",
            funcName: "flock.midi.portSelectorView.renderRefreshButton",
            args: [
                "{that}.container",
                "{that}.options.markup.refreshButton",
                "{that}.options.strings",
                "{that}.events.onRefresh.fire"
            ]
        },

        "onRender.fireAfterRender": {
            priority: "last",
            func: "{that}.events.afterRender.fire"
        },

        "onRefresh.refreshSystemPorts": "{midiSystem}.refreshPorts()",

        "onPortsAvailable.updatePortsModel": {
            funcName: "flock.midi.portSelectorView.updatePortsModel",
            args: ["{that}", "{arguments}.0"]
        }

    },

    markup: {
        label: "<label for='%selectBoxID'>%selectBoxLabel</label>",
        selectBox: "<select class='flock-midi-selector-selectBox' id='%selectBoxID'></select>",
        refreshButton: "<button name='refresh'>%refreshButtonLabel</button>"
    },

    // TODO: Move this to the selectBox component.
    selectBoxStrings: {
        selectBoxID: "@expand:fluid.allocateGuid()",
        selectBoxLabel: "{that}.options.strings.selectBoxLabel"
    },

    strings: {
        selectBoxLabel: "MIDI Port:",
        refreshButtonLabel: "Refresh"
    },

    selectors: {
        selectBox: ".flock-midi-selector-selectBox"
    }
});


flock.midi.portSelectorView.updatePortsModel = function (that, ports) {
    var portType = that.options.portType + "s";
    var portsForType = fluid.copy(that.options.implicitPorts).concat(ports[portType]);

    var transaction = that.applier.initiate();
    transaction.fireChangeRequest({ path: "ports", type: "DELETE" });
    transaction.fireChangeRequest({ path: "ports", value: portsForType });
    transaction.commit();
};

// TODO: Move to the selectBox component.
flock.midi.portSelectorView.render = function (container, markup, strings) {
    var rendered = fluid.stringTemplate(markup, strings),
        el = jQuery(rendered);

    container.append(el);

    return el;
};

flock.midi.portSelectorView.renderRefreshButton = function (container, markup, strings, onRefresh) {
    var button = flock.midi.portSelectorView.render(container, markup, strings);
    button.click(function () {
        onRefresh();
        return false;
    });
};
