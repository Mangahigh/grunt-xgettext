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

function tokenize(substring) {

    grunt.log.debug("Tokenizing: " + substring);

    var tokens = [], token = null;
    for (var i = 0; i < substring.length; i++) {
        var char = substring.charAt(i);
        if (token) {
            switch (token.type) {
            case "identifier":
                if (char === "=") {
                    token.type = "hash";
                    token.key = token.value;
                    token.value = null;
                } else if (/\s/.test(char)) {
                    tokens.push(token);
                    token = null;
                } else {
                    token.value += char;
                }
                break;
            case "hash":
                if (token.value) {
                    if (token.value.type === "string") {
                        if (char === token.value.quote) {
                            tokens.push(token);
                            token = null;
                        } else {
                            if (char === "\\") {
                                i++;
                                char = substring.charAt(i);
                            }
                            token.value.value += char;
                        }
                    } else if (/\s/.test(char)) {
                        tokens.push(token);
                        token = null;
                    } else {
                        token.value.value += char;
                    }
                } else {
                    if (char === "'" || char === '"') {
                        token.value = { type: "string", value: "", quote: char };
                    } else if (/\d/.test(char)) {
                        token.value = { type: "number", value: "" };
                    } else if (/\s/.test(char)) {
                        // continue
                    } else {
                        token.value = { type: "identifier", value: "" };
                    }
                }
                break;
            case "number":
                if (/\s/.test(char)) {
                    tokens.push(token);
                    token = null;
                } else {
                    token.value.value += char;
                }
                break;
            case "string":
                if (char === token.quote) {
                    tokens.push(token);
                    token = null;
                } else {
                    if (char === "\\") {
                        i++;
                        char = substring.charAt(i);
                    }
                    token.value += char;
                }
                break;
            }
        } else {
            if (char === "'" || char === '"') {
                token = { type: "string", value: "", quote: char };
            } else if (/\d/.test(char)) {
                token = { type: "number", value: char };
            } else if (/\s/.test(char)) {
                // continue
            } else {
                token = { type: "identifier", value: char };
            }
        }
    }
    if (token) {
        tokens.push(token);
    }

    grunt.log.debug("Result: " + JSON.stringify(tokens));

    return tokens;
}

module.exports = function(file, options) {

    var collector = new (require("../lib/collector"));

    var contents = grunt.file.read(file).replace("\n", " "),
        fn = _.flatten([ options.functionName ]);

    _.each(fn, function(func) {
        var regex = new RegExp("\\{\\{\\s*" + func + "\\s+(.*?)\\}\\}", "g");
        var result;
        while ((result = regex.exec(contents)) !== null) {
            var tokens = tokenize(result[1]);
            if (tokens.length === 0 || tokens[0].type !== "string") {
                continue;
            }

            var message = {
                singular: tokens[0].value,
                message: ""
            };
            if (tokens.length > 2 && tokens[1].type === "string") {
                message.plural = tokens[1].value;
            }
            _.each(tokens, function(token) {
                if (token.type === "hash") {
                    if (token.key === "comment" || token.key === "context" &&
                        token.value.type === "string") {

                        message[token.key] = token.value.value;
                    }
                }
            });

            collector.addMessage(message);
        }
    });

    return collector.messages;
};
