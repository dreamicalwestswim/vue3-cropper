import { createApp } from 'vue'
import App from './App.vue'
import Cropper from "./components";

const app = createApp(App)
app.use(Cropper)

app.mount('#app')
