import Day from './day';
import DayRange from './day-range';

// ============================ TESTING DAYRANGE LIB ============================

test('Checking DayRange regex static strings (English).', () => {
  const mPattern = Day.Range.mPattern;
  expect(mPattern).toBe(
    '(jan[uary]*|feb[ruary]*|mar[ch]*|apr[il]*' +  
  '|may|jun[e]*|jul[y]*|aug[ust]*|sep[tember]*|oct[ober]*' + 
  '|nov[ember]*|dec[ember]*)'
  );
  
  const cPattern = Day.Range.cPattern;
  expect(cPattern).toBe('([FGHJKMNQUVXZ])');
  
  const fPattern = Day.Range.fPattern;
  expect(fPattern).toBe('(Cal|1H|2H|Q1|Q2|Q3|Q4|[FGHJKMNQUVXZ])');
});

test('DayRange::mNumberFor() sanity checks.', () => {
  const testArray = [
    ['January', 1],
    ['February', 2],
    ['March', 3],
    ['April', 4],
    ['May', 5],
    ['June', 6],
    ['July', 7],
    ['August', 8],
    ['September', 9],
    ['October', 10],
    ['November', 11],
    ['December', 12]
  ];
  testArray.forEach(entry => {
    const name = entry[0];
    const nb = entry[1];
    expect(Day.Range.mNumberFor(name.toUpperCase())).toBe(nb);
    expect(Day.Range.mNumberFor(name.toLowerCase().substr(0, 3))).toBe(nb);
  });
  expect(Day.Range.mNumberFor('Invalid String')).toBe(null);
  expect(Day.Range.mNumberFor('JA')).toBe(null);
});

test('DayRange::cNumberFor() sanity checks.', () => {
  const testArray = [
    ['F', 1],
    ['G', 2],
    ['H', 3],
    ['J', 4],
    ['K', 5],
    ['M', 6],
    ['N', 7],
    ['Q', 8],
    ['U', 9],
    ['V', 10],
    ['X', 11],
    ['Z', 12]
  ];
  testArray.forEach(entry => {
    const name = entry[0];
    const nb = entry[1];
    expect(Day.Range.cNumberFor(name)).toBe(nb);
  });
  expect(Day.Range.mNumberFor('Invalid String')).toBe(null);
  expect(Day.Range.mNumberFor('Y')).toBe(null);
});

describe('DayRange constructor', () => {
  it('(two arguments) should allow both Day instances or single-day string tags.', function() {
    const dr1 = new Day.Range('2020-01-01', '2020-01-06');
    expect(dr1.tag).toBe('2020-01-01, 2020-01-06');
    const dr2 = new Day.Range(new Day('2020-01-01'), new Day('2020-01-06'));
    expect(dr2.tag).toBe('2020-01-01, 2020-01-06');
    const dr3 = new Day.Range(new Day('2020-01-01'), '2020-01-06');
    expect(dr3.tag).toBe('2020-01-01, 2020-01-06');
    const dr4 = new Day.Range('2020-01-01', new Day('2020-01-06'));
    expect(dr2.tag).toBe('2020-01-01, 2020-01-06');
  });
  it('(one argument) should allow both Day instances or single-day string tags.', function() {
    const dr1 = new Day.Range('2020-01-01');
    expect(dr1.tag).toBe('2020-01-01, 2020-01-01');
    const dr2 = new Day.Range(new Day('2020-01-01'));
    expect(dr2.tag).toBe('2020-01-01, 2020-01-01');
  });
  it('(no argument) should default to current month', function() {
    const dr1 = new Day.Range;
    expect(dr1.tag).toBe(Day.current('MONTH').tag);
  });
  it('for backwards dates (ie, from Feb 2, 2020 to Jan 5, 2020) should accept them and sort the tag correctly.', function() {
    const dr1 = new Day.Range('2021-06-20', '2021-05-01');
    expect(dr1.tag).toBe('2021-05-01, 2021-06-20');
  });
});

test('DayRange::parseTag() sanity checks.', () => {
  const testArray = [
    // One-day tags should be parsed in both formats.
    ['2021-01-22', '2021-01-22, 2021-01-22'],
    ['2021-01-22, 2021-01-22', '2021-01-22, 2021-01-22'],
    // Non-existent dates should be adjusted following Javascript Date rules.
    ['2021-02-29', '2021-03-01, 2021-03-01'],
    // Range tags should be parsed correctly.
    ['2021-02-15, 2021-02-19', '2021-02-15, 2021-02-19'],
  ];
  testArray.forEach(entry => {
    const rge = Day.Range.parseTag(entry[0]);
    expect(rge.tag).toBe(entry[1]);
  });
  // Incorrect formats should return null.
  expect(Day.Range.parseTag('21-02-15')).toBe(null);
  expect(Day.Range.parseTag('2021-02-15,2021-02-19')).toBe(null);
});

test('DayRange::parseRelative() sanity checks.', () => {
  const testArray = [
    ['Today', new Day.Range(Day.today(), Day.today()).tag],
    ['Yesterday', new Day.Range(Day.yesterday(), Day.yesterday()).tag],
    ['Tomorrow', new Day.Range(Day.tomorrow(), Day.tomorrow()).tag],
  ]
});

describe('DayRange::parseArbitrary()', () => {
  it('should handle Same year, same month: "May 21-27, 2018"', function () {
    const testArray = [
      ['May 21-27, 2021', '2021-05-21, 2021-05-27'],
      ['May21-27, 2021', '2021-05-21, 2021-05-27'],
      ['May 21-27 2021', '2021-05-21, 2021-05-27'],
      ['Feb 01-29 2020', '2020-02-01, 2020-02-29']
    ];
    testArray.forEach(entry => {
      const rge = Day.Range.parseArbitrary(entry[0]);
      expect(rge).toBeDefined;
      expect(rge.tag).toBe(entry[1]);
    });
  });
  it('should handle Same year, different month: "May 28-Jun 03, 2018"', function () {
    const testArray = [
      ['May 21-Jun 27, 2021', '2021-05-21, 2021-06-27'],
      ['May 21 - June 27 2021', '2021-05-21, 2021-06-27'],
      ['Feb 1 - Jan 2, 2020', '2020-01-02, 2020-02-01']
    ];
    testArray.forEach(entry => {
      const rge = Day.Range.parseArbitrary(entry[0]);
      expect(rge).toBeDefined;
      expect(rge.tag).toBe(entry[1]);
    });
  });
  it('should handle Different years: "Dec 31, 2018-Jan 06, 2019"', function () {
    const testArray = [
      ['May 21, 2019-Jan 27, 2021', '2019-05-21, 2021-01-27'],
      ['May 21 2019 - Jan 27, 2021', '2019-05-21, 2021-01-27']
    ];
    testArray.forEach(entry => {
      const rge = Day.Range.parseArbitrary(entry[0]);
      expect(rge).toBeDefined;
      expect(rge.tag).toBe(entry[1]);
    });
  });
  it('should handle plain, single days', function () {
    const testArray = [
      ['May21, 2019', '2019-05-21, 2019-05-21'],
      ['May21 2019', '2019-05-21, 2019-05-21'],
    ];
    testArray.forEach(entry => {
      const rge = Day.Range.parseArbitrary(entry[0]);
      expect(rge).toBeDefined;
      expect(rge.tag).toBe(entry[1]);
    });
  });
  it('should interpolate correctly the current year', function () {
    const yr = String((new Date).getFullYear());
    const testArray = [
      // Single day
      ['May 21', `${yr}-05-21, ${yr}-05-21`, ],
      // Day Range - same month
      ['May21-27', `${yr}-05-21, ${yr}-05-27`],
      // Day Range - different months
      ['May21-June30', `${yr}-05-21, ${yr}-06-30`]
    ];
    testArray.forEach(entry => {
      const rge = Day.Range.parseArbitrary(entry[0]);
      expect(rge).toBeDefined;
      expect(rge.tag).toBe(entry[1]);
    });
  });
});

describe('DayRange::parseCode()', () => {
  it('should handle compound codes through DayRange::parseCompoundCode()', function () {
    const testArray = [
      ['F21-G21', '2021-01-01, 2021-02-28'],
      ['Q219-Q120', '2019-04-01, 2020-03-31']
    ];
    testArray.forEach(entry => {
      const rge = Day.Range.parseCompoundCode(entry[0]);
      expect(rge).toBeDefined;
      expect(rge.tag).toBe(entry[1]);
    });
  });
  
  const yr = String((new Date).getFullYear());
  
  const checkTag = function (array) {
    array.forEach(entry => {
      const rge = Day.Range.parseCode(entry[0]);
      expect(rge).toBeDefined;
      expect(rge.tag).toBe(entry[1]);
    });
  }
  
  it('general testing', function () {
    checkTag([
      ['F21', '2021-01-01, 2021-01-31'],
      ['Q219', '2019-04-01, 2019-06-30'],
    ]);
  });

  it('Cal computs', function () {
    checkTag([
      ['Cal21', '2021-01-01, 2021-12-31'],
      ['Cal-21', '2021-01-01, 2021-12-31'],
    ]);
  });

  it('Semestrial computs', function () {
    checkTag([
      ['1H21', '2021-01-01, 2021-06-30'],
      ['2H21', '2021-07-01, 2021-12-31'],
      ['H221', '2021-07-01, 2021-12-31'],
    ]);
  });

  it('Quarterly computs -- compounded (ie Q2Q319)', function () {
    checkTag([
      ['Q2Q321', '2021-04-01, 2021-09-30'],
      ['Q2-Q321', '2021-04-01, 2021-09-30'],
      ['XZ20', '2020-11-01, 2020-12-31'],
    ]);
  });

  it('Quarterly computs -- Plain', function () {
    checkTag([
      ['Q421', '2021-10-01, 2021-12-31'],
      ['4Q21', '2021-10-01, 2021-12-31'],
    ]);
  });

  it('Monthly computs -- by name', function () {
    checkTag([
      ['Jan19', '2019-01-01, 2019-01-31'],
      ['Jan', `${yr}-01-01, ${yr}-01-31`],
    ]);
  });

  it('Monthly computs -- by code compounded (JV13, JV3)', function () {
    checkTag([
      ['FG21', '2021-01-01, 2021-02-28'],
      ['FG1', '2021-01-01, 2021-02-28'],
    ]);
  });
});

test('DayRange:encompasses() should take indiffently Day or DayRange instances', () => {
  const day = Day.today();
  const week = Day.current('WEEK');
  expect(week.encompasses(day)).toBeDefined;
  expect(week.encompasses(week)).toBeDefined;
});

test('DayRange:encompasses(). Sanity checks.', () => {
  const month = Day.current('MONTH');
  const week = Day.current('WEEK');
  const year = Day.current('YEAR');
  expect(month.encompasses(week)).toBeTruthy;
  expect(year.encompasses(week)).toBeTruthy;
  expect(year.encompasses(year)).toBeTruthy;
  expect(week.encompasses(month)).toBefalsy;
  expect(month.encompasses(year)).toBefalsy;
  expect(month.encompasses(year)).toBefalsy;
});

test('DayRange:toCode(). Sanity checks.', () => {
  expect(Day.parse("CAL2021").toCode()).toBe('Cal21');
  expect(Day.parse("Jan 2021").toCode()).toBe('F21');
  expect(Day.parse("August 1, 2020 - August 31, 2020").toCode()).toBe('Q20');
  expect(Day.parse("Q321").toCode()).toBe('Q321');
  expect(Day.parse("H120").toCode()).toBe('1H20');
  expect(Day.parse("2021-03-18").toCode()).toBe('Mar 18, 2021');
  expect(Day.parse("2021-03-18, 2021-03-18").toCode()).toBe('Mar 18, 2021');
  expect(Day.parse("2021-03-18, 2021-03-27").toCode()).toBe('Mar 18-27, 2021');
  expect(Day.parse("2020-03-18, 2021-03-27").toCode()).toBe('Mar 18, 2020-Mar 27, 2021');
});

test('DayRange:findAllDays() testing.', () => {
  const period = Day.parse('F21');
  expect(period.findAllDays('Monday').length).toBe(4);
  expect(period.findAllDays('Sunday').length).toBe(5);
  expect(period.findAllDays('invalid').length).toBe(0);
});

test('DayRange:findNthDay() testing.', () => {
  const period = Day.parse('F21');
  expect(period.findNthDay('Monday', 2).tag).toBe('2021-01-11');
  expect(period.findNthDay('Monday', 1).tag).toBe('2021-01-04');
  expect(period.findNthDay('Monday', 0)).toBe(null);
  expect(period.findNthDay('Monday', 5)).toBe(null);
});

test('DayRange:toHumanName() sanity checks.', () => {
  expect(Day.current('DAY').toHumanName()).toBe('today'); // Day instance
  expect(Day.parse('today').toHumanName()).toBe('on today'); // DayRange instance
  expect(Day.current('WEEK').toHumanName()).toBe('this week');
  expect(Day.current('COMMERCIAL_WEEK').toHumanName()).toBe('this commercial week');
  expect(Day.current('MONTH').toHumanName()).toBe('this month');
  expect(Day.current('QUARTER').toHumanName()).toBe('this quarter');
  expect(Day.current('SEMESTER').toHumanName()).toBe('this semester');
  expect(Day.current('YEAR').toHumanName()).toBe('this year');
  
  expect(Day.parse('2016-01-12, 2016-01-12').toHumanName()).toBe('on Jan 12, 2016');
  expect(Day.parse('2016-01-12, 2016-01-17').toHumanName()).toBe('Jan 12-17, 2016');
  expect(Day.parse('2016-01-12, 2016-02-03').toHumanName()).toBe('Jan 12-Feb 03, 2016');
  expect(Day.parse('2016-01-01, 2016-01-31').toHumanName()).toBe('Jan 2016');
  expect(Day.parse('2016-01-01, 2016-02-29').toHumanName()).toBe('Jan-Feb 2016');
  expect(Day.parse('2016-01-01, 2016-03-31').toHumanName()).toBe('Q1 2016');
  expect(Day.parse('2016-01-01, 2016-06-30').toHumanName()).toBe('1H 2016');
  expect(Day.parse('2016-04-01, 2016-09-30').toHumanName()).toBe('Q2-Q3 2016');
  expect(Day.parse('2016-07-01, 2016-12-31').toHumanName()).toBe('2H 2016')
  expect(Day.parse('2016-01-01, 2016-12-31').toHumanName()).toBe('Year 2016')
});

describe('DayRange:by() generator function test.', () => {
  it('should iterate correctly', function() {
    let range = Day.parse('2020-03-08, 2020-03-10');
    let by = range.by('DAY');
    expect(by.next().value.tag).toBe('2020-03-08');
    expect(by.next().value.tag).toBe('2020-03-09');
    expect(by.next().value.tag).toBe('2020-03-10');
    expect(by.next().value).toBeUndefined;
    
    range = Day.parse("Jan 2021");
    by = range.by('WEEK');
    expect(by.next().value.tag).toBe('2021-01-01, 2021-01-03');
    expect(by.next().value.tag).toBe('2021-01-04, 2021-01-10');
    expect(by.next().value.tag).toBe('2021-01-11, 2021-01-17');
    expect(by.next().value.tag).toBe('2021-01-18, 2021-01-24');
    expect(by.next().value.tag).toBe('2021-01-25, 2021-01-31');
    expect(by.next().value).toBeUndefined;
  });

  it('testing DayRange:arrayOf() utility', function () {
    let range = Day.parse('Jan 2021');
    expect(range.arrayOf('DAY').length).toBe(31);
    expect(range.arrayOf('WEEK').length).toBe(5);
    
    range = Day.parse('Cal 2021');
    expect(range.arrayOf('WEEK').length).toBe(53);
    expect(range.arrayOf('DAY').length).toBe(365);
    
    range = Day.parse('2020-02-27, 2020-02-29');
    const tags = range.arrayOf('DAY').map(d => d.tag);
    expect(tags[0]).toBe('2020-02-27');
    expect(tags[1]).toBe('2020-02-28');
    expect(tags[2]).toBe('2020-02-29');
  });
  
  it('testing DayRange:arrayOf() utility', function () {
    let range = Day.parse('Jan 2021');
    expect(range.arrayOf('DAY').length).toBe(31);
    expect(range.arrayOf('WEEK').length).toBe(5);
    
    range = Day.parse('Cal 2021');
    expect(range.arrayOf('WEEK').length).toBe(53);
    expect(range.arrayOf('DAY').length).toBe(365);
  });
});