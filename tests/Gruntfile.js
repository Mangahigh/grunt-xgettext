/*
 * grunt-xgettext
 * https://github.com/arendjr/grunt-xgettext
 *
 * Copyright (c) 2013-2014 Arend van Beelen, Speakap BV
 * Licensed under the MIT license.
 */

"use strict";

var chalk = require("chalk");
var _ = require("lodash");

module.exports = function(grunt) {

    grunt.initConfig({
        xgettext: {
            default_options: {
                options: {
                    functionName: ["tr", "i18n.tr", "i18n"],
                    potFile: "messages.pot"
                },

                files: {
                    handlebars: ["assets/*.handlebars"],
                    html: ["assets/*.html"],
                    javascript: ["assets/*.js"]
                }
            }
        }
    });

    grunt.loadTasks("../tasks");

    grunt.registerTask("compare", "Compare extracted messages with expected messages", function() {

        function readPoLines(filename) {
            var content = grunt.file.read(filename);
            return content.split("\n");
        }

        var expectedLines = readPoLines("messages.expected.pot");
        var extractedLines = readPoLines("messages.pot");

        var debugExtractedLines = [];
        var debugExpectedLines = [];

        var hasError = false;
        for (var i = 0; i < expectedLines.length || i < extractedLines.length; i++) {
            var expectedLine = expectedLines[i] || "";
            var extractedLine = extractedLines[i] || "";

            if (expectedLine.slice(0, 1) === "#" && expectedLine.slice(1, 2) !== "." &&
                extractedLine.slice(0, 1) === "#" && extractedLine.slice(1, 2) !== ".") {
                continue;
            }

            if (expectedLines[i] === extractedLines[i]) {
                debugExpectedLines.push("  " + chalk.cyan(expectedLine));
                debugExtractedLines.push("  " + chalk.cyan(extractedLine));
            } else {
                debugExpectedLines.push(chalk.red("> ") + chalk.cyan(expectedLine));
                debugExtractedLines.push(chalk.red("> ") + chalk.cyan(extractedLine));

                hasError = true;
            }
        }

        if (hasError) {
            grunt.log.error("Extracted messages did not match expected messages.");
            grunt.log.debug("Extracted:\n" + debugExtractedLines.join("\n"));
            grunt.log.debug("Expected:\n" + debugExpectedLines.join("\n"));
            return false;
        } else {
            grunt.log.ok("Extracted messages match expected messages.");
        }
    });

    grunt.registerTask("default", ["xgettext", "compare"]);

};
