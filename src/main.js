/*
 * -----------------------------------------
 *  requireds
 * - - - - - - - - - - - - - - - - - - - - -
 */
import Vue from 'vue';
Vue.config.productionTip = false;

/*
 * -----------------------------------------
 *  components
 * - - - - - - - - - - - - - - - - - - - - -
 */
const registeredComponents = {
  ComponentA: () => import('./components/ComponentA'),
  ComponentB: () => import('./components/ComponentB'),
  ComponentC: () => import('./components/ComponentC')
};
console.log(registeredComponents);

/*
 * -----------------------------------------
 *  global styles
 * - - - - - - - - - - - - - - - - - - - - -
 */
import './assets/styles/index.css';

/*
 * -----------------------------------------
 *  setup
 * - - - - - - - - - - - - - - - - - - - - -
 */
const mountComponent = (element, componentName) => {
  const component = registeredComponents[componentName];
  new Vue({
    render: h => h(component)
  }).$mount(element);
};

/*
 * -----------------------------------------
 *  init
 * - - - - - - - - - - - - - - - - - - - - -
 */
// const event = 'load';
const event = 'DOMContentLoaded';
window.addEventListener(event, eve => {
  // console.log(eve);
  const vueComponents = document.querySelectorAll('[vue-component]');
  // console.log(vueComponents);
  vueComponents.forEach(element => {
    const vueComponentName = 'Component' +
      element.getAttribute('vue-component');
    // console.log(vueComponentName);
    mountComponent(element, vueComponentName);
  });
}, false);
