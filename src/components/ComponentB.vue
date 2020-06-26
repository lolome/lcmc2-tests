<template>
  <div
    class="component-b">
    Component B
  </div>
</template>

<script>

/*
 * -----------------------------------------
 *  component
 * - - - - - - - - - - - - - - - - - - - - -
 */
export default {
  name: 'ConponentB',
  props: {
    msg: String
  }
};

</script>

<style>

  .component-b {
    margin: 40px;
    padding: 40px;
    border: 1px solid #0f0;
  }

</style>
