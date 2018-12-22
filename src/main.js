import Vue from 'vue'

import { Button, Row, Col } from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue';

//Vue.component(Button.name, Button);
//Vue.component(Select.name, Select);

Vue.use(Button)
Vue.use(Row)
Vue.use(Col)

new Vue({
    el: '#app',
      render: h => h(App)
})
