// hookable mixin.

// hookable means the Vue component may be initialized with external params from outside Vue.
// The mixin provides the component with an 'initial' String prop, which can be addressed at
// the component's 'mounted' entry point.

// When inserting the component in the DOM, provide a 'data' attribute with your initial value.
// This will be addressed by the montComponent code in main.js

export default {
  props: { initial: String }
};
