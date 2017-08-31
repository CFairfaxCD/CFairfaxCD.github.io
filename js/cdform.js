(function ($) {

        $.widget('ui.stars', {
            options: {
                inputType: 'radio', // [radio|select]
                split: 0, // decrease number of stars by splitting each star into pieces [2|3|4|...]
                disabled: false, // set to [true] to make the stars initially disabled
                cancelTitle: 'Cancel Rating',
                cancelValue: 0, // default value of Cancel btn.
                cancelShow: true,
                disableValue: true, // set to [false] to not disable the hidden input when Cancel btn is clicked, so the value will present in POST data.
                oneVoteOnly: false,
                showTitles: false,
                captionEl: null, // jQuery object - target for text captions
                callback: null, // function(ui, type, value, event)

                /*
                * CSS classes
                */
                starWidth: 16, // width of the star image
                cancelClass: 'ui-stars-cancel',
                starClass: 'ui-stars-star',
                starOnClass: 'ui-stars-star-on',
                starHoverClass: 'ui-stars-star-hover',
                starDisabledClass: 'ui-stars-star-disabled',
                cancelHoverClass: 'ui-stars-cancel-hover',
                cancelDisabledClass: 'ui-stars-cancel-disabled'
            },

            _create: function () {
                var self = this, o = this.options, starId = 0;
                this.element.data('former.stars', this.element.html());

                o.isSelect = o.inputType == 'select';
                this.$form = $(this.element).closest('form');
                this.$selec = o.isSelect ? $('select', this.element) : null;
                this.$rboxs = o.isSelect ? $('option', this.$selec) : $(':radio', this.element);

                /*
                * Map all inputs from $rboxs array to Stars elements
                */
                this.$stars = this.$rboxs.map(function (i) {
                    var el = {
                        value: this.value,
                        title: (o.isSelect ? this.text : this.title) || this.value,
                        isDefault: (o.isSelect && this.defaultSelected) || this.defaultChecked
                    };

                    if (i == 0) {
                        o.split = typeof o.split != 'number' ? 0 : o.split;
                        o.val2id = [];
                        o.id2val = [];
                        o.id2title = [];
                        o.name = o.isSelect ? self.$selec.get(0).name : this.name;
                        o.disabled = o.disabled || (o.isSelect ? $(self.$selec).attr('disabled') : $(this).attr('disabled'));
                    }

                    /*
                    * Consider it as a Cancel button?
                    */
                    if (el.value == o.cancelValue) {
                        o.cancelTitle = el.title;
                        return null;
                    }

                    o.val2id[el.value] = starId;
                    o.id2val[starId] = el.value;
                    o.id2title[starId] = el.title;

                    if (el.isDefault) {
                        o.checked = starId;
                        o.value = o.defaultValue = el.value;
                        o.title = el.title;
                    }

                    var $s = $('<div/>').addClass(o.starClass);
                    var $a = $('<a/>').attr('title', o.showTitles ? el.title : '').text(el.value);

                    /*
                    * Prepare division settings
                    */
                    if (o.split) {
                        var oddeven = (starId % o.split);
                        var stwidth = Math.floor(o.starWidth / o.split);
                        $s.width(stwidth);
                        $a.css('margin-left', '-' + (oddeven * stwidth) + 'px');
                    }

                    starId++;
                    return $s.append($a).get(0);
                });

                /*
                * How many Stars?
                */
                o.items = starId;

                /*
                * Remove old content
                */
                o.isSelect ? this.$selec.remove() : this.$rboxs.remove();

                /*
                * Append Stars interface
                */
                this.$cancel = $('<div/>').addClass(o.cancelClass).append($('<a/>').attr('title', o.showTitles ? o.cancelTitle : '').text(o.cancelValue));
                o.cancelShow &= !o.disabled && !o.oneVoteOnly;
                o.cancelShow && this.element.append(this.$cancel);
                this.element.append(this.$stars);

                /*
                * Initial selection
                */
                if (o.checked === undefined) {
                    o.checked = -1;
                    o.value = o.defaultValue = o.cancelValue;
                    o.title = '';
                }

                /*
                * The only FORM element, that has been linked to the stars control. The value field is updated on each Star click event
                */
                this.$value = $("<input type='hidden' name='" + o.name + "' value='" + o.value + "' />");
                this.element.append(this.$value);


                /*
                * Attach stars event handler
                */
                this.$stars.bind('click.stars', function (e) {
                    if (!o.forceSelect && o.disabled) return false;

                    var i = self.$stars.index(this);
                    o.checked = i;
                    o.value = o.id2val[i];
                    o.title = o.id2title[i];
                    self.$value.attr({ disabled: o.disabled ? 'disabled' : '', value: o.value });

                    fillTo(i, false);
                    self._disableCancel();

                    !o.forceSelect && self.callback(e, 'star');
                })
                .bind('mouseover.stars', function () {
                    if (o.disabled) return false;
                    var i = self.$stars.index(this);
                    fillTo(i, true);
                })
                .bind('mouseout.stars', function () {
                    if (o.disabled) return false;
                    fillTo(self.options.checked, false);
                });


                /*
                * Attach cancel event handler
                */
                this.$cancel.bind('click.stars', function (e) {
                    if (!o.forceSelect && (o.disabled || o.value == o.cancelValue)) return false;

                    o.checked = -1;
                    o.value = o.cancelValue;
                    o.title = '';

                    self.$value.val(o.value);
                    o.disableValue && self.$value.attr({ disabled: 'disabled' });

                    fillNone();
                    self._disableCancel();

                    !o.forceSelect && self.callback(e, 'cancel');
                })
                .bind('mouseover.stars', function () {
                    if (self._disableCancel()) return false;
                    self.$cancel.addClass(o.cancelHoverClass);
                    fillNone();
                    self._showCap(o.cancelTitle);
                })
                .bind('mouseout.stars', function () {
                    if (self._disableCancel()) return false;
                    self.$cancel.removeClass(o.cancelHoverClass);
                    self.$stars.triggerHandler('mouseout.stars');
                });


                /*
                * Attach onReset event handler to the parent FORM
                */
                this.$form.bind('reset.stars', function () {
                    !o.disabled && self.select(o.defaultValue);
                });


                /*
                * Clean up to avoid memory leaks in certain versions of IE 6
                */
                $(window).unload(function () {
                    self.$cancel.unbind('.stars');
                    self.$stars.unbind('.stars');
                    self.$form.unbind('.stars');
                    self.$selec = self.$rboxs = self.$stars = self.$value = self.$cancel = self.$form = null;
                });


                /*
                * Star selection helpers
                */
                function fillTo(index, hover) {
                    if (index != -1) {
                        var addClass = hover ? o.starHoverClass : o.starOnClass;
                        var remClass = hover ? o.starOnClass : o.starHoverClass;
                        self.$stars.eq(index).prevAll('.' + o.starClass).andSelf().removeClass(remClass).addClass(addClass);
                        self.$stars.eq(index).nextAll('.' + o.starClass).removeClass(o.starHoverClass + ' ' + o.starOnClass);
                        self._showCap(o.id2title[index]);
                    }
                    else fillNone();
                };
                function fillNone() {
                    self.$stars.removeClass(o.starOnClass + ' ' + o.starHoverClass);
                    self._showCap('');
                };


                /*
                * Finally, set up the Stars
                */
                this.select(o.value);
                o.disabled && this.disable();

            },

            /*
            * Private functions
            */
            _disableCancel: function () {
                var o = this.options, disabled = o.disabled || o.oneVoteOnly || (o.value == o.cancelValue);
                if (disabled) this.$cancel.removeClass(o.cancelHoverClass).addClass(o.cancelDisabledClass);
                else this.$cancel.removeClass(o.cancelDisabledClass);
                this.$cancel.css('opacity', disabled ? 0.5 : 1);
                return disabled;
            },
            _disableAll: function () {
                var o = this.options;
                this._disableCancel();
                if (o.disabled) this.$stars.filter('div').addClass(o.starDisabledClass);
                else this.$stars.filter('div').removeClass(o.starDisabledClass);
            },
            _showCap: function (s) {
                var o = this.options;
                if (o.captionEl) o.captionEl.text(s);
            },

            /*
            * Public functions
            */
            value: function () {
                return this.options.value;
            },
            select: function (val) {
                var o = this.options, e = (val == o.cancelValue) ? this.$cancel : this.$stars.eq(o.val2id[val]);
                o.forceSelect = true;
                e.triggerHandler('click.stars');
                o.forceSelect = false;
            },
            selectID: function (id) {
                var o = this.options, e = (id == -1) ? this.$cancel : this.$stars.eq(id);
                o.forceSelect = true;
                e.triggerHandler('click.stars');
                o.forceSelect = false;
            },
            enable: function () {
                this.options.disabled = false;
                this._disableAll();
            },
            disable: function () {
                this.options.disabled = true;
                this._disableAll();
            },
            destroy: function () {
                this.$form.unbind('.stars');
                this.$cancel.unbind('.stars').remove();
                this.$stars.unbind('.stars').remove();
                this.$value.remove();
                this.element.unbind('.stars').html(this.element.data('former.stars')).removeData('stars');
                return this;
            },
            callback: function (e, type) {
                var o = this.options;
                o.callback && o.callback(this, type, o.value, e);
                o.oneVoteOnly && !o.disabled && this.disable();
            }
        });

        $.extend($.ui.stars, {
            version: '3.0.1'
        });

    })(clickd_jquery);/*
    * jQuery timepicker addon
    * By: Trent Richardson [http://trentrichardson.com]
    * Version 0.9.5
    * Last Modified: 05/25/2011
    *
    * Copyright 2011 Trent Richardson
    * Dual licensed under the MIT and GPL licenses.
    * http://trentrichardson.com/Impromptu/GPL-LICENSE.txt
    * http://trentrichardson.com/Impromptu/MIT-LICENSE.txt
    *
    * HERES THE CSS:
    * .ui-timepicker-div .ui-widget-header{ margin-bottom: 8px; }
    * .ui-timepicker-div dl{ text-align: left; }
    * .ui-timepicker-div dl dt{ height: 25px; }
    * .ui-timepicker-div dl dd{ margin: -25px 10px 10px 65px; }
    * .ui-timepicker-div td { font-size: 90%; }
    */

    (function ($)
    {

        $.extend($.ui, { timepicker: { version: "0.9.5"} });

        /* Time picker manager.
        Use the singleton instance of this class, $.timepicker, to interact with the time picker.
        Settings for (groups of) time pickers are maintained in an instance object,
        allowing multiple different settings on the same page. */

        function Timepicker()
        {
            this.regional = []; // Available regional settings, indexed by language code
            this.regional[''] = { // Default regional settings
                currentText: 'Now',
                closeText: 'Done',
                ampm: false,
                timeFormat: 'hh:mm tt',
                timeOnlyTitle: 'Choose Time',
                timeText: 'Time',
                hourText: 'Hour',
                minuteText: 'Minute',
                secondText: 'Second',
                timezoneText: 'Time Zone'
            };
            this._defaults = { // Global defaults for all the datetime picker instances
                showButtonPanel: true,
                timeOnly: false,
                showHour: true,
                showMinute: true,
                showSecond: false,
                showTimezone: false,
                showTime: true,
                stepHour: 0.05,
                stepMinute: 0.05,
                stepSecond: 0.05,
                hour: 0,
                minute: 0,
                second: 0,
                timezone: '+0000',
                hourMin: 0,
                minuteMin: 0,
                secondMin: 0,
                hourMax: 23,
                minuteMax: 59,
                secondMax: 59,
                minDateTime: null,
                maxDateTime: null,
                hourGrid: 0,
                minuteGrid: 0,
                secondGrid: 0,
                alwaysSetTime: true,
                separator: ' ',
                altFieldTimeOnly: true,
                showTimepicker: true,
                timezoneList: ["-1100", "-1000", "-0900", "-0800", "-0700", "-0600",
                       "-0500", "-0400", "-0300", "-0200", "-0100", "+0000",
                       "+0100", "+0200", "+0300", "+0400", "+0500", "+0600",
                       "+0700", "+0800", "+0900", "+1000", "+1100", "+1200"]
            };
            $.extend(this._defaults, this.regional['']);
        }

        $.extend(Timepicker.prototype, {
            $input: null,
            $altInput: null,
            $timeObj: null,
            inst: null,
            hour_slider: null,
            minute_slider: null,
            second_slider: null,
            timezone_select: null,
            hour: 0,
            minute: 0,
            second: 0,
            timezone: '+0000',
            hourMinOriginal: null,
            minuteMinOriginal: null,
            secondMinOriginal: null,
            hourMaxOriginal: null,
            minuteMaxOriginal: null,
            secondMaxOriginal: null,
            ampm: '',
            formattedDate: '',
            formattedTime: '',
            formattedDateTime: '',
            timezoneList: ["-1100", "-1000", "-0900", "-0800", "-0700", "-0600",
                "-0500", "-0400", "-0300", "-0200", "-0100", "+0000",
                "+0100", "+0200", "+0300", "+0400", "+0500", "+0600",
                "+0700", "+0800", "+0900", "+1000", "+1100", "+1200"],

            /* Override the default settings for all instances of the time picker.
            @param  settings  object - the new settings to use as defaults (anonymous object)
            @return the manager object */
            setDefaults: function (settings)
            {
                extendRemove(this._defaults, settings || {});
                return this;
            },

            //########################################################################
            // Create a new Timepicker instance
            //########################################################################
            _newInst: function ($input, o)
            {
                var tp_inst = new Timepicker(),
                inlineSettings = {};

                for(var attrName in this._defaults)
                {
                    var attrValue = $input.attr('time:' + attrName);
                    if(attrValue)
                    {
                        try
                        {
                            inlineSettings[attrName] = eval(attrValue);
                        } catch(err)
                        {
                            inlineSettings[attrName] = attrValue;
                        }
                    }
                }
                tp_inst._defaults = $.extend({}, this._defaults, inlineSettings, o, {
                    beforeShow: function (input, dp_inst)
                    {
                        if($.isFunction(o.beforeShow))
                            o.beforeShow(input, dp_inst, tp_inst);
                    },
                    onChangeMonthYear: function (year, month, dp_inst)
                    {
                        // Update the time as well : this prevents the time from disappearing from the $input field.
                        tp_inst._updateDateTime(dp_inst);
                        if($.isFunction(o.onChangeMonthYear))
                            o.onChangeMonthYear.call($input[0], year, month, dp_inst, tp_inst);
                    },
                    onClose: function (dateText, dp_inst)
                    {
                        if(tp_inst.timeDefined === true && $input.val() != '')
                            tp_inst._updateDateTime(dp_inst);
                        if($.isFunction(o.onClose))
                            o.onClose.call($input[0], dateText, dp_inst, tp_inst);
                    },
                    timepicker: tp_inst // add timepicker as a property of datepicker: $.datepicker._get(dp_inst, 'timepicker');
                });

                tp_inst.hour = tp_inst._defaults.hour;
                tp_inst.minute = tp_inst._defaults.minute;
                tp_inst.second = tp_inst._defaults.second;
                tp_inst.ampm = '';
                tp_inst.$input = $input;

                if(o.altField)
                    tp_inst.$altInput = $(o.altField)
                    .css({ cursor: 'pointer' })
                    .focus(function () { $input.trigger("focus"); });

                // datepicker needs minDate/maxDate, timepicker needs minDateTime/maxDateTime..
                if(tp_inst._defaults.minDate !== undefined && tp_inst._defaults.minDate instanceof Date)
                    tp_inst._defaults.minDateTime = new Date(tp_inst._defaults.minDate.getTime());
                if(tp_inst._defaults.minDateTime !== undefined && tp_inst._defaults.minDateTime instanceof Date)
                    tp_inst._defaults.minDate = new Date(tp_inst._defaults.minDateTime.getTime());
                if(tp_inst._defaults.maxDate !== undefined && tp_inst._defaults.maxDate instanceof Date)
                    tp_inst._defaults.maxDateTime = new Date(tp_inst._defaults.maxDate.getTime());
                if(tp_inst._defaults.maxDateTime !== undefined && tp_inst._defaults.maxDateTime instanceof Date)
                    tp_inst._defaults.maxDate = new Date(tp_inst._defaults.maxDateTime.getTime());

                return tp_inst;
            },

            //########################################################################
            // add our sliders to the calendar
            //########################################################################
            _addTimePicker: function (dp_inst)
            {
                var currDT = (this.$altInput && this._defaults.altFieldTimeOnly) ?
                    this.$input.val() + ' ' + this.$altInput.val() :
                    this.$input.val();

                this.timeDefined = this._parseTime(currDT);
                this._limitMinMaxDateTime(dp_inst, false);
                this._injectTimePicker();
            },

            //########################################################################
            // parse the time string from input value or _setTime
            //########################################################################
            _parseTime: function (timeString, withDate)
            {
                var regstr = this._defaults.timeFormat.toString()
                    .replace(/h{1,2}/ig, '(\\d?\\d)')
                    .replace(/m{1,2}/ig, '(\\d?\\d)')
                    .replace(/s{1,2}/ig, '(\\d?\\d)')
                    .replace(/t{1,2}/ig, '(am|pm|a|p)?')
                    .replace(/z{1}/ig, '((\\+|-)\\d\\d\\d\\d)?')
                    .replace(/\s/g, '\\s?') + '$',
                order = this._getFormatPositions(),
                treg;

                if(!this.inst) this.inst = $.datepicker._getInst(this.$input[0]);

                if(withDate || !this._defaults.timeOnly)
                {
                    // the time should come after x number of characters and a space.
                    // x = at least the length of text specified by the date format
                    var dp_dateFormat = $.datepicker._get(this.inst, 'dateFormat');
                    // escape special regex characters in the seperator
                    var specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", "g");
                    regstr = '.{' + dp_dateFormat.length + ',}' + this._defaults.separator.replace(specials, "\\$&") + regstr;
                }

                treg = timeString.match(new RegExp(regstr, 'i'));

                if(treg)
                {
                    if(order.t !== -1)
                        this.ampm = ((treg[order.t] === undefined || treg[order.t].length === 0) ?
                        '' :
                        (treg[order.t].charAt(0).toUpperCase() == 'A') ? 'AM' : 'PM').toUpperCase();

                    if(order.h !== -1)
                    {
                        if(this.ampm == 'AM' && treg[order.h] == '12')
                            this.hour = 0; // 12am = 0 hour
                        else if(this.ampm == 'PM' && treg[order.h] != '12')
                            this.hour = (parseFloat(treg[order.h]) + 12).toFixed(0); // 12pm = 12 hour, any other pm = hour + 12
                        else this.hour = Number(treg[order.h]);
                    }

                    if(order.m !== -1) this.minute = Number(treg[order.m]);
                    if(order.s !== -1) this.second = Number(treg[order.s]);
                    if(order.z !== -1) this.timezone = treg[order.z];

                    return true;

                }
                return false;
            },

            //########################################################################
            // figure out position of time elements.. cause js cant do named captures
            //########################################################################
            _getFormatPositions: function ()
            {
                var finds = this._defaults.timeFormat.toLowerCase().match(/(h{1,2}|m{1,2}|s{1,2}|t{1,2}|z)/g),
                orders = { h: -1, m: -1, s: -1, t: -1, z: -1 };

                if(finds)
                    for(var i = 0;i < finds.length;i++)
                        if(orders[finds[i].toString().charAt(0)] == -1)
                            orders[finds[i].toString().charAt(0)] = i + 1;

                return orders;
            },

            //########################################################################
            // generate and inject html for timepicker into ui datepicker
            //########################################################################
            _injectTimePicker: function ()
            {
                var $dp = this.inst.dpDiv,
                o = this._defaults,
                tp_inst = this,
                // Added by Peter Medeiros:
                // - Figure out what the hour/minute/second max should be based on the step values.
                // - Example: if stepMinute is 15, then minMax is 45.
                hourMax = (o.hourMax - (o.hourMax % o.stepHour)).toFixed(0),
                minMax = (o.minuteMax - (o.minuteMax % o.stepMinute)).toFixed(0),
                secMax = (o.secondMax - (o.secondMax % o.stepSecond)).toFixed(0),
                dp_id = this.inst.id.toString().replace(/([^A-Za-z0-9_])/g, '');

                // Prevent displaying twice
                //if ($dp.find("div#ui-timepicker-div-"+ dp_id).length === 0) {
                if($dp.find("div#ui-timepicker-div-" + dp_id).length === 0 && o.showTimepicker)
                {
                    var noDisplay = ' style="display:none;"',
                    html = '<div class="ui-timepicker-div" id="ui-timepicker-div-' + dp_id + '"><dl>' +
                            '<dt class="ui_tpicker_time_label" id="ui_tpicker_time_label_' + dp_id + '"' +
                            ((o.showTime) ? '' : noDisplay) + '>' + o.timeText + '</dt>' +
                            '<dd class="ui_tpicker_time" id="ui_tpicker_time_' + dp_id + '"' +
                            ((o.showTime) ? '' : noDisplay) + '></dd>' +
                            '<dt class="ui_tpicker_hour_label" id="ui_tpicker_hour_label_' + dp_id + '"' +
                            ((o.showHour) ? '' : noDisplay) + '>' + o.hourText + '</dt>',
                    hourGridSize = 0,
                    minuteGridSize = 0,
                    secondGridSize = 0,
                    size;

                    if(o.showHour && o.hourGrid > 0)
                    {
                        html += '<dd class="ui_tpicker_hour">' +
                            '<div id="ui_tpicker_hour_' + dp_id + '"' + ((o.showHour) ? '' : noDisplay) + '></div>' +
                            '<div style="padding-left: 1px"><table><tr>';

                        for(var h = o.hourMin;h < hourMax;h += o.hourGrid)
                        {
                            hourGridSize++;
                            var tmph = (o.ampm && h > 12) ? h - 12 : h;
                            if(tmph < 10) tmph = '0' + tmph;
                            if(o.ampm)
                            {
                                if(h == 0) tmph = 12 + 'a';
                                else if(h < 12) tmph += 'a';
                                else tmph += 'p';
                            }
                            html += '<td>' + tmph + '</td>';
                        }

                        html += '</tr></table></div>' +
                            '</dd>';
                    } else html += '<dd class="ui_tpicker_hour" id="ui_tpicker_hour_' + dp_id + '"' +
                                ((o.showHour) ? '' : noDisplay) + '></dd>';

                    html += '<dt class="ui_tpicker_minute_label" id="ui_tpicker_minute_label_' + dp_id + '"' +
                        ((o.showMinute) ? '' : noDisplay) + '>' + o.minuteText + '</dt>';

                    if(o.showMinute && o.minuteGrid > 0)
                    {
                        html += '<dd class="ui_tpicker_minute ui_tpicker_minute_' + o.minuteGrid + '">' +
                            '<div id="ui_tpicker_minute_' + dp_id + '"' +
                            ((o.showMinute) ? '' : noDisplay) + '></div>' +
                            '<div style="padding-left: 1px"><table><tr>';

                        for(var m = o.minuteMin;m < minMax;m += o.minuteGrid)
                        {
                            minuteGridSize++;
                            html += '<td>' + ((m < 10) ? '0' : '') + m + '</td>';
                        }

                        html += '</tr></table></div>' +
                            '</dd>';
                    } else html += '<dd class="ui_tpicker_minute" id="ui_tpicker_minute_' + dp_id + '"' +
                                ((o.showMinute) ? '' : noDisplay) + '></dd>';

                    html += '<dt class="ui_tpicker_second_label" id="ui_tpicker_second_label_' + dp_id + '"' +
                        ((o.showSecond) ? '' : noDisplay) + '>' + o.secondText + '</dt>';

                    if(o.showSecond && o.secondGrid > 0)
                    {
                        html += '<dd class="ui_tpicker_second ui_tpicker_second_' + o.secondGrid + '">' +
                            '<div id="ui_tpicker_second_' + dp_id + '"' +
                            ((o.showSecond) ? '' : noDisplay) + '></div>' +
                            '<div style="padding-left: 1px"><table><tr>';

                        for(var s = o.secondMin;s < secMax;s += o.secondGrid)
                        {
                            secondGridSize++;
                            html += '<td>' + ((s < 10) ? '0' : '') + s + '</td>';
                        }

                        html += '</tr></table></div>' +
                            '</dd>';
                    } else html += '<dd class="ui_tpicker_second" id="ui_tpicker_second_' + dp_id + '"' +
                                ((o.showSecond) ? '' : noDisplay) + '></dd>';

                    html += '<dt class="ui_tpicker_timezone_label" id="ui_tpicker_timezone_label_' + dp_id + '"' +
                        ((o.showTimezone) ? '' : noDisplay) + '>' + o.timezoneText + '</dt>';
                    html += '<dd class="ui_tpicker_timezone" id="ui_tpicker_timezone_' + dp_id + '"' +
                                ((o.showTimezone) ? '' : noDisplay) + '></dd>';

                    html += '</dl></div>';
                    $tp = $(html);

                    // if we only want time picker...
                    if(o.timeOnly === true)
                    {
                        $tp.prepend(
                        '<div class="ui-widget-header ui-helper-clearfix ui-corner-all">' +
                            '<div class="ui-datepicker-title">' + o.timeOnlyTitle + '</div>' +
                        '</div>');
                        $dp.find('.ui-datepicker-header, .ui-datepicker-calendar').hide();
                    }

                    this.hour_slider = $tp.find('#ui_tpicker_hour_' + dp_id).slider({
                        orientation: "horizontal",
                        value: this.hour,
                        min: o.hourMin,
                        max: hourMax,
                        step: o.stepHour,
                        slide: function (event, ui)
                        {
                            tp_inst.hour_slider.slider("option", "value", ui.value);
                            tp_inst._onTimeChange();
                        }
                    });

                    // Updated by Peter Medeiros:
                    // - Pass in Event and UI instance into slide function
                    this.minute_slider = $tp.find('#ui_tpicker_minute_' + dp_id).slider({
                        orientation: "horizontal",
                        value: this.minute,
                        min: o.minuteMin,
                        max: minMax,
                        step: o.stepMinute,
                        slide: function (event, ui)
                        {
                            // update the global minute slider instance value with the current slider value
                            tp_inst.minute_slider.slider("option", "value", ui.value);
                            tp_inst._onTimeChange();
                        }
                    });

                    this.second_slider = $tp.find('#ui_tpicker_second_' + dp_id).slider({
                        orientation: "horizontal",
                        value: this.second,
                        min: o.secondMin,
                        max: secMax,
                        step: o.stepSecond,
                        slide: function (event, ui)
                        {
                            tp_inst.second_slider.slider("option", "value", ui.value);
                            tp_inst._onTimeChange();
                        }
                    });


                    this.timezone_select = $tp.find('#ui_tpicker_timezone_' + dp_id).append('<select></select>').find("select");
                    $.fn.append.apply(this.timezone_select,
                    $.map(o.timezoneList, function (val, idx)
                    {
                        return $("<option />")
                            .val(typeof val == "object" ? val.value : val)
                            .text(typeof val == "object" ? val.label : val);
                    })
                );
                    this.timezone_select.val((typeof this.timezone != "undefined" && this.timezone != null && this.timezone != "") ? this.timezone : o.timezone);
                    this.timezone_select.change(function ()
                    {
                        tp_inst._onTimeChange();
                    });

                    // Add grid functionality
                    if(o.showHour && o.hourGrid > 0)
                    {
                        size = 100 * hourGridSize * o.hourGrid / (hourMax - o.hourMin);

                        $tp.find(".ui_tpicker_hour table").css({
                            width: size + "%",
                            marginLeft: (size / (-2 * hourGridSize)) + "%",
                            borderCollapse: 'collapse'
                        }).find("td").each(function (index)
                        {
                            $(this).click(function ()
                            {
                                var h = $(this).html();
                                if(o.ampm)
                                {
                                    var ap = h.substring(2).toLowerCase(),
                                    aph = parseInt(h.substring(0, 2));
                                    if(ap == 'a')
                                    {
                                        if(aph == 12) h = 0;
                                        else h = aph;
                                    } else if(aph == 12) h = 12;
                                    else h = aph + 12;
                                }
                                tp_inst.hour_slider.slider("option", "value", h);
                                tp_inst._onTimeChange();
                                tp_inst._onSelectHandler();
                            }).css({
                                cursor: 'pointer',
                                width: (100 / hourGridSize) + '%',
                                textAlign: 'center',
                                overflow: 'hidden'
                            });
                        });
                    }

                    if(o.showMinute && o.minuteGrid > 0)
                    {
                        size = 100 * minuteGridSize * o.minuteGrid / (minMax - o.minuteMin);
                        $tp.find(".ui_tpicker_minute table").css({
                            width: size + "%",
                            marginLeft: (size / (-2 * minuteGridSize)) + "%",
                            borderCollapse: 'collapse'
                        }).find("td").each(function (index)
                        {
                            $(this).click(function ()
                            {
                                tp_inst.minute_slider.slider("option", "value", $(this).html());
                                tp_inst._onTimeChange();
                                tp_inst._onSelectHandler();
                            }).css({
                                cursor: 'pointer',
                                width: (100 / minuteGridSize) + '%',
                                textAlign: 'center',
                                overflow: 'hidden'
                            });
                        });
                    }

                    if(o.showSecond && o.secondGrid > 0)
                    {
                        $tp.find(".ui_tpicker_second table").css({
                            width: size + "%",
                            marginLeft: (size / (-2 * secondGridSize)) + "%",
                            borderCollapse: 'collapse'
                        }).find("td").each(function (index)
                        {
                            $(this).click(function ()
                            {
                                tp_inst.second_slider.slider("option", "value", $(this).html());
                                tp_inst._onTimeChange();
                                tp_inst._onSelectHandler();
                            }).css({
                                cursor: 'pointer',
                                width: (100 / secondGridSize) + '%',
                                textAlign: 'center',
                                overflow: 'hidden'
                            });
                        });
                    }

                    var $buttonPanel = $dp.find('.ui-datepicker-buttonpane');
                    if($buttonPanel.length) $buttonPanel.before($tp);
                    else $dp.append($tp);

                    this.$timeObj = $tp.find('#ui_tpicker_time_' + dp_id);

                    if(this.inst !== null)
                    {
                        var timeDefined = this.timeDefined;
                        this._onTimeChange();
                        this.timeDefined = timeDefined;
                    }

                    //Emulate datepicker onSelect behavior. Call on slidestop.
                    var onSelectDelegate = function ()
                    {
                        tp_inst._onSelectHandler();
                    };
                    this.hour_slider.bind('slidestop', onSelectDelegate);
                    this.minute_slider.bind('slidestop', onSelectDelegate);
                    this.second_slider.bind('slidestop', onSelectDelegate);
                }
            },

            //########################################################################
            // This function tries to limit the ability to go outside the
            // min/max date range
            //########################################################################
            _limitMinMaxDateTime: function (dp_inst, adjustSliders)
            {
                var o = this._defaults,
                dp_date = new Date(dp_inst.selectedYear, dp_inst.selectedMonth, dp_inst.selectedDay);

                if(!this._defaults.showTimepicker) return; // No time so nothing to check here

                if(this._defaults.minDateTime !== null && dp_date)
                {
                    var minDateTime = this._defaults.minDateTime,
                    minDateTimeDate = new Date(minDateTime.getFullYear(), minDateTime.getMonth(), minDateTime.getDate(), 0, 0, 0, 0);

                    if(this.hourMinOriginal === null || this.minuteMinOriginal === null || this.secondMinOriginal === null)
                    {
                        this.hourMinOriginal = o.hourMin;
                        this.minuteMinOriginal = o.minuteMin;
                        this.secondMinOriginal = o.secondMin;
                    }

                    if(dp_inst.settings.timeOnly || minDateTimeDate.getTime() == dp_date.getTime())
                    {
                        this._defaults.hourMin = minDateTime.getHours();
                        if(this.hour <= this._defaults.hourMin)
                        {
                            this.hour = this._defaults.hourMin;
                            this._defaults.minuteMin = minDateTime.getMinutes();
                            if(this.minute <= this._defaults.minuteMin)
                            {
                                this.minute = this._defaults.minuteMin;
                                this._defaults.secondMin = minDateTime.getSeconds();
                            } else
                            {
                                if(this.second < this._defaults.secondMin) this.second = this._defaults.secondMin;
                                this._defaults.secondMin = this.secondMinOriginal;
                            }
                        } else
                        {
                            this._defaults.minuteMin = this.minuteMinOriginal;
                            this._defaults.secondMin = this.secondMinOriginal;
                        }
                    } else
                    {
                        this._defaults.hourMin = this.hourMinOriginal;
                        this._defaults.minuteMin = this.minuteMinOriginal;
                        this._defaults.secondMin = this.secondMinOriginal;
                    }
                }

                if(this._defaults.maxDateTime !== null && dp_date)
                {
                    var maxDateTime = this._defaults.maxDateTime,
                    maxDateTimeDate = new Date(maxDateTime.getFullYear(), maxDateTime.getMonth(), maxDateTime.getDate(), 0, 0, 0, 0);

                    if(this.hourMaxOriginal === null || this.minuteMaxOriginal === null || this.secondMaxOriginal === null)
                    {
                        this.hourMaxOriginal = o.hourMax;
                        this.minuteMaxOriginal = o.minuteMax;
                        this.secondMaxOriginal = o.secondMax;
                    }

                    if(dp_inst.settings.timeOnly || maxDateTimeDate.getTime() == dp_date.getTime())
                    {
                        this._defaults.hourMax = maxDateTime.getHours();
                        if(this.hour >= this._defaults.hourMax)
                        {
                            this.hour = this._defaults.hourMax;
                            this._defaults.minuteMax = maxDateTime.getMinutes();
                            if(this.minute >= this._defaults.minuteMax)
                            {
                                this.minute = this._defaults.minuteMax;
                                this._defaults.secondMin = maxDateTime.getSeconds();
                            } else
                            {
                                if(this.second > this._defaults.secondMax) this.second = this._defaults.secondMax;
                                this._defaults.secondMax = this.secondMaxOriginal;
                            }
                        } else
                        {
                            this._defaults.minuteMax = this.minuteMaxOriginal;
                            this._defaults.secondMax = this.secondMaxOriginal;
                        }
                    } else
                    {
                        this._defaults.hourMax = this.hourMaxOriginal;
                        this._defaults.minuteMax = this.minuteMaxOriginal;
                        this._defaults.secondMax = this.secondMaxOriginal;
                    }
                }

                if(adjustSliders !== undefined && adjustSliders === true)
                {
                    this.hour_slider.slider("option", { min: this._defaults.hourMin, max: this._defaults.hourMax }).slider('value', this.hour);
                    this.minute_slider.slider("option", { min: this._defaults.minuteMin, max: this._defaults.minuteMax }).slider('value', this.minute);
                    this.second_slider.slider("option", { min: this._defaults.secondMin, max: this._defaults.secondMax }).slider('value', this.second);
                }

            },


            //########################################################################
            // when a slider moves, set the internal time...
            // on time change is also called when the time is updated in the text field
            //########################################################################
            _onTimeChange: function ()
            {
                var hour = (this.hour_slider) ? this.hour_slider.slider('value') : false,
                minute = (this.minute_slider) ? this.minute_slider.slider('value') : false,
                second = (this.second_slider) ? this.second_slider.slider('value') : false,
                timezone = (this.timezone_select) ? this.timezone_select.val() : false;

                if(hour !== false) hour = parseInt(hour, 10);
                if(minute !== false) minute = parseInt(minute, 10);
                if(second !== false) second = parseInt(second, 10);

                var ampm = (hour < 12) ? 'AM' : 'PM';

                // If the update was done in the input field, the input field should not be updated.
                // If the update was done using the sliders, update the input field.
                var hasChanged = (hour != this.hour || minute != this.minute || second != this.second || (this.ampm.length > 0 && this.ampm != ampm) || timezone != this.timezone);

                if(hasChanged)
                {

                    if(hour !== false) this.hour = hour;
                    if(minute !== false) this.minute = minute;
                    if(second !== false) this.second = second;
                    if(timezone !== false) this.timezone = timezone;
                    this._limitMinMaxDateTime(this.inst, true);
                }
                if(this._defaults.ampm) this.ampm = ampm;

                this._formatTime();
                if(this.$timeObj) this.$timeObj.text(this.formattedTime);
                this.timeDefined = true;
                if(hasChanged) this._updateDateTime();
            },

            //########################################################################
            // call custom onSelect.
            // bind to sliders slidestop, and grid click.
            //########################################################################
            _onSelectHandler: function ()
            {
                var onSelect = this._defaults['onSelect'];
                var inputEl = this.$input ? this.$input[0] : null;
                if(onSelect && inputEl)
                {
                    onSelect.apply(inputEl, [this.formattedDateTime, this]);
                }
            },

            //########################################################################
            // format the time all pretty...
            //########################################################################
            _formatTime: function (time, format, ampm)
            {
                if(ampm == undefined) ampm = this._defaults.ampm;
                time = time || { hour: this.hour, minute: this.minute, second: this.second, ampm: this.ampm, timezone: this.timezone };
                var tmptime = format || this._defaults.timeFormat.toString();

                if(ampm)
                {
                    var hour12 = ((time.ampm == 'AM') ? (time.hour) : (time.hour % 12));
                    hour12 = (Number(hour12) === 0) ? 12 : hour12;
                    tmptime = tmptime.toString()
                    .replace(/hh/g, ((hour12 < 10) ? '0' : '') + hour12)
                    .replace(/h/g, hour12)
                    .replace(/mm/g, ((time.minute < 10) ? '0' : '') + time.minute)
                    .replace(/m/g, time.minute)
                    .replace(/ss/g, ((time.second < 10) ? '0' : '') + time.second)
                    .replace(/s/g, time.second)
                    .replace(/TT/g, time.ampm.toUpperCase())
                    .replace(/Tt/g, time.ampm.toUpperCase())
                    .replace(/tT/g, time.ampm.toLowerCase())
                    .replace(/tt/g, time.ampm.toLowerCase())
                    .replace(/T/g, time.ampm.charAt(0).toUpperCase())
                    .replace(/t/g, time.ampm.charAt(0).toLowerCase())
                    .replace(/z/g, time.timezone);
                } else
                {
                    tmptime = tmptime.toString()
                    .replace(/hh/g, ((time.hour < 10) ? '0' : '') + time.hour)
                    .replace(/h/g, time.hour)
                    .replace(/mm/g, ((time.minute < 10) ? '0' : '') + time.minute)
                    .replace(/m/g, time.minute)
                    .replace(/ss/g, ((time.second < 10) ? '0' : '') + time.second)
                    .replace(/s/g, time.second)
                    .replace(/z/g, time.timezone);
                    tmptime = $.trim(tmptime.replace(/t/gi, ''));
                }

                if(arguments.length) return tmptime;
                else this.formattedTime = tmptime;
            },

            //########################################################################
            // update our input with the new date time..
            //########################################################################
            _updateDateTime: function (dp_inst)
            {
                dp_inst = this.inst || dp_inst,
                dt = new Date(dp_inst.selectedYear, dp_inst.selectedMonth, dp_inst.selectedDay),
                dateFmt = $.datepicker._get(dp_inst, 'dateFormat'),
                formatCfg = $.datepicker._getFormatConfig(dp_inst),
                timeAvailable = dt !== null && this.timeDefined;
                this.formattedDate = $.datepicker.formatDate(dateFmt, (dt === null ? new Date() : dt), formatCfg);
                var formattedDateTime = this.formattedDate;
                if(dp_inst.lastVal !== undefined && (dp_inst.lastVal.length > 0 && this.$input.val().length === 0))
                    return;

                if(this._defaults.timeOnly === true)
                {
                    formattedDateTime = this.formattedTime;
                } else if(this._defaults.timeOnly !== true && (this._defaults.alwaysSetTime || timeAvailable))
                {
                    formattedDateTime += this._defaults.separator + this.formattedTime;
                }

                this.formattedDateTime = formattedDateTime;

                if(!this._defaults.showTimepicker)
                {
                    this.$input.val(this.formattedDate);
                } else if(this.$altInput && this._defaults.altFieldTimeOnly === true)
                {
                    this.$altInput.val(this.formattedTime);
                    this.$input.val(this.formattedDate);
                } else if(this.$altInput)
                {
                    this.$altInput.val(formattedDateTime);
                    this.$input.val(formattedDateTime);
                } else
                {
                    this.$input.val(formattedDateTime);
                }

                this.$input.trigger("change");
            }

        });

        $.fn.extend({
            //########################################################################
            // shorthand just to use timepicker..
            //########################################################################
            timepicker: function (o)
            {
                o = o || {};
                var tmp_args = arguments;

                if(typeof o == 'object') tmp_args[0] = $.extend(o, { timeOnly: true });

                return $(this).each(function ()
                {
                    $.fn.datetimepicker.apply($(this), tmp_args);
                });
            },

            //########################################################################
            // extend timepicker to datepicker
            //########################################################################
            datetimepicker: function (o)
            {
                o = o || {};
                var $input = this,
            tmp_args = arguments;

                if(typeof (o) == 'string')
                {
                    if(o == 'getDate')
                        return $.fn.datepicker.apply($(this[0]), tmp_args);
                    else
                        return this.each(function ()
                        {
                            var $t = $(this);
                            $t.datepicker.apply($t, tmp_args);
                        });
                }
                else
                    return this.each(function ()
                    {
                        var $t = $(this);
                        $t.datepicker($.timepicker._newInst($t, o)._defaults);
                    });
            }
        });

        //########################################################################
        // the bad hack :/ override datepicker so it doesnt close on select
        // inspired: http://stackoverflow.com/questions/1252512/jquery-datepicker-prevent-closing-picker-when-clicking-a-date/1762378#1762378
        //########################################################################
        $.datepicker._base_selectDate = $.datepicker._selectDate;
        $.datepicker._selectDate = function (id, dateStr)
        {
            var inst = this._getInst($(id)[0]),
            tp_inst = this._get(inst, 'timepicker');

            if(tp_inst)
            {
                tp_inst._limitMinMaxDateTime(inst, true);
                inst.inline = inst.stay_open = true;
                //This way the onSelect handler called from calendarpicker get the full dateTime
                this._base_selectDate(id, dateStr + tp_inst._defaults.separator + tp_inst.formattedTime);
                inst.inline = inst.stay_open = false;
                this._notifyChange(inst);
                this._updateDatepicker(inst);
            }
            else this._base_selectDate(id, dateStr);
        };

        //#############################################################################################
        // second bad hack :/ override datepicker so it triggers an event when changing the input field
        // and does not redraw the datepicker on every selectDate event
        //#############################################################################################
        $.datepicker._base_updateDatepicker = $.datepicker._updateDatepicker;
        $.datepicker._updateDatepicker = function (inst)
        {
            if(typeof (inst.stay_open) !== 'boolean' || inst.stay_open === false)
            {

                this._base_updateDatepicker(inst);

                // Reload the time control when changing something in the input text field.
                var tp_inst = this._get(inst, 'timepicker');
                if(tp_inst) tp_inst._addTimePicker(inst);
            }
        };

        //#######################################################################################
        // third bad hack :/ override datepicker so it allows spaces and colan in the input field
        //#######################################################################################
        $.datepicker._base_doKeyPress = $.datepicker._doKeyPress;
        $.datepicker._doKeyPress = function (event)
        {
            var inst = $.datepicker._getInst(event.target),
            tp_inst = $.datepicker._get(inst, 'timepicker');

            if(tp_inst)
            {
                if($.datepicker._get(inst, 'constrainInput'))
                {
                    var ampm = tp_inst._defaults.ampm,
                    datetimeChars = tp_inst._defaults.timeFormat.toString()
                                    .replace(/[hms]/g, '')
                                    .replace(/TT/g, ampm ? 'APM' : '')
                                    .replace(/Tt/g, ampm ? 'AaPpMm' : '')
                                    .replace(/tT/g, ampm ? 'AaPpMm' : '')
                                    .replace(/T/g, ampm ? 'AP' : '')
                                    .replace(/tt/g, ampm ? 'apm' : '')
                                    .replace(/t/g, ampm ? 'ap' : '') +
                                    " " +
                                    tp_inst._defaults.separator +
                                    $.datepicker._possibleChars($.datepicker._get(inst, 'dateFormat')),
                    chr = String.fromCharCode(event.charCode === undefined ? event.keyCode : event.charCode);
                    return event.ctrlKey || (chr < ' ' || !datetimeChars || datetimeChars.indexOf(chr) > -1);
                }
            }

            return $.datepicker._base_doKeyPress(event);
        };

        //#######################################################################################
        // Override key up event to sync manual input changes.
        //#######################################################################################
        $.datepicker._base_doKeyUp = $.datepicker._doKeyUp;
        $.datepicker._doKeyUp = function (event)
        {
            var inst = $.datepicker._getInst(event.target),
            tp_inst = $.datepicker._get(inst, 'timepicker');

            if(tp_inst)
            {
                if(tp_inst._defaults.timeOnly && (inst.input.val() != inst.lastVal))
                {
                    try
                    {
                        $.datepicker._updateDatepicker(inst);
                    }
                    catch(err)
                    {
                        $.datepicker.log(err);
                    }
                }
            }

            return $.datepicker._base_doKeyUp(event);
        };

        //#######################################################################################
        // override "Today" button to also grab the time.
        //#######################################################################################
        $.datepicker._base_gotoToday = $.datepicker._gotoToday;
        $.datepicker._gotoToday = function (id)
        {
            this._base_gotoToday(id);
            this._setTime(this._getInst($(id)[0]), new Date());
        };

        //#######################################################################################
        // Disable & enable the Time in the datetimepicker
        //#######################################################################################
        $.datepicker._disableTimepickerDatepicker = function (target, date, withDate)
        {
            var inst = this._getInst(target),
        tp_inst = this._get(inst, 'timepicker');
            $(target).datepicker('getDate'); // Init selected[Year|Month|Day]
            if(tp_inst)
            {
                tp_inst._defaults.showTimepicker = false;
                tp_inst._updateDateTime(inst);
            }
        };

        $.datepicker._enableTimepickerDatepicker = function (target, date, withDate)
        {
            var inst = this._getInst(target),
        tp_inst = this._get(inst, 'timepicker');
            $(target).datepicker('getDate'); // Init selected[Year|Month|Day]
            if(tp_inst)
            {
                tp_inst._defaults.showTimepicker = true;
                tp_inst._addTimePicker(inst); // Could be disabled on page load
                tp_inst._updateDateTime(inst);
            }
        };

        //#######################################################################################
        // Create our own set time function
        //#######################################################################################
        $.datepicker._setTime = function (inst, date)
        {
            var tp_inst = this._get(inst, 'timepicker');
            if(tp_inst)
            {
                var defaults = tp_inst._defaults,
                // calling _setTime with no date sets time to defaults
                hour = date ? date.getHours() : defaults.hour,
                minute = date ? date.getMinutes() : defaults.minute,
                second = date ? date.getSeconds() : defaults.second;

                //check if within min/max times..
                if((hour < defaults.hourMin || hour > defaults.hourMax) || (minute < defaults.minuteMin || minute > defaults.minuteMax) || (second < defaults.secondMin || second > defaults.secondMax))
                {
                    hour = defaults.hourMin;
                    minute = defaults.minuteMin;
                    second = defaults.secondMin;
                }

                if(tp_inst.hour_slider) tp_inst.hour_slider.slider('value', hour);
                else tp_inst.hour = hour;
                if(tp_inst.minute_slider) tp_inst.minute_slider.slider('value', minute);
                else tp_inst.minute = minute;
                if(tp_inst.second_slider) tp_inst.second_slider.slider('value', second);
                else tp_inst.second = second;

                tp_inst._onTimeChange();
                tp_inst._updateDateTime(inst);
            }
        };

        //#######################################################################################
        // Create new public method to set only time, callable as $().datepicker('setTime', date)
        //#######################################################################################
        $.datepicker._setTimeDatepicker = function (target, date, withDate)
        {
            var inst = this._getInst(target),
            tp_inst = this._get(inst, 'timepicker');

            if(tp_inst)
            {
                this._setDateFromField(inst);
                var tp_date;
                if(date)
                {
                    if(typeof date == "string")
                    {
                        tp_inst._parseTime(date, withDate);
                        tp_date = new Date();
                        tp_date.setHours(tp_inst.hour, tp_inst.minute, tp_inst.second);
                    }
                    else tp_date = new Date(date.getTime());
                    if(tp_date.toString() == 'Invalid Date') tp_date = undefined;
                    this._setTime(inst, tp_date);
                }
            }

        };

        //#######################################################################################
        // override setDate() to allow setting time too within Date object
        //#######################################################################################
        $.datepicker._base_setDateDatepicker = $.datepicker._setDateDatepicker;
        $.datepicker._setDateDatepicker = function (target, date)
        {
            var inst = this._getInst(target),
        tp_date = (date instanceof Date) ? new Date(date.getTime()) : date;

            this._updateDatepicker(inst);
            this._base_setDateDatepicker.apply(this, arguments);
            this._setTimeDatepicker(target, tp_date, true);
        };

        //#######################################################################################
        // override getDate() to allow getting time too within Date object
        //#######################################################################################
        $.datepicker._base_getDateDatepicker = $.datepicker._getDateDatepicker;
        $.datepicker._getDateDatepicker = function (target, noDefault)
        {
            var inst = this._getInst(target),
            tp_inst = this._get(inst, 'timepicker');

            if(tp_inst)
            {
                this._setDateFromField(inst, noDefault);
                var date = this._getDate(inst);
                if(date && tp_inst._parseTime($(target).val(), tp_inst.timeOnly)) date.setHours(tp_inst.hour, tp_inst.minute, tp_inst.second);
                return date;
            }
            return this._base_getDateDatepicker(target, noDefault);
        };

        //#######################################################################################
        // jQuery extend now ignores nulls!
        //#######################################################################################
        function extendRemove(target, props)
        {
            $.extend(target, props);
            for(var name in props)
                if(props[name] === null || props[name] === undefined)
                    target[name] = props[name];
            return target;
        }

        $.timepicker = new Timepicker(); // singleton instance
        $.timepicker.version = "0.9.5";

    })(clickd_jquery);

    (function ($) {

        $.extend($.ui, { qaptcha: { version: "1.0.0"} });

        function Qaptcha() {
            this.defaults = {
                txtLock: 'Locked : form can\'t be submitted',
                txtUnlock: 'Unlocked : form can be submitted',
                disabledSubmit: true,
                autoRevert: false,
                readOnly: false
            };
        }

        $.extend(Qaptcha.prototype, {
            Clr: $('<div>', { 'class': 'clr' }),
            bgSlider: $('<div>', { id: 'bgSlider' }),
            Slider: $('<div>', { id: 'Slider' }),
            Icons: $('<div>', { id: 'Icons' }),
            TxtStatus: $('<div>', { id: 'TxtStatus', 'class': 'dropError' }),
            inputQapTcha: $('<input>', { name: 'iQapTcha', value: "123456", type: 'hidden' }),
            enableAction: function () {
                $.qaptcha.Slider.draggable('disable').css('cursor', 'default');
                $.qaptcha.inputQapTcha.val("");
                $.qaptcha.TxtStatus.text($.qaptcha.defaults.txtUnlock).addClass('dropSuccess').removeClass('dropError');
                $.qaptcha.Icons.css('background-position', '-16px 0');
                if ($.qaptcha.defaults.readOnly !== true) {
                    $("#btnSubmit").prop("disabled", false);
                }
            }
        });

        $.fn.extend({
            qaptcha: function (options) {

                $.extend($.qaptcha.defaults, options);

                if (this.length > 0)
                    return $(this).each(function (i) {
                        var $this = $(this);
                        $.qaptcha.TxtStatus.text($.qaptcha.defaults.txtLock);

                        if ($.qaptcha.defaults.disabledSubmit) {
                            $('#btnSubmit').attr('disabled', 'disabled');
                        }

                        $.qaptcha.bgSlider.appendTo($this);
                        $.qaptcha.Icons.insertAfter($.qaptcha.bgSlider);
                        $.qaptcha.Clr.insertAfter($.qaptcha.Icons);
                        $.qaptcha.TxtStatus.insertAfter($.qaptcha.Clr);
                        $.qaptcha.inputQapTcha.appendTo($this);
                        $.qaptcha.Slider.appendTo($.qaptcha.bgSlider);
                        $this.show();

                        if ($.qaptcha.defaults.readOnly !== true) {
                            $("#Icons").bind("click", function (e) {
                                $.qaptcha.Slider.css("left", "153px");
                                $.qaptcha.enableAction();
                            });

                            $.qaptcha.Slider.draggable({
                                revert: function () {
                                    if ($.qaptcha.defaults.autoRevert) {
                                        if (parseInt($.qaptcha.Slider.css("left")) > 150) return false;
                                        else return true;
                                    }
                                },
                                axis: 'x',
                                containment: ".QapTcha",
                                scroll: false,
                                stop: function (event, ui) {
                                    if (ui.position.left > 150) {
                                        $.qaptcha.enableAction();
                                    }
                                }
                            });
                        }
                    });
            }
        });

        $.qaptcha = new Qaptcha(); // singleton instance
        $.qaptcha.version = "1.0.0";

    })(clickd_jquery);
    /**
    *
    *  Base64 encode / decode
    *  http://www.webtoolkit.info/
    *
    **/

    var Base64 = {

        // private property
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

        // public method for encoding
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;

            input = Base64._utf8_encode(input);

            while (i < input.length) {

                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

            }

            return output;
        },

        // public method for decoding
        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;

            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            while (i < input.length) {

                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

            }

            output = Base64._utf8_decode(output);

            return output;

        },

        // private method for UTF-8 encoding
        _utf8_encode: function (string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";

            for (var n = 0; n < string.length; n++) {

                var c = string.charCodeAt(n);

                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }

            }

            return utftext;
        },

        // private method for UTF-8 decoding
        _utf8_decode: function (utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;

            while (i < utftext.length) {

                c = utftext.charCodeAt(i);

                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }

            }

            return string;
        }
    };

    var clickd_MSG_REQUIRED_FIELD = "This field is required. Please enter a value.";
    var clickd_MSG_INVALID_EMAIL_FORMAT = "Please enter a valid email address.";
    var clickd_MSG_INVALID_INPUT = "Please enter a valid value.";
    var clickd_flag = null;
    var clickd_pageType = "";
    var clickd_handlersLocation = "";
    var clickd_directory = "";

    function TextareaMaxLength(selfObj, maxLength) {
        var currentChars = clickd_jquery(selfObj).text();

        if (currentChars.length > maxLength) {
            clickd_jquery(selfObj).text(currentChars.substring(0, maxLength));
        }
    }

    function ShowOneRadio(selfObj) {
        var field = clickd_jquery(selfObj).attr("id");
        field = field.split("_")[1];
        var radios = clickd_jquery("#cont_id_f_" + field).find("input[type='radio']:checked");
        for (var i = 0; i < radios.length; i++) {
            radios[i].checked = false;
        }
        selfObj.checked = true;
    }

    function FormValid() {
        var isValid = true;

        var reqFieldList = clickd_jquery("input[name='reqField']", "#clickdimensionsForm");
        for (var i = 0; i < reqFieldList.length; i++) {
            isValid = ValidField(clickd_jquery(reqFieldList[i]));
            if (isValid == false) {
                break;
            }
        }

        return isValid;
    }

    function ValidField(hidden) {

        var fieldType = hidden.attr("alt");
        var fieldID = hidden.val();
        var fieldRequired = hidden.attr("req");

        if (typeof fieldRequired == "undefined") {
            fieldRequired = "true";
        }

        //alert(fieldRequired)

        var field = clickd_jquery("#" + fieldID);

        var wasSkipped = field.parents(".QuestionContainer:first").attr("wasSkipped");
        if (wasSkipped == "1") {
            return true;
        }

        //alert("#" + fieldID);
        var infoId = "required_info_" + fieldID;
        infoId = infoId.replace("f_upload", "f");
        var info = clickd_jquery("#" + infoId);

        var fieldString = "";
        var patternID = hidden.attr("patternID");

        var infoText = clickd_jquery(info).text();

        if (infoText != "") {
            Un_SelectNotValidInput(info, field);
        }

        if (fieldType.toLowerCase() == "textarea") {
            fieldString = clickd_jquery(field).val();
            if (fieldString.length == 1) {
                if (fieldString.charCodeAt(0) == 160) {
                    fieldString = "";
                }
            }
            //alert("fieldString = " + fieldString);
        }
        else if (fieldType.toLowerCase() == "multicheckbox") {
            var parent = clickd_jquery("#cont_id_" + fieldID);
            fieldString = clickd_jquery("input[type='checkbox']:checked", parent).val();
            if (typeof fieldString == "undefied" || fieldString == null) {
                fieldString = "";
            }
        }
        else if (fieldType.toLowerCase() == "multiradio" || fieldType.toLowerCase() == "radio") {
            var parent = clickd_jquery("#cont_id_" + fieldID);

            var checkedItemId = clickd_jquery("input[type='radio']:checked", parent).attr("id");
            var inputOther =  clickd_jquery("#OtherOption"+checkedItemId , parent)

            if(inputOther.length){
                fieldString = inputOther.val();
            }
            else{
                fieldString = clickd_jquery("input[type='radio']:checked", parent).val();
            }


            if (typeof fieldString == "undefied" || fieldString == null) {
                fieldString = "";
            }
        }
        else if (fieldType.toLowerCase() == "checkbox") {
            var parent = clickd_jquery("#cont_id_" + fieldID);
            fieldString = clickd_jquery("input[type='checkbox']:checked", parent).prop('checked') ? fieldString = "True" : fieldString = "";
            if (typeof fieldString == "undefied" || fieldString == null) {
                fieldString = "";
            }
        }

        else {
            fieldString = clickd_jquery(field).val();
        }

        if (fieldString.length > 0) {
            switch (fieldType) {
                case "Rating":
                    if (isNaN(fieldString) == true) {
                        clickd_flag = false;
                        SelectNotValidInput(info, field, clickd_MSG_INVALID_INPUT);
                        return false;
                    }
                    break;
                case "FileUpload":
                    if (fieldString.length >= 5) {
                        if (fieldString.toLowerCase().lastIndexOf(".exe") == (fieldString.length - 4)) {
                            clickd_flag = false;
                            SelectNotValidInput(info, field, "Executable files are not allowed");
                            return false;
                        }


                        if (fieldString.toLowerCase().lastIndexOf(".js") == (fieldString.length - 3)) {
                            clickd_flag = false;
                            SelectNotValidInput(info, field, "Java Script files are not allowed");
                            return false;
                        }
                    }
                    //                request = clickd_jquery.ajax({
                    //                    type: "HEAD",
                    //                    url: fieldString,
                    //                    success: function () {
                    //                        alert("Size is " + request.getResponseHeader("Content-Length"));
                    //                    }
                    //});
                    //var xxx = clickd_jquery("#f_upload_0337af73e5ae80450e184bb078e83254")[0].files[0].size
                    //alert("fSize=" + fSize);

                    //                if (clickd_jquery.browser.msie) {
                    //                    var objFSO = new ActiveXObject("Scripting.FileSystemObject");
                    //                    var sPath = field[0].value;
                    //                    var objFile = objFSO.getFile(sPath);
                    //                    var iSize = objFile.size;
                    //                }
                    //                else {
                    //                    iSize = (clickd_jquery("#flUpload")[0].files[0].size / 1024);
                    //                }

                    //                alert("iSize=" + iSize);

                    break;
                default:
                    break;
            }
        }

        //check regex validity
        var customRegex = hidden.attr("customRegex");
        if (customRegex !== null && customRegex !== "null" && fieldString.length > 0 && ((patternID != "0" && typeof patternID != "undefined") || (customRegex != "" && typeof customRegex != "undefined"))) {
            var errorMsg = hidden.attr("errorMsg");
            if (customRegex.length > 0) {

                try {
                    clickd_flag = eval(customRegex).test(fieldString);
                }
                catch (e) {
                }

                if (clickd_flag == false) {
                    SelectNotValidInput(info, field, errorMsg);
                    return clickd_flag;
                }
            }
            else {
                if (fieldType == "EmailComponent") {
                    fieldType = "Email";
                    //errorMsg = clickd_MSG_INVALID_EMAIL_FORMAT;
                }
                var regex = getPatternByFieldTypeName(fieldType);
                if (regex !== "") {
                    clickd_flag = eval(regex).test(fieldString);
                    if (clickd_flag == false) {
                        SelectNotValidInput(info, field, errorMsg);
                        return clickd_flag;
                    }
                }
            }
        }

        //filterFreeEmail
        if (fieldType.toLowerCase() == "email" && fieldString.length > 0) {
            var filterFreeEmail = hidden.attr("filterFreeEmail");
            if (typeof filterFreeEmail == "undefined") {
                filterFreeEmail = "False";
            }
            if (filterFreeEmail.toLowerCase() == "true") {
                if (new RegExp("(?!@)((gmail.com)|(hotmail.com)|(yahoo.com)|(aol.com))", "i").test(fieldString)) {
                    clickd_flag = false;
                    if (clickd_flag == false) {
                        SelectNotValidInput(info, field, errorMsg);
                        return clickd_flag;
                    }
                }
            }
        }

        if (fieldRequired == "true") {
            var requredErrorMsg = hidden.attr("requredErrorMsg");
            //alert("requredErrorMsg = " + requredErrorMsg);
            if (typeof requredErrorMsg == "undefined" || requredErrorMsg == "" || requredErrorMsg == null) {
                requredErrorMsg = clickd_MSG_REQUIRED_FIELD;
            }
            if (fieldType == "List") {
                if (fieldString == -1) {
                    clickd_flag = false;
                    SelectNotValidInput(info, field, requredErrorMsg);
                    return false;
                }
            }
            if (fieldType == "MultiCheckBox") {
                var options = clickd_jquery("#cont_id_" + fieldID).find("input[type='checkbox']:checked");
                if (options.length < 1) {
                    clickd_flag = false;
                    SelectNotValidInput(info, field, requredErrorMsg);
                    return false;
                }
            }
            else if (fieldType == "MultiRadio") {
                var options = clickd_jquery("#cont_id_" + fieldID).find("input[type='radio']:checked");
                if (options.length != 1 || (options.length === 1 && clickd_jquery.trim(fieldString).length == 0)) {
                    clickd_flag = false;
                    SelectNotValidInput(info, field, requredErrorMsg);
                    return false;
                }
            }
            else {
                if (clickd_jquery.trim(fieldString).length == 0) {
                    //if (fieldString.trim().length == 0) {
                    clickd_flag = false;
                    SelectNotValidInput(info, field, requredErrorMsg);
                    return false;
                }
            }
        }

        return true;
    }

    function getPatternByFieldTypeName(fieldType) {
        for (var i = 0; i < clickd_patternList.length; i++) {
            if (clickd_patternList[i].fieldType.toLowerCase() === fieldType.toLowerCase()) {
                return clickd_patternList[i].value;
            }
        }

        return "";
    }

    function SelectNotValidInput(info, field, message) {
        clickd_jquery(info).html(clickd_jquery(info).html() + "<div>" + message + "</div>");
        clickd_jquery(field).css("border", "1px solid #ff0000");
        clickd_jquery(info).css("height", "auto");

    }

    function Un_SelectNotValidInput(info, field) {
        clickd_jquery(info).html("&nbsp;");
        clickd_jquery(info).css("height", "6px");
        clickd_jquery(field).css("border-top", "1px solid #7c7c7c");
        clickd_jquery(field).css("border-left", "1px solid #c3c3c3");
        clickd_jquery(field).css("border-right", "1px solid #c3c3c3");
        clickd_jquery(field).css("border-bottom", "1px solid #ddd");
    }

    var clickd_preview = 0;

    function SendForm(selfObj, formID, sendPageType) {
        //alert("SendForm");
        var flag = true;
        if (sendPageType.toLowerCase() != "survey") {
            flag = FormValid();
        }
        else {
            var parent = clickd_jquery(selfObj).parents(".SplitPage:first");
            if (parent.length == 0) {
                parent = clickd_jquery("#clickdimensionsForm");
            }
            var reqFieldList = clickd_jquery("input[name='reqField']", parent);
            for (var i = 0; i < reqFieldList.length; i++) {
                flag = ValidField(clickd_jquery(reqFieldList[i]));
                if (flag == false) {
                    break;
                }
            }
        }
        if (flag) {
            if (clickd_preview == 0) {
                //clickd_jquery("#" + formID).attr("action", formAction);

                var EmailComponent = clickd_jquery(".EmailComponent").val();
                if (typeof EmailComponent != "undefined" && EmailComponent != "") {
                    clickd_jquery("#cd_visitoremail").val(EmailComponent);
                }

                clickd_jquery(":input[type=text][value!=''][dateFormat!='']").each(function (index, dateField) {
                    var dateFormat = clickd_jquery(dateField).attr("dateFormat");
                    if (dateFormat === "2" || dateFormat === "5" || dateFormat === "6") {
                        dateValue = clickd_jquery(dateField).val();
                        var dateValArr = dateValue.split("/");
                        clickd_jquery(dateField).val(dateValArr[1] + "/" + dateValArr[0] + "/" + dateValArr[2]);
                    }
                });

                clickd_jquery("input[disabled=disabled],select[disabled=disabled],textarea[disabled=disabled]").each(function (index, field) {
                    var isReplace = true;
                    var fieldValue = clickd_jquery(field).val();
                    var fieldId = clickd_jquery(field).attr("id");
                    var fieldName = clickd_jquery(field).attr("name");

                    var fieldType = clickd_jquery(field).attr("type");
                    if (fieldType == "checkbox") {
                        isReplace = clickd_jquery(field).prop("checked") ? true : false;
                    }

                    if (isReplace) {
                        clickd_jquery('<input>').attr({
                            type: 'hidden',
                            id: fieldId,
                            name: fieldName,
                            value: fieldValue
                        }).appendTo('form');

                        clickd_jquery(field).remove();
                    }
                });

                clickd_jquery("div[wasSkipped='1']").remove();
                clickd_jquery("input[name='nextPageNumberOnFirstPage']").remove();
                clickd_jquery("input[name='nextPageNumber']").remove();
                clickd_jquery("input[name='nextQuestionID']").remove();
                clickd_jquery("input[name='optionNextPageNumber']").remove();
                clickd_jquery("input[name='optionNextQuestionID']").remove();
                clickd_jquery("input[name='pageNextPageNumber']").remove();
                clickd_jquery("input[name='pagePrevPageNumber']").remove();
                clickd_jquery("input[name='skipLogicQuestionMultiRadioFieldId']").remove();
                clickd_jquery("input[name='skipLogicQuestionMultiCheckBoxFieldId']").remove();
                clickd_jquery("input[name='skipLogicQuestionListFieldId']").remove();
                clickd_jquery("input[name='skipLogicQuestionRatingFieldId']").remove();
                clickd_jquery("input[name='reqField']").remove();

                prepareInputs();
                clickd_jquery("#" + formID).submit();
                //return true;
            }
            else {
                return false;
            }
        }
    }

    function onClickPrevPage(btn) {
        clickd_jquery(btn).parents(".SplitPage:first").hide();
        clickd_jquery(btn).parents(".SplitPage:first").prev().show();
        clickd_jquery(window).scrollTop(clickd_jquery('.mainDiv').offset().top);
    }

    function onClickNextPage(btn) {
        var parent = clickd_jquery(btn).parents(".SplitPage:first");
        var isValid = true;

        var reqFieldList = clickd_jquery("input[name='reqField']", parent);
        for (var i = 0; i < reqFieldList.length; i++) {
            isValid = ValidField(clickd_jquery(reqFieldList[i]));
            if (isValid == false) {
                break;
            }
        }

        if (isValid) {
            parent.hide();
            parent.next().show();
            clickd_jquery(window).scrollTop(clickd_jquery('.mainDiv').offset().top);
        }
    }


    function WizardInit() {
        var splitPages = clickd_jquery(".SplitPage", "#clickdimensionsForm");
        //alert("numSplitPages = " + numSplitPages);
        if (splitPages.length > 0) {
            clickd_jquery(".WizardPrevButton:first", "#clickdimensionsForm").remove();
            clickd_jquery(".WizardNextButton:first", "#clickdimensionsForm").css("clear", "both");
            clickd_jquery(".WizardNextButton:first", "#clickdimensionsForm").css("float", "right");
            clickd_jquery(".SplitPage:first", "#clickdimensionsForm").show();
            clickd_jquery(".WizardPrevButton", "#clickdimensionsForm").bind("click", function () { onClickPrevPage(this); });
            clickd_jquery(".WizardNextButton", "#clickdimensionsForm").bind("click", function () { onClickNextPage(this); });
        }
    }

    function SurveyWizardInit() {
        var splitPages = clickd_jquery(".SplitPage", "#clickdimensionsForm");
        if (splitPages.length > 0) {
            clickd_jquery(".WizardPrevButton:first", "#clickdimensionsForm").remove();
            clickd_jquery(".WizardNextButton:first", "#clickdimensionsForm").css("clear", "both");
            clickd_jquery(".WizardNextButton:first", "#clickdimensionsForm").css("float", "right");
            clickd_jquery(".SplitPage:first", "#clickdimensionsForm").show();
            clickd_jquery(".WizardPrevButton", "#clickdimensionsForm").bind("click", function () { onSurveyClickPrevPage(this); });
            clickd_jquery(".WizardNextButton", "#clickdimensionsForm").bind("click", function () { onSurveyClickNextPage(this); });

            var splitPageList = clickd_jquery(".SplitPage");
            for (var i = 0; i < splitPageList.length; i++) {
                initSkipLogicGoToEvents(clickd_jquery(splitPageList[i]), 'Rating');
            }
        }
    }

    function onSurveyClickPrevPage(btn) {
        var parentSplitPage = clickd_jquery(btn).parents(".SplitPage:first");
        var pagePrevPageNumber = clickd_jquery("input[name='pagePrevPageNumber']", parentSplitPage).val();
        if (pagePrevPageNumber != "") {
            clickd_jquery("input[name='pagePrevPageNumber']", parentSplitPage).val("");
            //alert("Should to go to page number " + pagePrevPageNumber);
            clickd_jquery(parentSplitPage).hide();
            clickd_jquery(".SplitPage:eq(" + pagePrevPageNumber + ")").show();
            clickd_jquery(window).scrollTop(clickd_jquery('.mainDiv').offset().top);

        }
        else {
            //alert("regular prev page");
            clickd_jquery(btn).parents(".SplitPage:first").hide();
            clickd_jquery(btn).parents(".SplitPage:first").prev().show();
            clickd_jquery(window).scrollTop(clickd_jquery('.mainDiv').offset().top);
        }
    }

    function onSurveyClickNextPage(btn) {
        var isValid = true;
        var parentSplitPage = clickd_jquery(btn).parents(".SplitPage:first");

        var reqFieldList = clickd_jquery("input[name='reqField']", parentSplitPage);
        for (var i = 0; i < reqFieldList.length; i++) {
            isValid = ValidField(clickd_jquery(reqFieldList[i]));
            if (isValid == false) {
                break;
            }
        }

        if (isValid) {

            //var nextPageNumber = clickd_jquery('input[name="nextPageNumber"][value!=0][value!=""]:first', parentSplitPage);
            var nextPageNumbers = parentSplitPage.find('input[name="nextPageNumber"]');
            var value, nextPageNumber;
            for (var i = 0; i < nextPageNumbers.length; i++) {
                value = clickd_jquery(nextPageNumbers[i]).prop("value");
                if (value != "0" && value != "") {
                    nextPageNumber = clickd_jquery(nextPageNumbers[i]);
                    break;
                }
            }

            if (typeof nextPageNumber !== "undefined" && nextPageNumber.length > 0) {
                var nextQuestionID = clickd_jquery(nextPageNumber).next();
                goToPageNumberQuestionID(clickd_jquery(nextPageNumber).val(), clickd_jquery(nextQuestionID).val(), parentSplitPage);
                //alert("1 Should go to nextPageNumber=" + clickd_jquery(nextPageNumber).val() + " to question " + clickd_jquery(nextQuestionID).val());
            }
            else {
                var pageNextPageNumber = 0;
                var splitPageList = clickd_jquery(".SplitPage");
                var parentSplitPageIndex = splitPageList.index(parentSplitPage);

                //var parentSplitPageIndex = clickd_jquery(parentSplitPage).index(".SplitPage", "#clickdimensionsForm");

                //alert("parentSplitPageIndex = " + parentSplitPageIndex);

                if (parentSplitPageIndex === 0) {
                    //first page next page number
                    //pageNextPageNumber = clickd_jquery('input[name="nextPageNumberOnFirstPage"][value!="0"][value!=""]:first');
                    var nextPageNumbers = clickd_jquery('input[name="nextPageNumberOnFirstPage"]');
                    var value;
                    for (var i = 0; i < nextPageNumbers.length; i++) {
                        value = clickd_jquery(nextPageNumbers[i]).prop("value");
                        if (value != "0" && value != "") {
                            pageNextPageNumber = clickd_jquery(nextPageNumbers[i]);
                            break;
                        }
                    }
                }
                else {
                    //wizard page number
                    //pageNextPageNumber = clickd_jquery('input[name="pageNextPageNumber"][value!="0"][value!=""]:first', parentSplitPage);
                    var nextPageNumbers = parentSplitPage.find('input[name="pageNextPageNumber"]');
                    var value;
                    for (var i = 0; i < nextPageNumbers.length; i++) {
                        value = clickd_jquery(nextPageNumbers[i]).prop("value");
                        if (value != "0" && value != "") {
                            pageNextPageNumber = clickd_jquery(nextPageNumbers[i]);
                            break;
                        }
                    }
                }
                //alert("pageNextPageNumber = " + pageNextPageNumber);


                if (typeof pageNextPageNumber !== "undefined" && pageNextPageNumber.length > 0) {
                    //alert("Should go to pageNextPageNumber=" + clickd_jquery(pageNextPageNumber).val() + " and to show all questions");
                    goToPageNumberQuestionID(clickd_jquery(pageNextPageNumber).val(), 0, parentSplitPage);
                    return;
                }
                else {
                    //alert("simple next page");
                    parentSplitPage.hide();

                    var nextPage = parentSplitPage.next();
                    //show all question and titles
                    clickd_jquery("tr", nextPage).show();
                    clickd_jquery(".emptyRow", nextPage).hide();
                    clickd_jquery(".QuestionContainer", nextPage).show();
                    clickd_jquery(".QuestionTitleContainer", nextPage).show();
                    //remove wasSkipped attribute
                    clickd_jquery(".QuestionContainer", nextPage).removeAttr("wasSkipped");
                    clickd_jquery(nextPage).show();
                    clickd_jquery(window).scrollTop(clickd_jquery('.mainDiv').offset().top);
                }
                //}
            }
        }
    }


    function resetSkipedQuestinsValues(questionContainer) {
        //checkbox
        clickd_jquery("input[type='checkbox']", questionContainer).prop("checked", false);

        //stars
        clickd_jquery("input[name='nextPageNumber']", questionContainer).val("");
        clickd_jquery("input[name='nextQuestionID']", questionContainer).val("");
        clickd_jquery(".ui-stars-star", questionContainer).removeClass("ui-stars-star-on");
        clickd_jquery("input[name='selrate']", questionContainer).val(0);

        //radio
        clickd_jquery("input[type='radio']", questionContainer).prop("checked", false);

        //TextArea
        clickd_jquery("textarea", questionContainer).text("");

        //List
        clickd_jquery("select", questionContainer).val("");
        clickd_jquery("select", questionContainer).val("0");

        //TextBox
        clickd_jquery("input[type='text']", questionContainer).val("");
    }


    function goToPageNumberQuestionID(pageNumber, questionID, currPage) {
        //alert("pageNumber = " + pageNumber + " questionID = " + questionID);
        clickd_jquery(currPage).hide();
        var nextPage = clickd_jquery(".SplitPage:eq(" + pageNumber + ")");

        var splitPageList = clickd_jquery(".SplitPage");
        var currPageindex = splitPageList.index(currPage);
        var nextPageindex = splitPageList.index(nextPage);

        //set wasSkipped attribute to all skiped questions
        var skiptedPageList = clickd_jquery(".SplitPage:gt(" + currPageindex + "):lt(" + (nextPageindex - 1) + ")"); //(nextPageindex - 1) should not include the last page, BETWEEN needs
        var skiptedQuestionList = clickd_jquery(".QuestionContainer", skiptedPageList).attr("wasSkipped", 1);

        //reset values
        resetSkipedQuestinsValues(skiptedQuestionList);

        if (questionID != 0 && questionID != "0" && questionID != "" && typeof questionID != "undefined") {
            //alert("Should to go to page number " + pageNumber + " question id " + questionID);
            var questionContainer = clickd_jquery("#cont_id_f_" + questionID);
            var showQuestionRealIndex = questionContainer.attr("questionIndex");
            var questionTitleContainer = clickd_jquery("#cont_title_id_f_" + questionID);
            var showQuestionTitleRealIndex = questionTitleContainer.attr("questionIndex");

            //show all questions and titles
            clickd_jquery("tr", nextPage).show();
            clickd_jquery(".emptyRow", nextPage).hide();
            clickd_jquery(".QuestionContainer", nextPage).show();
            clickd_jquery(".QuestionTitleContainer", nextPage).show();
            //remove wasSkipped attribute
            clickd_jquery(".QuestionContainer", nextPage).removeAttr("wasSkipped");

            var lastSkipedQuestion = null;
            var showQuestion = null;
            clickd_jquery(".QuestionContainer[questionIndex]", nextPage).each(function (index, question) {
                var questionRealIndex = clickd_jquery(question).attr("questionIndex");
                //alert("questionRealIndex=" + questionRealIndex);
                if (parseInt(questionRealIndex) < parseInt(showQuestionRealIndex)) {
                    //set attribute wasSkipped to all skiped questions
                    clickd_jquery(question).attr("wasSkipped", 1);

                    //reset values
                    resetSkipedQuestinsValues(question);

                    lastSkipedQuestion = question;
                    //removed couse of hiding all prev rows
                    clickd_jquery(question).hide();
                }
                else if (parseInt(questionRealIndex) == parseInt(showQuestionRealIndex)) {
                    showQuestion = question;
                }
            });

            //check if in same row
            var lastSkipedQuestionTr = clickd_jquery(lastSkipedQuestion).parents("tr");
            var questionContainerTr = clickd_jquery(showQuestion).parents("tr");
            var lastSkipedWuestionTrIndex = clickd_jquery(lastSkipedQuestionTr).index("tr", nextPage);
            var questionContainerTrIndex = clickd_jquery(questionContainerTr).index("tr", nextPage);

            if (lastSkipedWuestionTrIndex !== questionContainerTrIndex) {
                //hide parent tr and all previouse tr
                clickd_jquery(lastSkipedQuestion).parents("tr").hide().prevAll().hide();
            }
            else {
                clickd_jquery(lastSkipedQuestion).parents("tr").prevAll().hide();
                //show title
                questionContainerTr.prev().show();
            }

            clickd_jquery(".QuestionTitleContainer[questionIndex]", nextPage).each(function (index, questionTitle) {
                var questionTitleRealIndex = clickd_jquery(questionTitle).attr("questionIndex");
                //alert("questionRealIndex=" + questionRealIndex);
                if (parseInt(questionTitleRealIndex) < parseInt(showQuestionTitleRealIndex)) {
                    //hide title
                    //reset values
                    resetSkipedQuestinsValues(questionTitle);
                    clickd_jquery(questionTitle).hide();
                }
            });

            /*****************************************/
            //hide empty tr
            //        var trList = clickd_jquery("tr", nextPage);
            //        for (var tr = 0; tr < trList.length; tr++) {
            //            var tdList = clickd_jquery("td", trList[tr]);
            //            var emptyColspanCount = 0;
            //            for (var td = 0; td < tdList.length; td++) {
            //                var colSpan = clickd_jquery(tdList[td]).attr("colSpan");
            //                var tdContent = clickd_jquery(tdList[td]).html();
            //                if (tdContent.length < 10) {
            //                    emptyColspanCount += parseInt(clickd_jquery(tdList[td]).attr("colSpan"));
            //                }
            //            }

            //            alert("emptyColspanCount = " + emptyColspanCount);
            //        }
            /****************************************/
        }
        else {
            //alert("Should to go to page number " + pageNumber + " and show all questions");
            //show all questions and titles
            clickd_jquery("tr", nextPage).show();
            clickd_jquery(".emptyRow", nextPage).hide();
            clickd_jquery(".QuestionContainer", nextPage).show();
            clickd_jquery(".QuestionTitleContainer", nextPage).show();
            //remove wasSkipped attribute
            clickd_jquery(".QuestionContainer", nextPage).removeAttr("wasSkipped");
        }

        clickd_jquery("input[name='pagePrevPageNumber']", nextPage).val(currPageindex);
        nextPage.show();
        clickd_jquery(window).scrollTop(clickd_jquery('.mainDiv').offset().top);
    }

    function setSkipLogicGoToData(nextPageNumber, nextQuestionID, sourceElement) {
        var parentStarsDiv = clickd_jquery(sourceElement).parents(".QuestionContainer:first");
        clickd_jquery("input[name='nextPageNumber']", parentStarsDiv).val(nextPageNumber);
        clickd_jquery("input[name='nextQuestionID']", parentStarsDiv).val(nextQuestionID);
    }

    /*stars control*/
    function initSkipLogicGoToEvents(parentSplitPage, controlType) {
        clickd_jquery("input[name='skipLogicQuestion" + controlType + "FieldId']", parentSplitPage).each(function (index, skipLogicQuestion) {
            var parentStarsDiv = clickd_jquery(skipLogicQuestion).parents(".QuestionContainer:first");
            var optionNextPageNumberList = clickd_jquery("input[name='optionNextPageNumber']", parentStarsDiv);
            var optionNextQuestionIDList = clickd_jquery("input[name='optionNextQuestionID']", parentStarsDiv);

            if (controlType.toLowerCase() == "rating") {
                clickd_jquery(".ui-stars-star", parentStarsDiv).each(function (startIndex, star) {
                    var nextPageNumber = clickd_jquery(optionNextPageNumberList[startIndex]).val();
                    var nextQuestionID = clickd_jquery(optionNextQuestionIDList[startIndex]).val();
                    clickd_jquery(star).bind("click", function () { setSkipLogicGoToData(nextPageNumber, nextQuestionID, this); return false; });
                });
                var starsReset = clickd_jquery(".ui-stars-cancel", parentStarsDiv);
                clickd_jquery(starsReset).bind("click", function () { setSkipLogicGoToData("", "", this); return false; });
            }
        });
    }

    function skipLogicOnChange(sourceElement, controlType) {
        var parentQuestionContainer = clickd_jquery(sourceElement).parents(".QuestionContainer:first");
        var skipLogicQuestionFieldId = clickd_jquery("input[name='skipLogicQuestion" + controlType + "FieldId']", parentQuestionContainer);

        var optionNextPageNumberList = clickd_jquery("input[name='optionNextPageNumber']", parentQuestionContainer);
        var optionNextQuestionIDList = clickd_jquery("input[name='optionNextQuestionID']", parentQuestionContainer);

        var selectedIndex = 0;
        if (controlType.toLowerCase() == "list") {
            selectedIndex = clickd_jquery('select option:selected', parentQuestionContainer).index();

        }
        if (controlType.toLowerCase() == "multicheckbox") {
            var selectedCheckbox = clickd_jquery("input[type='checkbox']:checked:first", parentQuestionContainer);
            //selectedIndex = clickd_jquery(selectedCheckbox).index("input[type='checkbox']", parentQuestionContainer);
            selectedIndex = clickd_jquery("input[type='checkbox']", parentQuestionContainer).index(selectedCheckbox);
        }
        if (controlType.toLowerCase() == "multiradio") {
            var selectedRadio = clickd_jquery("input[type='radio']:checked:first", parentQuestionContainer);
            //selectedIndex = clickd_jquery(selectedRadio).index("input[type='radio']", parentQuestionContainer);
            selectedIndex = clickd_jquery("input[type='radio']", parentQuestionContainer).index(selectedRadio);
        }

        var nextPageNumber = clickd_jquery(optionNextPageNumberList[selectedIndex]).val();
        var nextQuestionID = clickd_jquery(optionNextQuestionIDList[selectedIndex]).val();
        setSkipLogicGoToData(nextPageNumber, nextQuestionID, sourceElement);
    }

    var clickd_patternList = [];
    function setPatternList(patternArrayList) {
        clickd_patternList = patternArrayList;
    }


    function RequestQueryString(name) {
        var match = RegExp('[?&]' + name + '=([^&]*)')
                        .exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    }

    function getFormProperties() {
        var properties = {};
        var firstSplitPage = clickd_jquery(".SplitPage", "#clickdimensionsForm");
        var width, height;
        if (firstSplitPage.length > 0) {
            properties.height = 0;
            for (var page = 0; page < firstSplitPage.length; page++) {
                properties.width = clickd_jquery(firstSplitPage[page]).width();
                if (clickd_jquery(firstSplitPage[page]).height() > properties.height) {
                    properties.height = clickd_jquery(firstSplitPage[page]).height();
                }
            }
        }
        else {
            properties.width = clickd_jquery("#clickdimensionsForm").width();
            properties.height = clickd_jquery("#clickdimensionsForm").height();
        }

        properties.height += 60;
        return properties;
    }


    function toggleProgressPanel(visible) {
        if (visible) {
            var properties = getFormProperties();
            clickd_jquery("body").append(
                "<div id=\"progressBar\" style=\"width:" + properties.width + "px; height:" + properties.height + "px\"><div id=\"progressBarInner\" style=\"left:" + ((properties.width / 2) - 16) + "px; top:" + ((properties.height / 2) - 26) + "px;\"><div><img style=\"width:32px; height:32px\" src=\"https://az124611.vo.msecnd.net/web/v6/images/progress.gif\"/></div><div>Loading...</div></div></div>"
            );
        }
        else {
            clickd_jquery("#progressBar").remove();
        }
    }

    function setFunnelFieldProperties(entityName, entry, value, isMapped) {
        if (isMapped) {
            clickd_jquery("input[type!='checkbox'][" + entityName + "Field='" + entry + "']").val(value);
        }
        else {
            clickd_jquery("#f_" + entry).val(value);
        }

        var bValue = (value.toLowerCase() === 'true' || value.toLowerCase() === 'on');
        if (isMapped) {
            clickd_jquery("input[type='checkbox'][" + entityName + "Field='" + entry + "']").prop("checked", bValue);
            clickd_jquery("input[type='radio'][name='" + entry + "'][value='" + value  + "']").prop("checked", true);
        }
        else {
            clickd_jquery("#f_" + entry).prop("checked", bValue);
        }

        if (isMapped) {
            clickd_jquery("textarea[" + entityName + "Field='" + entry + "']").val(value);
            clickd_jquery("select[" + entityName + "Field='" + entry + "']").val(value);
        }
        else {
            clickd_jquery("#f_" + entry).val(value);
        }
    }

    function getFunnelFieldValue(entityName, value, entry, isMapped) {
        var dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}\s\d{1,2}\:\d{1,2}:\d{1,2}\s\w{2}clickd_jquery/;
        var isDate = dateRegex.test(value);
        //alert("isDate = " + isDate);
        if (isDate == true) {
            var dateValue = new Date(value);
            var month = (dateValue.getMonth() + 1);
            var day = dateValue.getDate();
            var year = dateValue.getFullYear();
            if (month < 10) {
                month = "0" + month;
            }
            if (day < 10) {
                day = "0" + day;
            }

            var dateField = null;
            if (isMapped) {
                dateField = clickd_jquery("input[type!='checkbox'][" + entityName + "Field='" + entry + "']");
            }
            else {
                dateField = clickd_jquery("#f_" + entry);
            }

            if (dateField.hasClass("Date")) {
                value = day + '/' + month + '/' + year;
            }
            if (dateField.hasClass("DateTime")) {
                var minutes = dateValue.getMinutes();
                var hours = dateValue.getHours();
                if (minutes < 10) {
                    minutes = "0" + minutes;
                }
                if (hours < 10) {
                    hours = "0" + hours;
                }
                value = day + '/' + month + '/' + year + " " + hours + ":" + minutes;
            }
        }
        return value;
    }

    function setFunnelProperties(data) {

        var entityName = "";
        for (var entry in data) {
            if (entry.toLowerCase() == "entityname") {
                entityName = data[entry];
            }
            else if (entry.toLowerCase() == "unmapped") {
                var unMappedData = data[entry];
                for (var unMappedEntry in unMappedData) {
                    var value = getFunnelFieldValue("", unMappedData[unMappedEntry], unMappedEntry, false);
                    setFunnelFieldProperties("", unMappedEntry, value, false);
                }
            }
            else {
                var value = getFunnelFieldValue(entityName, data[entry], entry, true);
                setFunnelFieldProperties(entityName, entry, value, true);
            }
        }
    }

    function onFieldKeyPress(e) {
        // look for window.event in case event isn't passed in
        if (typeof e == 'undefined' && window.event) { e = window.event; }
        if (e.keyCode == 13) {
            //debugger;

            var captcha = clickd_jquery("#Slider");
            if (captcha.length > 0) {
                var left = captcha.css("left");
                left = left.replace("px", "");
                if (isNaN(left)) {
                    return false;
                }
            }
            return SendForm(this, "clickdimensionsForm", clickd_pageType);
        }

        return true;
    }

    function initForm() {
        //tbd remove, just for test
        //debugger;
        //getFormProperties();

        var visitorEmail = RequestQueryString("_clde");
        if (!visitorEmail || typeof visitorEmail == "undefined") {
            visitorEmail = RequestQueryString("_cldee");
            if (!visitorEmail || typeof visitorEmail == "undefined") {
                visitorEmail = '';
            } else {
                // decrypt
                visitorEmail = Base64.decode(unescape(visitorEmail));
            }
        }

        if (clickd_pageType.toLowerCase() == "subscription" && clickd_preview == 0 && visitorEmail != "") {
            toggleProgressPanel(true);
        }

        clickd_jquery(".EmailComponent").val(visitorEmail);

        if (clickd_directory == "") {
            clickd_directory = "https://az124611.vo.msecnd.net/web/v6/";
        }

        clickd_jquery.getJSON(clickd_directory + "PatternList.js?callback=?");
        //clickd_jquery.getJSON("http://127.0.0.1:81/mscrm/pages/designer/" + "js/PatternList.js?callback=?");

        if (clickd_pageType != "" && clickd_preview == 0 && visitorEmail != "") {

            if (clickd_handlersLocation == "") {
                clickd_handlersLocation = "http://webanalytics.cloudapp.net";
            }

            if (clickd_pageType.toLowerCase() == "subscription" && clickd_handlersLocation != "") {
                clickd_jquery.getJSON(clickd_handlersLocation + "/subscription.srv/?accountKey=" + clickd_jquery("#cd_accountkey").val() + "&email=" + visitorEmail + "&jsoncallback=?",
                    function (data) {
                        //var data = { "3c5991d4e87ee111ac221cc1dee8ea59": "True", "feb16c035d89e111bbc71cc1dee8aa5f": "True"};

                        for (var entry in data) {
                            var value = data[entry];
                            var bValue = (value.toLowerCase() === 'true');
                            clickd_jquery("#f_" + entry).prop("checked", bValue);
                        }

                        toggleProgressPanel(false);
                    });
            }
        }
    }

    function FitSize(){
    }

    function SetFormResizable(){
    }
