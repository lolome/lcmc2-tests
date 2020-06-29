/*
 * -----------------------------------------
 *  Day Class
 * - - - - - - - - - - - - - - - - - - - - -
 *  version: 1.1
 *  date: June 2020
 *  authors: Hugues Leroy, Laurent Mercier
 *  licence: 'XXX'
 * - - - - - - - - - - - - - - - - - - - - -
 *  required
 * - - - - - - - - - - - - - - - - - - - - -
*/

import {
  CODES,
  NAMES
} from './constants';

import DayRange from './day-range';
import { padStart } from '@/utils/pad';

/*
 * -----------------------------------------
 *  export Class
 * - - - - - - - - - - - - - - - - - - - - -
 */
export default class Day {
  // Usage: direct construct takes 1 argument:
  // either a Date, or another Day instance,
  // or a Day.tag() string.
  // new Day('2018-01-01') || new Day(new Date()) || new Day(someDay)
  // Each instance provides a tag string:
  // we can compare instances by tags.
  // – day1.tag == day2.tag
  // – day3.tag > day4.tag
  // Each instance provides RELATIVE methods,
  // returning another day or a range of days (DayRange instance),
  // starting from `this`.
  // - day1.forward(1, 'DAY') || day1.back(1, 'WEEK') || day1.tomorrow()
  // - day1.startOf('MONTH') || day1.endOf('QUARTER')
  // - day1.relative('WEEK') || day1.next('YEAR')
  // Relative methods are implemented at Class level,
  // where they're delegated to today's Day instance:
  // - Day.tomorrow().tag === Day.today().tomorrow().tag
  // - Day.current('WEEK').tag === Day.today().relative('WEEK').tag
  // Day provides no static parse() method.
  // DayRange class has a generic one,
  // returning either a Day instance, a DayRange instance,
  // or null -- the case being.

  constructor (arg) {
    // this.date = new Date();

    if (arg instanceof Day) {
      this.date = arg.date;
    } else if (arg instanceof Date) {
      this.date = arg;
    } else if (typeof arg === 'string') {
      const m = arg.match(/(\d{4})-(\d{2})-(\d{2})/i);
      if (m !== null) {
        this.date = new Date(parseInt(m[1]), parseInt(m[2] - 1), parseInt(m[3]));
      }
    } else {
      this.date = Day.newYorkDate();
    }

    this.update();
  }

  /*
   * -----------------------------------------
   *  static methods
   * - - - - - - - - - - - - - - - - - - - - -
   */
  static newYorkDate () {
    // Returns time in NYC.
    // As for now, we don't want to deal with a full-fledged js library
    // NOTE: For future devs,
    // check Luxon: https://moment.github.io/luxon/index.html

    const est = '-5';
    // In the northern parts of the time zone,
    // on the second Sunday in March, at 2:00 a.m. EST,
    // clocks are advanced to 3:00 a.m.
    // EDT leaving a one-hour "gap".
    // On the first Sunday in November, at 2:00 a.m. EDT,
    // clocks are moved back to 1:00 a.m. EST,
    // thus "duplicating" one hour.

    // create Date object for current location
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);

    // create new Date object for EST time
    const naiveDate = new Date(utc + (1 * 60 * 60 * 1000 * est));
    // console.log(naiveDate);
    const naiveDay = new Day(naiveDate);
    // Now, proceed to EDT ajustement, if required
    const year = naiveDay.relative('YEAR');
    // console.log(year);
    // console.log(year.pickMonth('March'));

    const summer = new DayRange(
      year.pickMonth('March').findNthDay('Sunday', 2),
      year.pickMonth('November').findNthDay('Sunday', 1)
    );

    if ((summer.begin.tag === naiveDay.tag && naiveDate.getHours > 1) ||
      (summer.end.tag === naiveDay.tag && naiveDate.getHours < 1)) {
      // EDT adjustments? 1st,
      // check if we're at the beginning or the end of summer.
      // Note that our ref is always EST
      naiveDay.date.setTime(naiveDay.date.getTime() + (1 * 60 * 60 * 1000));
    } else if (summer.encompasses(naiveDay)) {
      // Otherwise, just check that we're into summer or not.
      naiveDay.date.setTime(naiveDay.date.getTime() + (1 * 60 * 60 * 1000));
    }

    return naiveDay.date;
  }

  static buildFrom (year, month, day) {
    // Used internally, esp. by parsing methods in DayRange.
    // Makes sure of correct handling of leading zeroes.
    return new Day(`${padStart(year)}-${padStart(month)}-${padStart(day)}`);
  }

  // DELEGATIONS:
  // Direct calls to Class are delegated to a new Day.today() instance
  // So we may call, for example:
  // Day.last('WEEK') instead of Day.today().last('WEEK')

  static today () {
    return new Day();
  }

  static tomorrow () {
    return Day.today().tomorrow();
  }

  static yesterday () {
    return Day.today().yesterday();
  }

  static startOf (span) {
    return Day.today().startOf(span);
  }

  static endOf (span) {
    return Day.today().endOf(span);
  }

  static current (span) {
    // console.log(span);
    // we match Class 'current' to Instance 'relative', for semantics
    // so class Day.current('WEEK') == Day.today().relative('WEEK')
    // console.log(Day.today());
    // console.log(Day.today().relative('WEEK'));
    return Day.today().relative(span);
  }

  static last (span) {
    // Day.last('YEAR'), Day.last('WEEK'), etc.
    // return Day.today().startOf(span).back(1, span).relative(span);
    return Day.today().last(span);
  }

  static next (span) {
    // Day.next('YEAR'), Day.next('WEEK'), etc.
    return Day.today().next(span);
    // return Day.today().startOf(span).back(1,span).relative(span);
  }

  // Subclassing DayRange.class through Day.range
  static Range = DayRange;

  /*
   * -----------------------------------------
   *  instance methods
   * - - - - - - - - - - - - - - - - - - - - -
   */

  update () {
    // Discard any timestamps
    this.date = new Date(this.date.setHours(0, 0, 0, 0));
    // Tag format
    const y = this.date.getFullYear();
    const m = (this.date.getMonth() + 1);
    const d = this.date.getDate();
    this.tag = `${y}-${(m < 10 ? '0' : '') + m}-${(d < 10 ? '0' : '') + d}`;
  }

  today () {
    return this;
  }

  tomorrow () {
    return this.forward();
  }

  yesterday () {
    return this.back();
  }

  code () {
    return CODES.DAY[this.date.getDay()];
  }

  strftime (template) {
    // Basic formatting options
    // THAT'S THE ONLY ONES WE USE!!!

    // FORMAT DIRECTIVES:

    // %Y -> Year with century
    // %y -> two last digits of year

    // %S -> Financial Semester, with year digits (ie '1H18')
    // %s -> Financiel Semester (ie '1H')

    // %Q -> Financial Quarter, with year digits (ie 'Q118')
    // %q -> Financiel Quarter (ie 'Q1')

    // %F -> Financial Month, with year digits (ie 'F18')
    // %f -> Financial Month (ie 'F')

    // %m -> Month of the year, zero-padded (01..12)
    // %-m -> no-padded (1..31)

    // %B -> The full month name ('January')
    // %^B -> uppercased ('JANUARY')
    // %b -> The abbreviated month name ('Jan')
    // %^b -> uppercased (``JAN'')

    // %d -> Day of the month, zero-padded (01..31)
    // %-d -> no-padded (1..31)

    // %A -> The full weekday name ('Sunday')
    // %^A -> uppercased ('SUNDAY')
    // %a -> The abbreviated name ('Sun')
    // %^a -> uppercased ('SUN')

    const monthNames = NAMES.MONTH;
    const dayNames = NAMES.DAY;

    return template
      .replace(/%Y/g, String(this.tagYear()))
      .replace(/%y/g, this.getCodeOfRelative('YEAR'))

      .replace(/%S/g, this.getCodeOfRelative('SEMESTER', '+Year'))
      .replace(/%s/g, this.getCodeOfRelative('SEMESTER'))

      .replace(/%Q/g, this.getCodeOfRelative('QUARTER', '+Year'))
      .replace(/%q/g, this.getCodeOfRelative('QUARTER'))

      .replace(/%F/g, this.getCodeOfRelative('MONTH', '+Year'))
      .replace(/%s/g, this.getCodeOfRelative('MONTH'))

      .replace(/%-m/g, this.tagMonth()
        .toString())
      .replace(/%m/g, padStart(this.tagMonth())) // n1th
      .replace(/%\^B/g, monthNames[this.tagMonth() - 1]
        .toUpperCase()) // n0th
      .replace(/%B/g, monthNames[this.tagMonth() - 1]) // n0th
      .replace(/%\^b/g, (monthNames[this.tagMonth() - 1])
        .slice(0, 3).toUpperCase()) // n0th
      .replace(/%b/g, (monthNames[this.tagMonth() - 1])
        .slice(0, 3)) // n0th

      .replace(/%-d/g, this.tagDay()
        .toString())
      .replace(/%d/g, padStart(this.tagDay()))
      .replace(/%\^A/g, dayNames[this.date.getDay()]
        .toUpperCase())
      .replace(/%A/g, dayNames[this.date.getDay()])
      .replace(/%\^a/g, dayNames[this.date.getDay()]
        .slice(0, 3).toUpperCase())
      .replace(/%a/g, dayNames[this.date.getDay()]
        .slice(0, 3));
  }

  tagYear () {
    return parseInt(this.tag.slice(0, 4));
  }

  tagMonth () {
    return parseInt(this.tag.slice(5, 7));
  }

  tagDay () {
    return parseInt(this.tag.slice(8, 10));
  }

  forward (n = 1, span = 'DAY') {
    // (each of the below returns a NEW instance)

    // let newdate = new Date(Date.UTC(this.tagYear(),this.tagMonth()-1,this.tagDay()));
    // (Won't work: the UTC date in UTC might differ from the given input)

    const absoluteDate = new Date(this.tagYear(), this.tagMonth() - 1, this.tagDay());

    // NOTE: months in javascript Dates are zero-indexed

    if (n !== 0) {
      // zero increments are possible,
      // and should return a copy of the input date
      switch (span) {
        case 'DAY':
          absoluteDate.setDate(absoluteDate.getDate() + n);
          break;
        case 'WEEK':
          absoluteDate.setDate(absoluteDate.getDate() + n * 7);
          break;
        case 'MONTH':
          absoluteDate.setMonth(absoluteDate.getMonth() + n);
          break;
        case 'QUARTER':
          absoluteDate.setMonth(absoluteDate.getMonth() + n * 3);
          break;
        case 'SEMESTER':
          absoluteDate.setMonth(absoluteDate.getMonth() + n * 6);
          break;
        case 'YEAR':
          absoluteDate.setMonth(absoluteDate.getMonth() + n * 12);
          break;
      }
    }

    return new Day(absoluteDate);
  }

  back (n = 1, span = 'DAY') {
    return this.forward(-n, span);
  }

  toHumanName () {
    if (this.tag === Day.today().tag) {
      return 'today';
    }

    if (this.tag === Day.tomorrow().tag) {
      return 'tomorrow';
    }

    if (this.tag === Day.yesterday().tag) {
      return 'yesterday';
    }

    // otherwise
    return this.strftime('%b %d, %Y');
  }

  getCodeOfRelative (span, addYearCode = '') {
    const yearCode = (addYearCode === '' ? '' : this.getCodeOfRelative('YEAR'));
    // a Day instance belongs to multiple intervals:
    // month, quarter, etc.
    // the below returns the correct financial code for a specified interval.
    switch (span) {
      case 'MONTH':
        return CODES.MONTH[this.date.getMonth()] + yearCode;
      case 'QUARTER':
        return CODES.QUARTER[Math.trunc(this.date.getMonth() / 3)] + yearCode;
      case 'SEMESTER':
        return CODES.SEMESTER[Math.trunc(this.date.getMonth() / 6)] + yearCode;
      case 'YEAR':
        return this.date.getFullYear().toString().slice(2);
    }
    // default
    return '';
  }

  getNameOfRelative (span) {
    switch (span) {
      case 'MONTH':
        return NAMES.MONTH[this.date.getMonth()];
      case 'DAY':
        return NAMES.DAY[this.date.getDay()];
    }
    // default
    return '';
  }

  name () {
    return this.getNameOfRelative('DAY');
  }

  monthName () {
    return this.getNameOfRelative('MONTH');
  }

  // RELATIVE REQUESTS
  // (computing a new Day, starting from the instance's date)

  startOf (span) {
    switch (span) {
      case 'DAY':
        return new Day(this.tag);
      case 'WEEK':
      // we start on Monday (index 1 in JS)
        return this
          .back([6, 0, 1, 2, 3, 4, 5][this.date.getDay()], 'DAY');
      case 'COMMERCIAL_WEEK':
      // we start on Monday (index 1 in JS)
        return this
          .back([6, 0, 1, 2, 3, 4, 5][this.date.getDay()], 'DAY');
      case 'MONTH':
        return new Day(this.tag.slice(0, 8) + '01');
      case 'QUARTER':
        return this.startOf('MONTH')
          .back([0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2][this.date.getMonth()], 'MONTH');
      case 'SEMESTER':
        return this.startOf('MONTH')
          .back([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5][this.date.getMonth()], 'MONTH');
      case 'YEAR':
        return new Day(this.tag.slice(0, 5) + '01-01');
    }
  }

  endOf (span) {
    switch (span) {
      case 'DAY':
        return new Day(this.tag);
      case 'WEEK':
      // we end on Sunday (index 0 in JS)
        return this.forward([0, 6, 5, 4, 3, 2, 1][this.date.getDay()], 'DAY');
      case 'COMMERCIAL_WEEK':
      // we end on Friday (index 5 in JS)
        return this.forward([-2, 4, 3, 2, 1, 0, -1][this.date.getDay()], 'DAY');
      case 'MONTH':
        return this.startOf('MONTH').forward(1, 'MONTH').back(1, 'DAY');
      case 'QUARTER':
        return this.startOf('QUARTER').forward(1, 'QUARTER').back(1, 'DAY');
      case 'SEMESTER':
        return this.startOf('SEMESTER').forward(1, 'SEMESTER').back(1, 'DAY');
      case 'YEAR':
        return new Day(this.tag.slice(0, 5) + '12-31');
    }
  }

  // RELATIVE DAYRANGES
  // d.relative('WEEK'), d.relative('MONTH')...
  // Note that relative() matches current() as a Class method:
  // Day.current('WEEK') == Day.today().relative('WEEK')

  relative (span) {
    if (span === 'DAY') {
      return this;
    }
    return new DayRange(this.startOf(span), this.endOf(span));
  }

  next (span) {
    // return this.startOf(span).forward(1,span).relative(span);
    return this.forward(1, span).relative(span);
  }

  last (span) {
    // return this.startOf(span).back(1,span).relative(span);
    return this.back(1, span).relative(span);
  }

  spansWith (other, rangeType, extended = '') {
    // Compares two dates to see if they cover a given range.
    // extended attr. deals with successive spans (ie a range covering two weeks)
    // Usage:
    // -> d1.spansWith(d2,'WEEK');
    // (d1 and d2 span one full week)
    // -> d1.spansWith(d2,'MONTH','+');
    // (d1 and d2 span a range of mthes, such as Jan19/Feb19)
    if (extended !== '') {
      return (this.tag === this.startOf(rangeType).tag &&
      other.tag === other.endOf(rangeType).tag);
    } else {
      return (this.tag === this.startOf(rangeType).tag &&
      other.tag === this.endOf(rangeType).tag);
    }
  }
}
