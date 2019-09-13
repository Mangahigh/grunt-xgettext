/*
 * grunt-xgettext
 * https://github.com/arendjr/grunt-xgettext
 *
 * Copyright (c) 2013-2014 Arend van Beelen, Speakap BV
 * Licensed under the MIT license.
 */

"use strict";

const grunt = require('grunt');
const _ = require('lodash');

/**
 * Get all messages of a content
 * @param  {String} contents    content on which extract gettext calls
 * @param  {Regex} regex        first level regex
 * @param  {Regex} subRE        second level regex
 * @param  {Regex} quoteRegex   regex for quotes
 * @param  {String} quote       quote: " or '
 * @param  {Object} options     task options
 * @param  {String} file        the file name
 * @return {Object}             messages in a JS pot alike
 *                                       {
 *                                           singularKey: {
 *                                               singular: singularKey,
 *                                               plural: pluralKey,     // present only if plural
 *                                               message: ''
 *
 *                                           },
 *                                          ...
 *                                       }
 */
const getMessages = (contents, regex, subRE, quoteRegex, quote, options, file) => {
    const messages = {};
    let result;

    let ln = 1;
    contents.split('\n').forEach(content => {
        ++ln;
        while ((result = regex.exec(content)) !== null) {
            let strings = result[1],
                singularKey = void 0;

            while ((result = subRE.exec(strings)) !== null) {
                const string = options.processMessage(result[1].replace(quoteRegex, quote));

                // if singular form already defined add message as plural
                if (typeof singularKey !== 'undefined') {
                    messages[singularKey].plural = string;
                    // if not defined init message object
                } else {
                    singularKey = string;
                    messages[singularKey] = {
                        location: file + ':' + ln,
                        singular: string,
                        message: ''
                    };
                }
            }
        }
    });

    return messages;
};

module.exports = (file, options) => {
    const contents = grunt.file.read(file).replace('\n', ' '),
        fn = _.flatten([ options.functionName ]),
        messages = {};

    const extractStrings = (quote, fn) => {
        const regex = new RegExp("" + fn + "\\(((?:" +
            quote + "(?:[^" + quote + "\\\\]|\\\\.)+" + quote +
            "\\s*)+)\\)", "g");
        const subRE = new RegExp(quote + "((?:[^" + quote + "\\\\]|\\\\.)+)" + quote, "g");
        const quoteRegex = new RegExp("\\\\" + quote, "g");

        _.extend(messages, getMessages(contents, regex, subRE, quoteRegex, quote, options, file));
    };

    _.each(fn, func => {
        extractStrings('\'', func);
        extractStrings('"', func);
    });

    return messages;
};
