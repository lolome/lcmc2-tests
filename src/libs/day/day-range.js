/*
 * -----------------------------------------
 *   DayRange Class
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
import Day from './day';
import { padStart } from '@/utils/pad';

/*
 * -----------------------------------------
 *  constants
 * - - - - - - - - - - - - - - - - - - - - -
 */
const FILTERS = {
  // Tailored regex patterns for identifying Date info
  MONTH: [
    '(jan[uary]*',
    'feb[ruary]*',
    'mar[ch]*',
    'apr[il]*',
    'may',
    'jun[e]*',
    'jul[y]*',
    'aug[ust]*',
    'sep[tember]*',
    'oct[ober]*',
    'nov[ember]*',
    'dec[ember]*)'
  ].join('|')
};

/*
 * -----------------------------------------
 *  export Class
 * - - - - - - - - - - - - - - - - - - - - -
 */
export default class DayRange {
  // Usage:
  // direct construct takes 2 arguments:
  // either 2 Day.tag() string, or 2 Day instances.
  // new DayRange('2018-12-01','2018-12-10').tag === new DayRange(new Day('2018-12-01'), new Day('2018-12-10')).tag
  // For anything more complex, we use DayRange.parse()
  constructor (...args) {
    const input = (args.length !== 2)
      ? [new Day().startOf('MONTH'), new Day().endOf('MONTH')]
      : [new Day(args[0]), new Day(args[1])];
    this.begin = input[0]; this.end = input[1];
    this.update();
  }

  /*
   * -----------------------------------------
   *  static methods
   * - - - - - - - - - - - - - - - - - - - - -
   */
  static parse (str) {
    // Should parse any Date Range format the brokers use,
    // and any format used in the interface.
    return (
      // First, try to parse any DayRange.tag() string ('2020-01-01')
      this.parseTag(str) ||
      //  Then, try to grab any relative values ('This Week')
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
    if (str.match(/(\d{4})-(\d{2})-(\d{2}), (\d{4})-(\d{2})-(\d{2})/i)) {
      return new DayRange(...str.split(', '));
    }
    // if one single Day has been provided
    if (str.match(/(\d{4})-(\d{2})-(\d{2})/i)) {
      return new DayRange(str, str);
    }
    // Default
    return null;
  }

  static parseRelative (str) {
    // Parse mentions such as 'this week', 'last week', etc.
    // for easier processing of combo boxes.

    const lstr = str.toLowerCase().trim();
    if (lstr === 'today') {
      return new DayRange(Day.today(), Day.today());
    }
    if (lstr === 'tomorrow') {
      return new DayRange(Day.tomorrow(), Day.tomorrow());
    }
    if (lstr === 'yesterday') {
      return new DayRange(Day.yesterday(), Day.yesterday());
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

  static mNumberFor (str) {
    // returns the 1th-indexed number of a month, given its name
    if (str === null || str.length < 3) return null;
    const calRef = [null, 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'july', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return calRef.indexOf(str.substring(0, 3).toLowerCase());
  }

  static parseArbitrary (str) {
    // Parse arbitrary ranges, given in the DayRange::toCode() format
    // We leverage the rather lengthy Regex for parsing monthes names.
    // Also, note that backlashes have to be ESCAPED within all String templates.

    const mPattern = FILTERS.MONTH;

    // 1. Same year, same month: "May 21-27, 2018"
    let m = str.match(new RegExp(`${mPattern} (\\d{1,2})-(\\d{1,2}),? (\\d{4})`, 'i'));
    if (m !== null) {
      const mthIx = this.mNumberFor(m[1]);
      const yrStr = m[4];
      return new DayRange(
        Day.buildFrom(yrStr, mthIx, m[2]),
        Day.buildFrom(yrStr, mthIx, m[3])
      );
    }

    // 2. Same year, different month: "May 28-Jun 03, 2018"
    m = str.match(new RegExp(`${mPattern} (\\d{1,2})-${mPattern} (\\d{1,2}),? (\\d{4})`, 'i'));
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
    m = str.match(new RegExp(`${mPattern} (\\d{1,2}),? (\\d{4})-${mPattern} (\\d{1,2}),? (\\d{4})`, 'i'));
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
    m = str.match(new RegExp(`${mPattern} (\\d{1,2}),? (\\d{4})`, 'i'));
    if (m !== null) {
      const mthIx = this.mNumberFor(m[1]);
      const yrStr = m[3];
      return new DayRange(
        Day.buildFrom(yrStr, mthIx, m[2]),
        Day.buildFrom(yrStr, mthIx, m[2])
      );
    }

    // 5. Interpolate the current year.
    // 5.1 "May 21-27"
    m = str.match(new RegExp(`${mPattern} (\\d{1,2})-(\\d{1,2})`, 'i'));
    if (m !== null) {
      const mthIx = this.mNumberFor(m[1]);
      const yrStr = Day.today().date.getFullYear();
      return new DayRange(
        Day.buildFrom(yrStr, mthIx, m[2]),
        Day.buildFrom(yrStr, mthIx, m[3])
      );
    }

    // 5.2 "May 28-Jun 03"
    m = str.match(new RegExp(`${mPattern} (\\d{1,2})-${mPattern} (\\d{1,2})`, 'i'));
    if (m !== null) {
      const mthIx1 = this.mNumberFor(m[1]);
      const mthIx2 = this.mNumberFor(m[3]);
      const yrStr = Day.today().date.getFullYear();
      return new DayRange(
        Day.buildFrom(yrStr, mthIx1, m[2]),
        Day.buildFrom(yrStr, mthIx2, m[4])
      );
    }
    return null;
  }

  static parseCompoundCode (str) {
    // parse any range defined by TWO codes, suh as 'Z18-F19'
    const m = str.match(/(\w+\d\d)\W(\w+\d\d)/i);
    if (m === null) return null;
    const compoundA = DayRange.parseCode(m[1]);
    if (compoundA === null) return null;
    const compoundB = DayRange.parseCode(m[2]);
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
      return new DayRange(`20${m[2]}-01-01`, `20${m[2]}-06-30`);
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

    // LME calculations (to be seen: do we need them?)

    // Monthly computs
    m = str.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\W?(\d\d)?$/i);
    if (m !== null) {
      // set to current year if no year given
      const year = m[2] || Day.today().strftime('%y');
      const cal = [null, 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const mthIx = cal.indexOf(m[1].toLowerCase());
      const d = new Day(`20${year}-${padStart(mthIx)}-01`);
      return new DayRange(d, d.endOf('MONTH'));
    }

    // Now, process with code strings
    // Do not allow spaces between letter and year, it screws up everything
    // str = str(/\s+/, '');

    // Special case: things like "JV13" or "JV3"
    m = str.match(/([FGHJKMNQUVXZ])([FGHJKMNQUVXZ])(\d{1,2})/i);
    if (m !== null) {
      // If broker has given one digit only for the year,
      // interpolate the current decenny
      const yr = new Day().strftime('%Y');
      const century = yr.slice(0, 2);
      const decenny = yr.slice(2);
      const yrStr = m[3].length === 1
        ? century + decenny[0] + m[3]
        : century + m[3];
        // Now, compute interval
      const cal = [null, 'F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'];
      const mthIx1 = cal.indexOf(m[1].toUpperCase());
      const mthIx2 = cal.indexOf(m[2].toUpperCase());
      return new DayRange(
        new Day(`${yrStr}-${padStart(mthIx1)}-01`),
        new Day(`${yrStr}-${padStart(mthIx2)}-01`).endOf('MONTH')
      );
    }

    // Regular case: things like "Z13" or "Z3"
    m = str.match(/([FGHJKMNQUVXZ])(\d{1,2})/i);
    if (m !== null) {
      // If broker has given one digit only for the year, interpolate the current decenny
      const yr = new Day().strftime('%Y');
      const century = yr.slice(0, 2);
      const decenny = yr.slice(2);
      const yrStr = m[2].length === 1
        ? century + decenny[0] + m[2]
        : century + m[2];
      // Now, compute interval
      const cal = [null, 'F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'];
      const mthIx = cal.indexOf(m[1].toUpperCase());
      const d = new Day(`${yrStr}-${padStart(mthIx)}-01`);
      return new DayRange(d, d.endOf('MONTH'));
    }

    // Default
    console.log('parse failed', str);
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
    // Do NOT allow ant range start to be AFTER the range end
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
    // ie: 2nd Wednesday would be: range.findNth('Wed', 2)
    if (n < 1) {
      console.error('Incorrect index: findNth() is 1-nth');
      // TODO: throw 'Incorrect index: findNth() is 1-nth';
    }
    return this.findAllDays(dayName)[n - 1];
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
