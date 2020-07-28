/*
 * -----------------------------------------
 *   DayRange Class
 * - - - - - - - - - - - - - - - - - - - - -
 *  version: 1.2
 *  date: July 2020
 *  authors: Hugues Leroy, Laurent Mercier
 *  licence: 'XXX'
 * - - - - - - - - - - - - - - - - - - - - -
 *  required
 * - - - - - - - - - - - - - - - - - - - - -
 */

import { CODES, NAMES, zeroPad } from './shared';
import Day from './day';

/*
 * -----------------------------------------
 *  export Class
 * - - - - - - - - - - - - - - - - - - - - -
 */
export default class DayRange {
  // Usage:
  // Direct construct takes 3 arguments types:
  //  1. Day tags as strings, 'YYYY-MM-DD' format,
  //  2. DayRange tags as strings, 'YYYY-MM-DD, YYYY-MM-DD' format,
  //  3. Day() instances.
  // 1 arg given will generate a one-day range. No args given will default to the current month.
  // For anything more complex, we'll resort to DayRange::parse()
  constructor (...args) {
    switch (args.length) {
      case 2:
        this.begin = new Day(args[0]);
        this.end = new Day(args[1]);
        break;
      case 1:
        if (args[0] instanceof String && args[0].match(/^(\d{4})-(\d{2})-(\d{2}), (\d{4})-(\d{2})-(\d{2})$/i)) {
          // If we're given a range tag, 'YYYY-MM-DD, YYYY-MM-DD', then use it.
          const range = args[0].split(', ');
          this.begin = new Day(range[0]);
          this.end = new Day(range[1]);
        } else {
          // Otherwise, treat the argument as a one-day range specification.
          this.begin = new Day(args[0]);
          this.end = new Day(args[0]);
        }
        break;
      default:
        this.begin = new Day().startOf('MONTH');
        this.end = new Day().endOf('MONTH');
        break;
    }
    this.update();
  }

  /*
   * -----------------------------------------
   *  static methods
   * - - - - - - - - - - - - - - - - - - - - -
   */

  static get mPattern () {
    // Regex string for detecting any month
    // "(jan[uary]*|feb[ruary]*|mar[ch]*|apr[il]*|may|...)"
    const pattern = '(' + NAMES.MONTH.map(
      e => e.toLowerCase().substr(0, 3) +
      (e.length === 3 ? '' : '[' + e.substr(3, 10) + ']*')
    ).join('|') + ')';
    return pattern;
  }

  static get cPattern () {
    // Regex string for detecting any month by code
    return `([${CODES.MONTH.join('')}])`;
  }

  static get fPattern () {
    // Regex string for full range codes (month, quarter, semester, year)
    // Note that 'Q' is used in month codes (Q21), and quarter codes (Q121) alike.
    // The same goes for 'H' in month codes, and semester codes.
    // For that reason, the latter must have precedence over month codes, to prevent wrong detections.
    return `(${CODES.YEAR[0]}|${CODES.SEMESTER.join('|')}|${CODES.QUARTER.join('|')}|[${CODES.MONTH.join('')}])`;
  }

  static get MonthNth1List () {
    // Short month list, nth-1 indexed
    return [null].concat(NAMES.MONTH.map(e => e.toLowerCase().substr(0, 3)));
  }

  static get CodeNth1List () {
    // Month Code list, nth-1 indexed
    return [null].concat(CODES.MONTH);
  }

  static mNumberFor (str) {
    // returns the 1th-indexed number of a month, given its name
    if (str === null || str.length < 3) return null;
    const nb = this.MonthNth1List.indexOf(str.substring(0, 3).toLowerCase());
    if (nb === -1) { return null; }
    return nb;
  }

  static cNumberFor (str) {
    // returns the 1th-indexed number of a month, given its code
    if (str === null || str.length > 1) return null;
    const nb = this.CodeNth1List.indexOf(str);
    if (nb === -1) { return null; }
    return nb;
  }

  static yearForDigits (digits) {
    // Brokers often indicate the year as one-digit in their range codes,
    // such as F3 for F23. This method interpolates the current decenny,
    // returning the full year.
    digits = String(digits);
    switch (digits.length) {
      case 1:
        return Day.today().strftime('%Y').slice(0, 3) + String(digits);
      case 2:
        return Day.today().strftime('%Y').slice(0, 2) + String(digits);
      default:
        return null;
    }
  }

  static parse (str) {
    // Should parse any Date Range format the brokers use,
    // and any format used in the interface.
    return (
      // First, try to parse any DayRange.tag() string ('2020-01-01')
      this.parseTag(str) ||
      // Then, try to grab any relative values ('This Week')
      // shot out by a combo box
      this.parseRelative(str) ||
      // Then, try to parse any arbitrary range shot out by a combo box
      this.parseArbitrary(str) ||
      // Then, parse any COMPOUND financial code, such as 'Z18-F19'
      this.parseCompoundCode(str) ||
      // Finally, parse for any financial code
      this.parseCode(str)
    );
  }

  static parseTag (str) {
    // We allow recognize two tag formats.
    // 1. For a single day: '2020-01-01'.
    // 2. As actual range: '2020-01-01, 2020-04-25'.
    // A one-day tag will generate a DayRange with a range tag as thus: '2020-01-01, 2020-01-01'.
    // Tag parsing is strict: one space is mandatory within range tags.
    // Any incorrect format will return null.
    if (str.match(/(\d{4})-(\d{2})-(\d{2}), (\d{4})-(\d{2})-(\d{2})/i)) {
      return new DayRange(...str.split(', '));
    }
    // if one single Day has been provided
    // (Note the ^ $ selectors that impeach partial detection within an incorrectly
    // formatted range tag).
    if (str.match(/^(\d{4})-(\d{2})-(\d{2})$/i)) {
      return new DayRange(str);
    }
    // Default
    return null;
  }

  static parseRelative (str) {
    // Parse mentions such as 'this week', 'last week', etc.
    // for easier processing of combo boxes.

    const lstr = str.toLowerCase().trim();
    if (lstr === 'today') {
      return new DayRange(Day.today());
    }
    if (lstr === 'tomorrow') {
      return new DayRange(Day.tomorrow());
    }
    if (lstr === 'yesterday') {
      return new DayRange(Day.yesterday());
    }

    const m = lstr.match(/(this|last) (year|semester|quarter|month|week|commercial week)/i);
    if (m !== null) {
      const mapSpan = {
        year: 'YEAR',
        semester: 'SEMESTER',
        quarter: 'QUARTER',
        month: 'MONTH',
        week: 'WEEK',
        'commercial week': 'COMMERCIAL_WEEK'
      };
      if (m[1] === 'this') {
        return Day.current(mapSpan[m[2]]);
      }
      if (m[1] === 'last') {
        return Day.last(mapSpan[m[2]]);
      }
      if (m[1] === 'next') {
        return Day.next(mapSpan[m[2]]);
      }
    }
    // default
    return null;
  }

  static parseArbitrary (str) {
    // Parse arbitrary ranges, given in the DayRange::toCode() format
    // We leverage the rather lengthy Regex for parsing monthes names.
    // Also, note that backlashes have to be ESCAPED within all String templates.

    const mPattern = this.mPattern;

    // 1. Same year, same month: "May 21-27, 2018"
    let m = str.match(new RegExp(`${mPattern}\\s?(\\d{1,2})-(\\d{1,2}),?\\s(\\d{4})`, 'i'));
    if (m !== null) {
      const mthIx = this.mNumberFor(m[1]);
      const yrStr = m[4];
      return new DayRange(
        Day.buildFrom(yrStr, mthIx, m[2]),
        Day.buildFrom(yrStr, mthIx, m[3])
      );
    }

    // 2. Same year, different month: "May 28-Jun 03, 2018"
    m = str.match(new RegExp(`${mPattern}\\s?(\\d{1,2})\\W*${mPattern}\\s?(\\d{1,2}),?\\s(\\d{4})`, 'i'));
    if (m !== null) {
      const mthIx1 = this.mNumberFor(m[1]);
      const mthIx2 = this.mNumberFor(m[3]);
      const yrStr = m[5];
      return new DayRange(
        Day.buildFrom(yrStr, mthIx1, m[2]),
        Day.buildFrom(yrStr, mthIx2, m[4])
      );
    }

    // 3. Different years: "Dec 31, 2018-Jan 06, 2019"
    m = str.match(new RegExp(`${mPattern}\\s?(\\d{1,2}),?\\s(\\d{4})\\W*${mPattern}\\s?(\\d{1,2}),?\\s(\\d{4})`, 'i'));
    if (m !== null) {
      const mthIx1 = this.mNumberFor(m[1]);
      const mthIx2 = this.mNumberFor(m[4]);
      const yrStr1 = m[3];
      const yrStr2 = m[6];
      return new DayRange(
        Day.buildFrom(yrStr1, mthIx1, m[2]),
        Day.buildFrom(yrStr2, mthIx2, m[5])
      );
    }

    // 4. Plain day: "Jan 06, 2019"
    m = str.match(new RegExp(`${mPattern}\\s?(\\d{1,2}),?\\s(\\d{4})`, 'i'));
    if (m !== null) {
      const mthIx = this.mNumberFor(m[1]);
      const yrStr = m[3];
      return new DayRange(Day.buildFrom(yrStr, mthIx, m[2]));
    }

    // 5. Interpolate the current year.

    // 5.1 "May 21"
    m = str.match(new RegExp(`^${mPattern}\\s?(\\d{1,2})$`, 'i'));
    if (m !== null) {
      const mthIx = this.mNumberFor(m[1]);
      const yrStr = Day.today().date.getFullYear();
      return new DayRange(Day.buildFrom(yrStr, mthIx, m[2]));
    }

    // 5.2 "May 21-27"
    m = str.match(new RegExp(`^${mPattern}\\s?(\\d{1,2})\\W+(\\d{1,2})$`, 'i'));
    if (m !== null) {
      const mthIx = this.mNumberFor(m[1]);
      const yrStr = Day.today().date.getFullYear();
      return new DayRange(
        Day.buildFrom(yrStr, mthIx, m[2]),
        Day.buildFrom(yrStr, mthIx, m[3])
      );
    }

    // 5.3 "May 28-Jun 03"
    m = str.match(new RegExp(`${mPattern}\\s?(\\d{1,2})\\W*${mPattern}\\s?(\\d{1,2})`, 'i'));
    if (m !== null) {
      const mthIx1 = this.mNumberFor(m[1]);
      const mthIx2 = this.mNumberFor(m[3]);
      const yrStr = Day.today().date.getFullYear();
      return new DayRange(
        Day.buildFrom(yrStr, mthIx1, m[2]),
        Day.buildFrom(yrStr, mthIx2, m[4])
      );
    }
    // Default option
    return null;
  }

  static parseCompoundCode (str) {
    // parse any range defined by TWO codes, such as 'Z18-F19'
    // Here we enforce years as two-digits, to mitigate false detections.
    const pattern = this.fPattern;
    const m = str.match(new RegExp(`${pattern}(\\d\\d)\\W*${pattern}(\\d\\d)`));
    if (m === null) return null;
    const compoundA = this.parseCode([m[1], m[2]].join(''));
    if (compoundA === null) return null;
    const compoundB = this.parseCode([m[3], m[4]].join(''));
    if (compoundB === null) return null;
    return new DayRange(compoundA.begin, compoundB.end);
  }

  static parseCode (str) {
    // console.log(str);

    // Suppress long year mentions for potential financial code
    str = str.replace(/20(\d\d)/g, '$1');

    // Cal computs
    let m = str.match(/cal\W?(\d\d)/i);
    if (m !== null) {
      return new DayRange(`20${m[1]}-01-01`, `20${m[1]}-12-31`);
    }

    // Semestrial computs
    m = (str.match(/(1|2)h\W?(\d\d)/i) || str.match(/h(1|2)\W?(\d\d)/i));
    if (m !== null) {
      if (m[1] === '1') {
        return new DayRange(`20${m[2]}-01-01`, `20${m[2]}-06-30`);
      }
      // otherwise
      return new DayRange(`20${m[2]}-07-01`, `20${m[2]}-12-31`);
    }

    // Quarterly computs
    // (cases like 'Q3-Q419')
    m = (str.match(/q(1|2|3|4)\W?q(1|2|3|4)(\d\d)/i));
    if (m !== null) {
      const d1 = new Day(`20${m[3]}-` + [null, '01', '04', '07', '10'][parseInt(m[1])] + '-01');
      const d2 = new Day(`20${m[3]}-` + [null, '01', '04', '07', '10'][parseInt(m[2])] + '-01');
      return new DayRange(d1, d2.endOf('QUARTER'));
    }

    m = (str.match(/(1|2|3|4)q\W?(\d\d)/i) || str.match(/q(1|2|3|4)\W?(\d\d)/i));
    if (m !== null) {
      const d = new Day(`20${m[2]}-` + [null, '01', '04', '07', '10'][parseInt(m[1])] + '-01');
      return new DayRange(d, d.endOf('QUARTER'));
    }

    // Monthly computs
    const mPattern = this.mPattern;
    const cPattern = this.cPattern;

    // First, parse by month name
    m = str.match(new RegExp(`${mPattern}\\W?(\\d\\d)?$`, 'i'));
    if (m !== null) {
      // set to current year if no year given
      const year = m[2] || Day.today().strftime('%y');
      const mthIx = this.mNumberFor(m[1]);
      const d = new Day(`20${year}-${zeroPad(mthIx)}-01`);
      return new DayRange(d, d.endOf('MONTH'));
    }

    // Now, process with code strings

    // Special case: things like "JV13" or "JV3"
    // m = str.match(/([FGHJKMNQUVXZ])([FGHJKMNQUVXZ])(\d{1,2})/i);
    m = str.match(new RegExp(`${cPattern}${cPattern}(\\d{1,2})`, 'i'));
    if (m !== null) {
      // Interpolate the current decenny
      const yrStr = this.yearForDigits(m[3]);
      // Now, compute interval
      const mthIx1 = this.cNumberFor(m[1]);
      const mthIx2 = this.cNumberFor(m[2]);
      return new DayRange(
        new Day(`${yrStr}-${zeroPad(mthIx1)}-01`),
        new Day(`${yrStr}-${zeroPad(mthIx2)}-01`).endOf('MONTH')
      );
    }

    // Regular case: things like "Z13" or "Z3"
    m = str.match(new RegExp(`${cPattern}(\\d{1,2})`, 'i'));
    if (m !== null) {
      // Interpolate the current decenny
      const yrStr = this.yearForDigits(m[2]);
      // Now, compute interval
      const mthIx = this.cNumberFor(m[1]);
      const d = new Day(`${yrStr}-${zeroPad(mthIx)}-01`);
      return new DayRange(d, d.endOf('MONTH'));
    }

    // Default
    return null;
  }

  static fullCodes () {
    // Construct all possible date codes from Day.today,
    // as a logging convenience
    const d = Day.today();
    const years = [0, 1, 2, 3, 4, 5]
      .map(n => String(parseInt(d.strftime('%y')) + n));
    const list = [];
    years.forEach(yr => {
      let r = 'Cal' + yr;
      if (DayRange.parse(r).begin.tag > d.tag) {
        list.push(r);
      }
      [CODES.MONTH, CODES.QUARTER, CODES.SEMESTER]
        .forEach(codeArray => {
          codeArray.forEach((code, ix) => {
            r = code + yr;
            if (DayRange.parse(r).begin.tag > d.tag) {
              list.push(r);
            }
            if (ix === codeArray.length - 1) {
              r = code + yr + '/' + codeArray[0] + String(parseInt(yr) + 1);
              if (DayRange.parse(r).begin.tag > d.tag) {
                list.push(r);
              }
            } else {
              if (codeArray.length !== 2) {
                // (Don't do it for semesters)
                r = code + yr + '/' + codeArray[ix + 1] + yr;
                if (DayRange.parse(r).begin.tag > d.tag) {
                  list.push(r);
                }
              }
            }
          });
        });
    });
    // uniq
    return list.filter((elem, pos, arr) =>
      arr.indexOf(elem) === pos);
  }

  static simpleCodes () {
    // Construct a selection of date codes from Day.today,
    // as a logging convenience
    const d = Day.today();
    const years = [0, 1, 2]
      .map(n => String(parseInt(d.strftime('%y')) + n));
    const list = [];
    years.forEach(yr => {
      [CODES.MONTH, CODES.QUARTER]
        .forEach(codeArray => {
          codeArray.forEach((code, ix) => {
            let r = code + yr;
            if (DayRange.parse(r).begin.tag > d.tag) {
              list.push(r);
            }
            if (ix === codeArray.length - 1) {
              r = code + yr + '/' + codeArray[0] + String(parseInt(yr) + 1);
              if (DayRange.parse(r).begin.tag > d.tag) {
                list.push(r);
              }
            }
          });
        });
    });
    // uniq and sort
    return list.filter((elem, pos, arr) =>
      arr.indexOf(elem) === pos);
  }

  /*
   * -----------------------------------------
   *  instance methods
   * - - - - - - - - - - - - - - - - - - - - -
   */

  update () {
    // Do NOT allow range start to be AFTER the range end
    if (this.begin.tag > this.end.tag) {
      // In that case, switch terms
      [this.begin, this.end] = [this.end, this.begin];
    }
    // tag format
    this.tag = `${this.begin.tag}, ${this.end.tag}`;
  }

  encompasses (dayOrPeriod) {
    // Check whether our range contains one specific Day or DayRange instance.
    // (Each Day instance will be compared as [day,day]
    // so we have one general method).
    // We do that by comparing tags.
    if (dayOrPeriod instanceof Day || dayOrPeriod instanceof DayRange) {
      const range = (dayOrPeriod instanceof Day
        ? new DayRange(dayOrPeriod, dayOrPeriod)
        : dayOrPeriod);
      return this.begin.tag <= range.begin.tag &&
        this.end.tag >= range.end.tag;
    } else {
      return false;
    }
  }

  covers (rangeType, extended = '') {
  // classifies a range by type. Used in comparisons.
  // The 'extended' param deals with multiple spans
  // (per ex., a range covering two successive months).
  // (Defers to the Day::spansWith() method,
  // which we can also use directly, for efficiency)
    const ran = this.begin;
    const ge = this.end;
    return ran.spansWith(ge, rangeType, extended);
  }

  toCode () {
    // Create a normalized financial code for the DayRange instance
    // Each code can then be read with DayRange.parse()
    const ran = this.begin;
    const ge = this.end;
    if (ran.spansWith(ge, 'DAY')) {
      return ran.strftime('%b %d, %Y');
    }
    if (ran.tagYear() === ge.tagYear()) {
      if (ran.spansWith(ge, 'YEAR')) {
        return ran.strftime('Cal%y');
      }
      if (ran.spansWith(ge, 'SEMESTER')) {
        return ran.strftime('%S');
      }
      if (ran.spansWith(ge, 'QUARTER')) {
        return ran.strftime('%Q');
      }
      if (ran.spansWith(ge, 'QUARTER', '+')) {
        return ran.strftime('%q') + '-' + ge.strftime('%q%y');
      }
      if (ran.spansWith(ge, 'MONTH')) {
        return ran.strftime('%F');
      }
      if (ran.spansWith(ge, 'MONTH', '+')) {
        return ran.strftime('%f') + '-' + ge.strftime('%f%y');
      }
      if (ran.tagMonth() === ge.tagMonth()) {
        // arbitrary dates within same mth
        return ran.strftime('%b %d') + '-' + ge.strftime('%d, %Y');
      }
      // Otherwise (arbitrary dates within same year),
      return ran.strftime('%b %d') + '-' + ge.strftime('%b %d, %Y');
    } else {
      // different years
      if (ran.spansWith(ge, 'YEAR', '+')) {
        return ran.strftime('Cal%y') + '-' + ge.strftime('Cal%y');
      }
      if (ran.spansWith(ge, 'QUARTER', '+')) {
        return ran.strftime('%Q') + '-' + ge.strftime('%Q');
      }
      if (ran.spansWith(ge, 'MONTH', '+')) {
        return ran.strftime('%F') + '-' + ge.strftime('%F');
      }
      // Otherwise,
      return ran.strftime('%b %d, %Y') + '-' + ge.strftime('%b %d, %Y');
    }
  }

  pickMonth (name) {
    // usage range.pickMonth('October');
    return this.arrayOf('MONTH')
      .filter(x => x.begin.monthName() === name)[0];
  }

  findAllDays (dayName) {
    return this.arrayOf('DAY')
      .filter(x => x.name() === dayName);
  }

  findNthDay (dayName, n) {
    // returns the 1-nth day by Code name within period
    // ie: 2nd Wednesday would be: range.findNth('Wednesday', 2)
    if (n < 1) {
      console.log('Incorrect index: findNth() is 1-nth');
      return null;
    }
    return (this.findAllDays(dayName)[n - 1] || null);
  }

  toHumanName () {
    const ran = this.begin;
    const ge = this.end;
    const mapSpan = {
      year: 'YEAR',
      semester: 'SEMESTER',
      quarter: 'QUARTER',
      month: 'MONTH',
      week: 'WEEK',
      'commercial week': 'COMMERCIAL_WEEK'
    };
    if (ran.spansWith(ge, 'DAY')) {
      return `on ${ran.toHumanName()}`;
    }
    // single-day ranges get expressed thru Day instance method
    for (const span of Object.keys(mapSpan)) {
      const spanSymbol = mapSpan[span];
      if (this.tag === Day.current(spanSymbol).tag) {
        return `this ${span}`;
      }
      if (this.tag === Day.last(spanSymbol).tag) {
        return `last ${span}`;
      }
    }
    // Process various options
    if (ran.spansWith(ge, 'DAY')) {
      return ran.strftime('%b %d, %Y');
    }
    if (ran.tagYear() === ge.tagYear()) {
      if (ran.spansWith(ge, 'YEAR')) {
        return ran.strftime('Year %Y');
      }
      if (ran.spansWith(ge, 'SEMESTER')) {
        return ran.strftime('%s %Y');
      }
      if (ran.spansWith(ge, 'QUARTER')) {
        return ran.strftime('%q %Y');
      }
      if (ran.spansWith(ge, 'QUARTER', '+')) {
        return ran.strftime('%q') + ge.strftime('-%q %Y');
      }
      if (ran.spansWith(ge, 'MONTH')) {
        return ran.strftime('%b %Y');
      }
      if (ran.spansWith(ge, 'MONTH', '+')) {
        return ran.strftime('%b') + ge.strftime('-%b %Y');
      }
      if (ran.tagMonth() === ge.tagMonth()) {
        return ran.strftime('%b %d') + '-' + ge.strftime('%d, %Y');
      }
      // Otherwise,
      return ran.strftime('%b %d') + '-' + ge.strftime('%b %d, %Y');
    } else {
      // different years
      if (ran.spansWith(ge, 'YEAR', '+')) {
        return ran.strftime('Years %Y-') + ge.strftime('%Y');
      }
      if (ran.spansWith(ge, 'SEMESTER', '+')) {
        return ran.strftime('%s %Y-') + ge.strftime('%s %Y');
      }
      if (ran.spansWith(ge, 'QUARTER', '+')) {
        return ran.strftime('%q %Y-') + ge.strftime('%q %Y');
      }
      if (ran.spansWith(ge, 'MONTH', '+')) {
        return ran.strftime('%b %Y-') + ge.strftime('%b %Y');
      }
      // Otherwise,
      return ran.strftime('%b %d, %Y') + '-' + ge.strftime('%b %d, %Y');
    }
  }

  // GENERATOR & ITERATION UTILS.
  // http://www.benmvp.com/learning-es6-generators-as-iterators/

  * by (span) {
    // usage: myDayRange.by('DAY')
    // => generator function
    for (let i = this.begin; i.tag < this.end.forward(1, span).tag; i = i.forward(1, span)) {
      if (i.tag > this.end.tag) return;
      const rg = i.relative(span);
      // trim both endings of range, the case being
      if (rg instanceof DayRange) {
        if (rg.begin.tag < this.begin.tag) {
          rg.begin = this.begin;
          rg.update();
        }
        if (rg.end.tag > this.end.tag) {
          rg.end = this.end;
          rg.update();
        }
      }
      yield rg;
    }
  }

  arrayOf (span) {
    return [...this.by(span)];
  }

  count (span) {
    return this.arrayOf(span).length;
  }

  forEach (span, fn) {
    // usage:
    // myDayRange.forEach('DAY', x => console.log(x.strftime('%b %d, %Y')));
    const ar = this.arrayOf(span);
    for (const d of ar) {
      fn(d);
    }
  }
}
