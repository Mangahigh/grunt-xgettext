/*
 * grunt-xgettext
 * https://github.com/arendjr/grunt-xgettext
 *
 * Copyright (c) 2013-2014 Arend van Beelen, Speakap BV
 * Licensed under the MIT license.
 */

"use strict";

const esprima = require('esprima');
const grunt = require('grunt');
const _ = require('lodash');

module.exports = (file, options) => {

    const collector = new (require('../lib/collector'))();
    const fn = _.flatten([ options.functionName ]);
    const contents = grunt.file.read(file);
    const lines = _.map(contents.split('\n'), line => line.trim());

    const flattenIdentifier = identifier => {
        if (identifier.type === 'Identifier') {
            return identifier.name;
        } else if (identifier.type === 'MemberExpression' && identifier.computed === false &&
                   identifier.object.type === 'Identifier') {
            return identifier.object.name + '.' + identifier.property.name;
        } else if (identifier.type === 'MemberExpression' && identifier.computed === false &&
                   identifier.object.type === 'MemberExpression') {
            return flattenIdentifier(identifier.object) + '.' + identifier.property.name;
        } else {
            grunt.log.debug(`Found unhandled identifier: ${JSON.stringify(identifier)}`);
            return '';
        }
    };

    const flattenString = string => {
        if (string.type === 'Literal' && _.isString(string.value)) {
            return string.value;
        } else if (string.type === 'BinaryExpression' && string.operator === '+') {
            return flattenString(string.left) + flattenString(string.right);
        } else {
            grunt.log.debug(`Found unhandled string: ${JSON.stringify(string)}`);
            return '';
        }
    };

    const parseOptions = syntax => {
        const options = {};
        if (syntax.type === 'ObjectExpression') {
            _.each(syntax.properties, propertySyntax => {
                const key = (propertySyntax.key.type === 'Literal' ? propertySyntax.key.value
                    : propertySyntax.key.name),
                    value = flattenString(propertySyntax.value);
                if (key && value) {
                    options[key] = value;
                }
            });
        }
        return options;
    };

    const parseInvocation = syntax => {
        if (syntax.arguments.length > 0) {
            const singular = flattenString(syntax.arguments[0]);
            let plural;
            let options = {};

            if (syntax.arguments.length > 1) {
                const second = syntax.arguments[1];
                if (second.type === 'ObjectExpression') {
                    options = parseOptions(second);
                } else {
                    plural = flattenString(second);
                    if (syntax.arguments.length > 2) {
                        options = parseOptions(syntax.arguments[2]);
                    }
                }
            }

            const message = {
                comment: options.comment || '',
                context: options.context || '',
                message: '',
                plural: plural || '',
                singular: singular,
                location: file + ':' + syntax.loc.start.line
            };

            let lineIndex = syntax.loc.start.line - 2; // loc.start.line is 1-based

            while (lineIndex > 0 && lines[lineIndex].slice(0, 3) === '///') {
                message.comment = lines[lineIndex].slice(3).trim() +
                                  (message.comment ? '\n' : '') +
                                  message.comment;
                lineIndex--;
            }

            collector.addMessage(message);
        } else {
            grunt.log.debug('No arguments to translation method');
        }
    };

    const scan = syntax => {
        grunt.log.debug('Scanning node: ' + syntax.type);

        switch (syntax.type) {
        case 'ArrayExpression':
            _.each(syntax.elements, elementSyntax => {
                scan(elementSyntax);
            });
            break;
        case 'AssignmentExpression':
            scan(syntax.right);
            break;
        case 'BinaryExpression':
            scan(syntax.left);
            scan(syntax.right);
            break;
        case 'CallExpression':
            const callee = syntax.callee;
            if (_.includes(fn, flattenIdentifier(callee))) {
                parseInvocation(syntax);
            } else {
                scan(callee);
                _.each(syntax.arguments, argumentSyntax => {
                    scan(argumentSyntax);
                });
            }
            break;
        case 'ConditionalExpression':
            scan(syntax.alternate);
            scan(syntax.consequent);
            break;
        case 'ExpressionStatement':
            scan(syntax.expression);
            break;
        case 'IfStatement':
            scan(syntax.consequent);
            if (syntax.alternate) {
                scan(syntax.alternate);
            }
            break;
        case 'LogicalExpression':
            scan(syntax.left);
            scan(syntax.right);
            break;
        case 'MemberExpression':
            scan(syntax.object);
            scan(syntax.property);
            break;
        case 'NewExpression':
            _.each(syntax.arguments, argumentSyntax => {
                scan(argumentSyntax);
            });
            break;
        case 'ObjectExpression':
            _.each(syntax.properties, propertySyntax => {
                scan(propertySyntax);
            });
            break;
        case 'Property':
            scan(syntax.value);
            break;
        case 'TryStatement':
            scan(syntax.block);
            if (syntax.handler) {
                scan(syntax.handler);
            }
            _.each(syntax.guardedHandlers, guardedHandlerSyntax => {
                scan(guardedHandlerSyntax);
            });
            if (syntax.finalizer) {
                scan(syntax.finalizer);
            }
            break;
        case 'SequenceExpression':
            _.each(syntax.expressions, expressionSyntax => {
                scan(expressionSyntax);
            });
            break;
        case 'SwitchCase':
            if (syntax.test) {
                scan(syntax.test);
            }
            _.each(syntax.consequent, consequentSyntax => {
                scan(consequentSyntax);
            });
            break;
        case 'SwitchStatement':
            _.each(syntax.cases, caseSyntax => {
                scan(caseSyntax);
            });
            break;
        case 'VariableDeclaration':
            _.each(syntax.declarations, declarationSyntax => {
                scan(declarationSyntax);
            });
            break;
        case 'VariableDeclarator':
            if (syntax.init) {
                scan(syntax.init);
            }
            break;
        default:
            if (syntax.argument) {
                scan(syntax.argument);
            }
            if (syntax.body) {
                if (_.isArray(syntax.body)) {
                    _.each(syntax.body, bodySyntax => {
                        scan(bodySyntax);
                    });
                } else {
                    scan(syntax.body);
                }
            }
        }
    };

    scan(esprima.parse(contents, { loc: true }));

    return collector.messages;
};
