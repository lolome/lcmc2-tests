/*
 * -----------------------------------------
 *  requireds
 * - - - - - - - - - - - - - - - - - - - - -
 */

// Libraries
import Day from '@/libs/day/day';

import Vue from 'vue';
// The below will integrate our day library to any Vue component.
Object.defineProperty(Vue.prototype, '$Day', { value: Day });
Vue.config.productionTip = false;

/*
 * -----------------------------------------
 *  components
 * - - - - - - - - - - - - - - - - - - - - -
 */

const registeredComponents = {
  ErrorComponent: () => import('./components/Error'),
  ComponentA: () => import('./components/ComponentA'),
  ComponentB: () => import('./components/ComponentB'),
  ComponentC: () => import('./components/ComponentC'),
  DatePicker: () => import('./components/DatePicker')
};
// console.log(registeredComponents);

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
  // console.log('Component:', component);
  if (typeof component !== 'undefined') {
    new Vue({
      render: h => h(component)
    }).$mount(element);
  } else {
    new Vue({
      render: h => h(
        registeredComponents.ErrorComponent,
        {
          props: {
            message: `Component “${componentName}” is undefined!`
          }
        })
    }).$mount(element);
  }
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
    const vueComponentName = element.getAttribute('vue-component');
    // console.log(vueComponentName);
    mountComponent(element, vueComponentName);
  });
}, false);
