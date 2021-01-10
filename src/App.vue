<template>
  <div class="home">
    <input type="file" accept="image/*" @change="onChange"/>
    <img v-if="previewImage" :src="previewImage" alt="预览图" style="max-width: 100%; max-height: 100%;">
    <Cropper v-if="cropperVisible"
             :imagePath="imagePath"
             fileType="blob"
             mode="scale"
             @save="onSave"
             @cancel="onCancel"
    />
  </div>
</template>

<script>


import {reactive, toRefs} from 'vue'

export default {
  name: 'App',
  setup() {
    const state = reactive({
      cropperVisible: false,
      imagePath: '',
      previewImage: null
    })

    const onChange = (e) => {
      const file = e.target.files[0]
      const reader = new FileReader();
      reader.onload = () => {
        state.imagePath = reader.result;
        state.cropperVisible = true
      };
      reader.readAsDataURL(file);
    };

    const onSave = (res) => {
      if(typeof res === 'string')
      {
        state.previewImage = res
      } else {
        state.previewImage = window.URL.createObjectURL(res)
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
</script>

<style lang="scss">

</style>
