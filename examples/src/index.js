import Vue from 'vue';
import App from './App.vue';
import './assets/style.css';
import VueLazyload from 'vue-lazyload';

Vue.use(VueLazyload, {
  lazyComponent: true
});

new Vue({
  el: '#app',
  render: h => h(App)
});
