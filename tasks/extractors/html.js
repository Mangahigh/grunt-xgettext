/*
 * grunt-xgettext
 * https://github.com/arendjr/grunt-xgettext
 *
 * Copyright (c) 2013-2014 Arend van Beelen, Speakap BV
 * Licensed under the MIT license.
 */

"use strict";

var grunt = require("grunt");
var _ = require("lodash");

/**
 * Get all messages of a content
 * @param  {String} content     content on which extract gettext calls
 * @param  {Regex} regex        first level regex
 * @param  {Regex} subRE        second level regex
 * @param  {Regex} quoteRegex   regex for quotes
 * @param  {String} quote       quote: " or '
 * @param  {Object} options     task options
 * @return {Object}             messages in a JS pot alike
 *                                       {
 *                                           singularKey: {
 *                                               singular: singularKey,
 *                                               plural: pluralKey,     // present only if plural
 *                                               message: ""
 *
 *                                           },
 *                                           ...
 *                                       }
 */
function getMessages(content, regex, subRE, quoteRegex, quote, options) {
    var messages = {}, result;

    while ((result = regex.exec(content)) !== null) {
        var strings = result[1],
            singularKey = void 0;

        while ((result = subRE.exec(strings)) !== null) {
            var string = options.processMessage(result[1].replace(quoteRegex, quote));

            // if singular form already defined add message as plural
            if (typeof singularKey !== 'undefined') {
                messages[singularKey].plural = string;
            // if not defined init message object
            } else {
                singularKey = string;
                messages[singularKey] = {
                    singular: string,
                    message: ""
                };
            }
        }
    }

    return messages;
}

module.exports = function(file, options) {
    var contents = grunt.file.read(file).replace("\n", " "),
        fn = _.flatten([ options.functionName ]),
        messages = {};

    var extractStrings = function(quote, fn) {
        var regex = new RegExp("" + fn + "\\(((?:" +
            quote + "(?:[^" + quote + "\\\\]|\\\\.)+" + quote +
            "\\s*)+)\\)", "g");
        var subRE = new RegExp(quote + "((?:[^" + quote + "\\\\]|\\\\.)+)" + quote, "g");
        var quoteRegex = new RegExp("\\\\" + quote, "g");

        _.extend(messages, getMessages(contents, regex, subRE, quoteRegex, quote, options));
    };

    _.each(fn, function(func) {
        extractStrings("'", func);
        extractStrings('"', func);
    });

    return messages;
};
