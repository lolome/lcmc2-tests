<template>
  <div
    class="component-c">
    Component C
  </div>
</template>

<script>

/*
 * -----------------------------------------
 *  component
 * - - - - - - - - - - - - - - - - - - - - -
 */
export default {
  name: 'ConponentC',
  props: {
    msg: String
  }
};

</script>

<style scoped>

  .component-c {
    margin: 40px;
    padding: 40px;
    border: 1px solid #00f;
  }

</style>
