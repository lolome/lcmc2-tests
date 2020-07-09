<template>
  <div
    style="width:12rem;"
    id="when">

    <label style="display:flex; align-content:stretch;">
      <div style="width:86%">
        <span :style="{visibility: toggleInput ? 'hidden' : 'visible'}"
        class="summup" @click="toggleInput=true">
          {{ rangeDesc }}
        </span>
        <input v-show="toggleInput" class="crit-field"
          placeholder="Enter code"
          @change="setRangeFromText($event.target.value)">
      </div>
      <button
      @click="display = 'month'">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 20h-4v-4h4v4zm-6-10h-4v4h4v-4zm6 0h-4v4h4v-4zm-12 6h-4v4h4v-4zm6 0h-4v4h4v-4zm-6-6h-4v4h4v-4zm16-8v22h-24v-22h3v1c0 1.103.897 2 2 2s2-.897 2-2v-1h10v1c0 1.103.897 2 2 2s2-.897 2-2v-1h3zm-2 6h-20v14h20v-14zm-2-7c0-.552-.447-1-1-1s-1 .448-1 1v2c0 .552.447 1 1 1s1-.448 1-1v-2zm-14 2c0 .552-.447 1-1 1s-1-.448-1-1v-2c0-.552.447-1 1-1s1 .448 1 1v2z"/></svg>
      </button>
    </label>

    <div
      v-show="display === 'month'"
      id="monthView"
      class="calendar month">
      <nav>
        <button
          id="prevMonth"
          class="prev"
          @click.prevent="prevMonth">
          ◀︎
        </button>
        <button
          class="month button"
          @click="display = 'year'">
          {{ currentSelection.begin.strftime('%b %Y') }}
        </button>
        <button
          id="nextMonth"
          class="next"
          @click.prevent="nextMonth">
          ▶︎
        </button>
      </nav>

      <div
        class="date_grid">
        <span
          v-for="dayH in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']"
          :key="'dayH_' + dayH"
          class="day_name">
          {{dayH}}
        </span>
        <!-- Insert as many blank cells as needed,
        depending on the JS name number for first day in period.
        (Sun:0, Mon:1, etc.) -->
        <span
          v-for="dayD in currentSelection.begin.date.getDay()"
          :key="'blank_' + dayD"
          class="blank">
        </span>
        <button
          v-for = "(oneDay, ix) in daysInSelection"
          :key="'oneDay_' + ix"
          :class="{
            'today': (oneDay.tag === today )
          }">
          <time
            :class="{
              'sunday': (oneDay.date.getDay() === 0 )
            }"
            v-bind:datetime="oneDay.tag"
            @click.prevent="setRangeFromDate(oneDay.tag)">
            {{ ix + 1 }}
          </time>
        </button>
      </div>

      <footer
        class="month">
        <button class="text-sm text-gray-800"
          id="today"
          :style="{
            'visibility': todayNotVisible ? 'visible' : 'hidden'
          }"
          @click="backToToday">
          Tdy
        </button>
        <span
          class='range-message'>
          {{ rangeSelectionMessage }}
        </span>
        <button class="text-sm text-gray-800"
          id="range"
          @click="toggleRange">
          Rge
        </button>
      </footer>
    </div>

    <div
      v-show="display === 'year'"
      id="yearView"
      class="calendar year">
      <nav>
        <button
          id="prevYear"
          class="prev"
          @click.prevent="prevYear">
          ◀︎
        </button>
        <span
          class="month button">
          {{ currentSelection.begin.strftime('%Y') }}
        </span>
        <button
          id="nextYear"
          class="next"
          @click.prevent="nextYear">
          ▶︎
        </button>
      </nav>

      <div
        class="month_grid">
        <button
          v-for="oneMth in ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']"
          :key="oneMth">
          <time
            @click.prevent="setSelectionFromMonth(oneMth)">
            {{ oneMth }}
          </time>
        </button>
      </div>
    </div>
  </div>
</template>

<script>

/*
* -----------------------------------------
*  component
* - - - - - - - - - - - - - - - - - - - - -
*/

import hookable from '../mixins/hookable';

export default {

  name: 'DatePicker',

  data () {
    return {
      range: new this.$Day.Range(this.$Day.today(), this.$Day.today()),
      currentSelection: this.$Day.current('MONTH'),
      today: this.$Day.today().tag,
      rangeStatus: 0,
      display: 'none',
      toggleInput: false
    };
  },

  mixins: [hookable],

  mounted: function () {
    // if an initial param has been provided, use it.
    if (this.initial) {
      // NOTE: falsy values in ECMA-/Javascript cover the below:
      // null, undefined, NaN, '', 0, false
      const newRange = this.$Day.parse(this.initial);
      if (!newRange) { return; }
      this.range = newRange;
      this.currentSelection = this.range.begin.relative('MONTH');
    }
  },

  computed: {

    rangeDesc () {
      return this.range.toHumanName();
    },

    rangeBegin () {
      return this.range.begin.tag;
    },

    rangeEnd () {
      return this.range.end.tag;
    },

    daysInSelection () {
      return this.currentSelection.arrayOf('DAY');
    },

    todayNotVisible () {
      return !(this.currentSelection.encompasses(this.$Day.today()));
    },

    rangeSelectionMessage () {
      return ['', 'Pick start date', 'Pick end date'][this.rangeStatus];
    }

  },

  methods: {

    resetDisplay () {
      this.display = 'none';
      this.currentSelection = this.range.begin.relative('MONTH');
      this.toggleInput = false;
    },

    setRangeFromText (value) {
      const newRange = this.$Day.Range.parse(value);
      if (newRange == null) return;
      this.range = newRange;
      // this.display = 'none';
      this.resetDisplay();
    },

    setRangeFromDate (value) {
      const DayRange = this.$Day.Range;
      switch (this.rangeStatus) {
        case 0:
          this.range = new DayRange(value, value);
          // this.display = 'none';
          this.resetDisplay();
          break;
        case 1:
          this.range = new DayRange(value, value);
          this.rangeStatus = 2;
          break;
        case 2:
          this.range = new DayRange(this.range.begin, value);
          this.rangeStatus = 0;
          // this.display = 'none';
          this.resetDisplay();
          break;
      }
    },

    setSelectionFromMonth (value) {
      this.currentSelection = this.$Day.parse(value + ' ' + this.currentSelection.begin.date.getFullYear());
      this.display = 'month';
    },

    nextMonth () {
      this.currentSelection = this.currentSelection.begin.next('MONTH');
    },

    prevMonth () {
      this.currentSelection = this.currentSelection.begin.last('MONTH');
    },

    nextYear () {
      // Enforce selection to 1st month of selected year
      const selectedYear = this.currentSelection.begin.next('YEAR');
      this.currentSelection = selectedYear.begin.relative('MONTH');
    },

    prevYear () {
      // Enforce selection to 1st month of selected year
      const selectedYear = this.currentSelection.begin.last('YEAR');
      this.currentSelection = selectedYear.begin.relative('MONTH');
    },

    backToToday () {
      // return month view to current month
      this.currentSelection = this.$Day.current('MONTH');
    },

    toggleRange () {
      // enable/disable the Range Selection mode
      this.rangeStatus = [1, 0, 0][this.rangeStatus];
    }

  }

};

</script>

<style>

  .summup {
    position:absolute;
    max-width: 12.8em;
    font-size: 20px;
    display: block;
    height: 36px;
    font-weight: bold;
    color: #f5730e;
    line-height: 28px;
  }

  .calendar {
    border:1px solid gray;
    padding: 5px;
    max-width: 11.8em;
    height:14em;
    box-sizing:border-box;
  }

  .calendar nav {
    vertical-align:middle;
    display: flex;
    justify-content: space-between;
    margin-bottom:5%;
  }

  .calendar footer {
    margin-top:5%;
    display: flex;
    justify-content: space-between;
  }

  .date_grid {
    height:70%;
    display: grid;
    grid-row-gap: 0%;
    text-align:center;
    grid-template-columns: repeat(7, 1fr);
  }

  .day_name {
    color: #999;
    line-height:0;
    margin-top:30%;
    margin-bottom:20%;
    //text-decoration:underline;
  }

  .month_grid {
    display: grid;
    grid-row-gap: 1%;
    text-align:center;
    grid-template-columns: repeat(3, 1fr);
  }

  .range-message {
    font-size: 80%;
    font-style: italic;
  }

  button {
    display: inline-block;
    background: #fff;
    border: none;
    padding: 0;
    margin: 0;
    text-decoration: none;
    cursor: pointer;
    text-align: center;
    transition: background 250ms ease-in-out,
                transform 150ms ease;
    -webkit-appearance: none;
    -moz-appearance: none;
  }

  .calIcon {
    color:#7F7F7F;
    /*transform:translateX(-1.5em);*/
    transition: background 250ms ease-in-out,
                transform 150ms ease;
    -webkit-appearance: none;
    -moz-appearance: none;
  }

  .calIcon:hover,
  .calIcon:focus {
    color: #0F4C12;
  }

  .today {
    background:red;
    color:#fff;
    border-radius: 50%;
    margin-top:0;
    margin-bottom:0;
  }

  .sunday {
    color:#999;
  }

  button:hover,
  button:focus {
    background: #eee;
  }

  button:focus {
    outline: 1px solid #fff;
    outline-offset: -4px;
  }

  button:active {
    transform: scale(0.99);
  }

</style>
