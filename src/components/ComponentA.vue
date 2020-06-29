<template>
  <div
    class="component-a">
    Today’s date is {{$Day.today().strftime('%d %b, %Y')}}.<br>
    Today’s week ends on {{$Day.today().endOf('WEEK').strftime('%d %b, %Y')}}.<br>
    The current month has {{$Day.current('MONTH').arrayOf('DAY').length}} days.<br>
  </div>
</template>

<script>

/*
 * -----------------------------------------
 *  component
 * - - - - - - - - - - - - - - - - - - - - -
 */

export default {
  name: 'ConponentA',
  props: {
    msg: String
  }
};

</script>

<style>

  .component-a {
    margin: 40px;
    padding: 40px;
    border: 1px solid #f00;
  }

</style>
