<template>
  <div
    class="component-a">
    Component A
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
