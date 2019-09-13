/*
 * grunt-xgettext
 * https://github.com/arendjr/grunt-xgettext
 *
 * Copyright (c) 2014 Arend van Beelen, Speakap BV
 * Licensed under the MIT license.
 */

"use strict";

var grunt = require("grunt");
var _ = require("lodash");

/**
 * Convenience object for collecting the extracted messages before passing them back to the main
 * xgettext task.
 */
function Collector() {

    this.messages = {};
}

/**
 * Adds a new message to the pool of collected messages.
 *
 * @param message Message object, with the following properties:
 *                comment - Translator comments (optional).
 *                context - Message context (optional).
 *                plural - Plural form of the message (optional).
 *                singular - The singular text key.
 */
Collector.prototype.addMessage = function(message) {

    var messages = this.messages;

    var key = (message.context ? message.context + ":" : "") + message.singular;
    var existingMessage = messages[key];
    if (existingMessage) {
        if (existingMessage.comment) {
            if (message.comment) {
                existingMessage.comment = _.unique(existingMessage.comment.split("\n")
                                                   .concat(message.comment.split("\n"))).join("\n");
            }
        } else {
            existingMessage.comment = message.comment;
        }

        if (existingMessage.location) {
            if (message.location) {
                existingMessage.location = [existingMessage.location, message.location].join("\n");
            }
        } else {
            existingMessage.location = message.location;
        }

        if (message.plural) {
            if (existingMessage.plural) {
                if (existingMessage.plural !== message.plural) {
                    grunt.log.error(
                        "'" + existingMessage.plural + "' and '" + message.plural + "' " +
                        "are different plurals for the same singular key ('" +
                        message.singular + "'). Use contexts to differentiate them."
                    );
                }
            } else {
                existingMessage.plural = message.plural;
            }
        }
    } else {
        messages[key] = message;
    }
};

module.exports = Collector;
