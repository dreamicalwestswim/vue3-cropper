# vue3-cropper
基于vue3.x开发的图片裁剪组件,可用于图片裁剪 

## 说明
不依赖任何第三方库，纯手工打造，功能强大，使用灵活。


1. 裁剪框尺寸可修改可固定；
2. 支持双指操作缩放图片大小，单指操作拖拽图片；
3. 可选择图片输出格式；
4. 可选择文件输出格式；
5. 可选择图片的质量；
6. 支持图片旋转；
7. 还原默认状态；
8. 展示输出图片的尺寸;
9. 支持两种裁剪模式(原图模式、缩放模式)默认采用原图模式
10. 自动识别图片方向，校正图片角度(主要针对有exif方向属性的图片，一般是照片图片才有这个属性)
11. 自动压缩图片尺寸，防止手机端超过2000像素以上的图片滑动卡顿现象。

### Demo
[地址](https://dreamicalwestswim.github.io/vue3-cropper/demo/)

## 安装
```
npm install vue3-cropper -S
or
yarn add vue3-cropper
```

## 引入
```
import { createApp } from 'vue'
import Cropper from "vue3-cropper";
import 'vue3-cropper/lib/vue3-cropper.css';

const app = createApp(App)
app.use(Cropper)

```

#### 简易示例 - 选取本地图片进行裁剪
```
<input type="file" accept="image/*" @change="onChange"/>
    <img v-if="previewImage" :src="previewImage" alt="预览图" style="max-width: 100%; max-height: 100%;">
    <Cropper v-if="cropperVisible"
             :imagePath="imagePath"
             fileType="blob"
             @save="onSave"
             @cancel="onCancel"
    />
```
```
import {reactive, toRefs} from 'vue'
const URL = window.URL || window.webkitURL;
export default {
  setup() {
    const state = reactive({
      cropperVisible: false,
      imagePath: '',
      previewImage: null
    })

    const onChange = (e) => {
      const file = e.target.files[0]
      state.imagePath = URL.createObjectURL(file);
      state.cropperVisible = true
    };

    const onSave = (res) => {
      if(typeof res === 'string')
      {
        state.previewImage = res
      } else {
        state.previewImage = URL.createObjectURL(res)
      }
      state.cropperVisible = false
    };

    const onCancel = () => {
      state.cropperVisible = false
    };

    return {
      ...toRefs(state),
      onChange,
      onSave,
      onCancel
    };
  }
}
```

#### Props
 tips:  
 选择图片后浏览器自动刷新问题：  
 这个问题是由于图片太大，超过了浏览器内存限制，被浏览器强制刷新释放内存导致的，可以适当的调整maxImgSize小一些，
 内部会根据这个值创建一个图片进行裁剪(主要是手机端，pc一般不会出现这个问题)
 
 截图质量：  
 如果要无损图可以设置imageType="image/png", 图片不会进行任何压缩，缺点是体积太大.  
 
如果觉得截取的图片太大，可以设置imageType="image/jpeg"，调整图片质量quality 0-1 数字越小图片质量越差,体积也会越小.

透明图片：  
设置imageType="image/png"，其他格式不支持透明

截图尺寸,清晰度问题:  
默认输出原图尺寸，截取的部分是相对原图的那部分的尺寸,优点高清损耗低，缺点体积过大。  
如果需要缩放尺寸,设置mode="scale" 就是图片缩放后在裁剪框内的那部分尺寸, 优点体积小，缺点损耗大


  参数  | 说明 | 类型 | 默认值
 ---- | ----- | ------ | ------  
 cropSize  | 裁剪框默认大小 | Number | 150 
 imagePath  | 裁剪图路径(可以是本地图片、图片数据源、远程图片需配置跨域) | string |   
 fileType  | 输出文件的类型(base64、blob) | String | base64   
 imageType  | 输出图片的格式(image/jpeg、image/png、image/webp)其中 image/webp 只有 chrome 才支持 | String | image/jpeg   
 quality  | 输出图片的质量(0-1)并且只在格式为 image/jpeg 或 image/webp 时才有效，如果参数值格式不合法，将会被忽略并使用默认值。 | Number | .9
 fixedBox  | 固定裁剪框,设置true裁剪框不可修改 | Boolean | false
 showOutputSize  | 展示输出图片的尺寸 | boolean | true
 mode  | 裁剪模式(scale 缩放模式)，不设置则按照原图尺寸输出 | String |
 maxImgSize  | 图片最大尺寸(超过这个值会被自动压缩在这个范围内，保证手机端移动不会出现卡顿现象,如果不需要限制设置成null) | Number | 2000

#### Event

  参数  | 说明 | 类型 | 默认值
 ---- | ----- | ------ | ------  
 cancel  | 点击取消触发 | Function |  
 save  | 点击裁剪,处理完毕后触发,并携带裁剪好的图片数据 | (res)=>{} |  
 
  #### 2021-01-17 重大更新
  新增图片最大尺寸限制：maxImgSize    解决移动端超大图片拖动卡顿现象。  
  新增自动识别图片方向，利用图片原始数据手动校正图片角度，避开浏览器校正， 解决各平台图片显示角度不一致的问题。  
  优化了裁剪流程，减少了canvas的使用。
 
 #### 2021-01-10 更新
 新增裁剪模式mode="scale" 按照缩放后的尺寸输出图片。默认按照原图尺寸输出图片，
