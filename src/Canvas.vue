<template>
  <canvas ref="canvas" :width="32" :height="32" :style="style" />
</template>

<script>
import { blurHashImgStyes as styles } from "cloudimage-responsive-utils";
import { blurhash } from 'cloudimage-responsive-utils';
export default {
  props: { blurhash: String, loaded: Boolean },
  data() {
    return {
      style: '',

      properties: {
        blurhash: this.blurhash
      }
    };
  },
  mounted() {
    const loaded = this.loaded;

    const pixels = blurhash.decode(this.properties.blurhash, 32, 32);

    const canvas = this.$refs.canvas;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, 32, 32);
    this.style = styles.canvas({ loaded });
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  },

  watch: {
    loaded: function(newVal) {
      const loaded = newVal;
      this.style = styles.canvas({ loaded });
    }
  }
};
</script>
