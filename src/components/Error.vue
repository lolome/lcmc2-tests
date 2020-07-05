<template>
  <div
    class="m-8 px-8 py-5 bg-red-600 text-white rounded-md">
    ERROR: {{ message }}
  </div>
</template>

<script>

/*
 * -----------------------------------------
 *  component
 * - - - - - - - - - - - - - - - - - - - - -
 */

export default {

  name: 'ErrorComponent',

  props: {
    message: String
  }

};

</script>
