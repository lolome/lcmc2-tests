/*
 * -----------------------------------------
 *  Day Library
 * - - - - - - - - - - - - - - - - - - - - -
 *  version: 1.2
 *  date: July 2020
 *  authors: Hugues Leroy, Laurent Mercier
 *  licence: 'XXX'
 * - - - - - - - - - - - - - - - - - - - - -
 *  required
 * - - - - - - - - - - - - - - - - - - - - -
*/

// SHARED CONSTANTS

const NAMES = {
  MONTH: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ],
  DAY: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]
};

const CODES = {
  MONTH: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'],
  QUARTER: ['Q1', 'Q2', 'Q3', 'Q4'],
  SEMESTER: ['1H', '2H'],
  YEAR: ['Cal']
};

// SHARED UTILS

// zeroPad: zero-padding single digits in day numbers.
const zeroPad = (val, chars = 2, pad = '0') => String(val).padStart(chars, pad);

module.exports = { CODES, NAMES, zeroPad };
