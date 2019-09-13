function test() {
    // example strings which should be properly extracted:
    tr("Boom");
    tr("Roos");
    tr("Vis", "Vuur");
}

function test2() {
    tr("Hij zei, \"hallo!\"");
    tr("Zó leren lezen");
    tr("Goede 's morgens!");
    tr('Goede \'s avonds!');
    tr("Regel één\n" +
       'Regel twee');
    tr("Regel één\n" +
       'Regel twee\n' +
       "Regel drie");
}

function test3() {
    $(".some-element").attr("Attribute should not be extracted");
}

function test4() {
    i18n.tr("i18n.tr() should be extracted too");
    unknown.tr("unknown.tr() should not be extracted");
}

function test5() {
    tr("September", { comment: "Translators: use all lower-case if months are not " +
                               "capitalized in your language" })

    tr("May")
    tr("May", { context: "Abbreviation", comment: "Abbreviation of May" })
    tr("September")
    tr("Sept.", { context: "Abbreviation", comment: "Abbreviation of September" })
}

function test6() {
    /// abbreviation: %1 day(s) ago
    tr("%1 d", "%1 d", days);

    /// Translators: use all lower-case if months are not capitalized in your language
    /// Abbreviation of May
    tr("May", { context: "Abbreviation" });
}

// snippet of real-life code
define("l10n", ["i18n", "jquery", "lodash"], function(i18n, $, _) {

    "use strict";

    var l10n = {

        timestamp: function(date, options) {

            function getText(options) {
                if (options.mini) {
                    return getMiniText();
                }

                var showDate = (options.showDate !== false);
                var showTime = (options.showTime !== false);
                var showTimeIfNotToday = (options.showTimeIfNotToday !== false);

                if (isToday) {
                    if (!showTimeIfNotToday) {
                        return getTimeText();
                    } else if (showTime) {
                        if (diff > HOUR) {
                            return i18n("%1 hour ago", "%1 hours ago").arg(Math.floor(diff / HOUR));
                        } else if (diff > MINUTE) {
                            var numMinutes = Math.round(diff / MINUTE);
                            return i18n("%1 minute ago", "%1 minutes ago").arg(numMinutes);
                        } else {
                            return i18n("Just now");
                        }
                    } else {
                        return i18n("Today");
                    }
                }

                if (date.getDay() === (now.getDay() + 6) % 7) {
                    return showTime ? i18n("Yesterday at %1").arg(getTimeText())
                                    : i18n("Yesterday");
                } else {
                    var weekDay = DAYS[date.getDay()];
                    return showTime ? i18n("%1 at %2").arg(weekDay, getTimeText()) : weekDay;
                }
            }

            return getText(options);
        }
    };

    return l10n;

});

// another snippet
var ArchivedRequestsView = AdminRequestsView.extend({

    initialize: function(options) {

        options = options || {};

        options.filters = [
            { name: i18n("All requests"), url: "requests/archive/" },
            { name: i18n("My requests"), url: "requests/myarchive/" }
        ];

        options.title = i18n("Archive");

        AdminRequestsView.prototype.initialize.call(this, options);
    }

});
