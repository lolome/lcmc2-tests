<template>
  <div class="modulcol-2" id="when">
    <span class="quid">Period:&nbsp;</span>
    <span class="answer">{{rangeDesc}}</span>
    <label>
      <input placeholder="Enter code" v-on:change="setRangeFromText($event.target.value);">
      <button v-on:click="display='month'">ShowMonth</button>
    </label>

    <div v-show="display=='month'" id="monthView" class="calendar month">
      <nav>
        <button id="prevMonth" class="prev" v-on:click.prevent="prevMonth">◀︎</button>
        <button v-on:click="display='year'" class="month button">
          {{currentSelection.begin.strftime('%b %Y')}}
        </button>
        <button id="nextMonth" class="next" v-on:click.prevent="nextMonth">▶︎</button>
      </nav>

      <div class="date_grid">
          <span v-for="dayH in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" class="day_name" :key="'dayH_' + dayH">
            {{dayH}}
          </span>
          <!-- Insert as many blank cells as needed, depending on the JS name number for first day in period.
  (Sun:0, Mon:1, etc.) -->
          <span v-for="dayD in currentSelection.begin.date.getDay()"
          class="blank" :key="'blank_' + dayD.id">
          </span>
          <button v-for = "(oneDay,ix) in daysInSelection" v-bind:class="{today:(oneDay.tag === today )}"
          :key="'oneDay_' + ix">
            <time v-bind:class="{sunday:(oneDay.date.getDay() === 0 )}" v-bind:datetime="oneDay.tag"
            v-on:click.prevent="setRangeFromDate(oneDay.tag);">
              {{ix + 1}}
            </time>
          </button>
      </div>

      <footer class="month">
        <button v-on:click="backToToday" id="today"
        :style="{visibility: todayNotVisible ? 'visible' : 'hidden'}"
        >
              Today
        </button>
        <span class='range-message'>{{rangeSelectionMessage}}</span>
        <button v-on:click="toggleRange" id="range">Range</button>
      </footer>
    </div>

    <div v-show="display=='year'" id="yearView" class="calendar year">
      <nav>
        <button id="prevYear" class="prev" v-on:click.prevent="prevYear">◀︎</button>
        <span class="month button">{{currentSelection.begin.strftime('%Y')}}</span>
        <button id="nextYear" class="next" v-on:click.prevent="nextYear">▶︎</button>
      </nav>

      <div class="month_grid">
        <button v-for = "oneMth in ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']"
        :key="oneMth">
              <time v-on:click.prevent="setSelectionFromMonth(oneMth);">{{oneMth}}</time>
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

export default {
  name: 'DatePicker',
  props: [],
  data: function () {
    const Day = this.$Day;
    return {
      range: new Day.Range(Day.today(), Day.today()),
      currentSelection: Day.current('MONTH'),
      today: Day.today().tag,
      rangeStatus: 0,
      display: 'none'
    };
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
    setRangeFromText (value) {
      const newRange = this.$Day.Range.parse(value);
      if (newRange == null) { return; }
      this.range = newRange; this.display = 'none';
    },
    setRangeFromDate (value) {
      const DayRange = this.$Day.Range;
      switch (this.rangeStatus) {
        case 0: this.range = new DayRange(value, value); this.display = 'none'; break;
        case 1: this.range = new DayRange(value, value); this.rangeStatus = 2; break;
        case 2: this.range = new DayRange(this.range.begin, value); this.rangeStatus = 0; this.display = 'none'; break;
      }
    },
    setSelectionFromMonth (value) {
      this.currentSelection = this.$Day.Range.parse(value + ' ' + this.currentSelection.begin.date.getFullYear());
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

<style scoped>
</style>

Vue.component('Datepicker',{
  name: 'lcmc-datepicker',
  template:'#datepicker-template',
  props: [],
  data: function () {
    return {
      range: new this.$Day.Range(Day.today(),Day.today()),
      currentSelection: this.$Day.current('MONTH'),
      today: this.$Day.today().tag,
      rangeStatus: 0,
      display: 'none'
    }
  },
  computed:{
    rangeDesc() {
      return this.range.toHumanName();
    },
    rangeBegin() {
      return this.range.begin.tag;
    },
    rangeEnd() {
      return this.range.end.tag;
    },
    daysInSelection() {
      return this.currentSelection.arrayOf('DAY');
    },
    todayNotVisible(){
      return !(this.currentSelection.encompasses(this.$Day.today()));
    },
    rangeSelectionMessage(){
      return ['', 'Pick start date', 'Pick end date'][this.rangeStatus];
    }
  },
  methods:{
    setRangeFromText(value){
      const newRange = this.$Day.Range.parse(value);
      if (newRange == null){ return; }
      this.range = newRange; this.display='none';
    },
    setRangeFromDate(value){
      const DayRange = this.$Day.range;
      switch (this.rangeStatus){
        case 0: this.range = new DayRange(value,value); this.display='none'; break;
        case 1: this.range = new DayRange(value,value); this.rangeStatus=2; break;
        case 2: this.range = new DayRange(this.range.begin,value); this.rangeStatus=0; this.display='none'; break;
      }
    },
    setSelectionFromMonth(value){
      this.currentSelection = this.$Day.Range.parse(value + ' ' + this.currentSelection.begin.date.getFullYear());
      this.display='month';
    },
    nextMonth(){
      this.currentSelection = this.currentSelection.begin.next('MONTH');
    },
    prevMonth(){
      this.currentSelection = this.currentSelection.begin.last('MONTH');
    },
    nextYear(){
      // Enforce selection to 1st month of selected year
      const selectedYear = this.currentSelection.begin.next('YEAR');
      this.currentSelection = selectedYear.begin.relative('MONTH');
    },
    prevYear(){
      // Enforce selection to 1st month of selected year
      const selectedYear = this.currentSelection.begin.last('YEAR');
      this.currentSelection = selectedYear.begin.relative('MONTH');
    },
    backToToday(){
      // return month view to current month
      this.currentSelection = Day.current('MONTH');
    },
    toggleRange(){
      // enable/disable the Range Selection mode
      this.rangeStatus = [1,0,0][this.rangeStatus];
    }
  }
});
