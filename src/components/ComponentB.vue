<template>
  <div
    class="component-b">
    Component B
    <div class="bg-yellow-300 text-red-500">
      This is a Taiwind test. Backgroud should be set as yellow, and text should be red.
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
