<template>
  <div>
    <lazy-component v-if="properties.config.lazyLoading && lazyLoadActive" @show="handler">
      <div :class="loadedStyle" :style="container">
        <Canvas v-if="properties.blurhash" :blurhash="properties.blurhash" :loaded="loaded" />

        <div class="cloudimage-background-content" style="position: relative; zIndex: 2 ">
          <slot></slot>
        </div>
      </div>
    </lazy-component>
    <div v-else :class="loadedStyle" :style="container">
      <Canvas v-if="properties.blurhash" :blurhash="properties.blurhash" :loaded="loaded" />

      <div class="cloudimage-background-content" style="position: relative; zIndex: 2 ">
        <slot></slot>
      </div>
    </div>
    <div v-if="processed">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { isServer, processReactNode } from "cloudimage-responsive-utils";
import styles from "./background.styles";
import { getFilteredBgProps } from "./utils.js";
import Canvas from "./Canvas.vue";
export default {
  components: {
    Canvas
  },
  // geting the data from the provider
  inject: ["cloudProvider"],
  props: {
    src: String,
    params: String,
    styles: Object,
    blurhash: String
  },
  data() {
    return {
      server: isServer(),
      cloudimgURL: "",
      lazyLoadActive: true,
      processed: false,
      loaded: false,
      data: "",
      properties: {
        src: this.src,
        params: this.params ? this.params : undefined,
        config: this.cloudProvider.config,
        style: this.styles,
        blurhash: this.blurhash
      },
      container: "",
      previewBgWrapper: "",
      previewBg: "",
      className: "",
      lazyLoadConfig: "",
      otherProps: "",
      loadedStyle: ""
    };
  },
  mounted() {
    if (this.server) return;
    const style = this.properties.style;
    const { className } = getFilteredBgProps(this.properties);
    const cloudimgURL = this.data.cloudimgURL;
    this.className = className;

    //initial loading style
    this.loadedStyle = [this.className, "cloudimage-background", "loading"];
    //initial value container style
    this.container = styles.container({ style, cloudimgURL });
    this.processBg();
  },

  methods: {
    handler(component) {
      const style = this.properties.style;
      const cloudimgURL = this.data.cloudimgURL;
      const loaded = this.loaded;

      this.lazyLoadActive = false;
      //initial value container style
      this.container = styles.container({ style, cloudimgURL });
    },
    processBg(update, windowScreenBecomesBigger) {
      const bgNode = this.$el;
      const data = processReactNode(
        this.properties,
        bgNode,
        update,
        windowScreenBecomesBigger,
        false
      );

      if (data) {
        this.data = data;
      }
    },
    preLoadImg(cloudimgURL) {
      const img = new Image();

      img.onload = this.onImgLoad;
      img.src = cloudimgURL;
    },

    onImgLoad() {
      this.loaded = true;
    }
  },
  watch: {
    "properties.config.innerWidth": function(newVal, oldVal) {
      const style = this.properties.style;
      const cloudimgURL = this.data.cloudimgURL;
      const previewCloudimgURL = this.data.previewCloudimgURL;
      const loaded = this.loaded;

      if (this.server) return;

      const {
        config: { innerWidth }
      } = this.properties;

      if (oldVal !== innerWidth) {
        //if width changed update the data from proccesing background image
        this.processBg(true, innerWidth > oldVal);
      }

      //updating value of container style if width changed
      this.container = styles.container({ style, cloudimgURL });
    },
    "properties.src": function(newVal, oldVal) {
      const { src } = this.properties;
      if (src !== oldVal.src) {
        this.processBg();
      }
    },
    loaded: function(newVal) {
      const style = this.properties.style;
      const cloudimgURL = this.data.cloudimgURL;
      const previewCloudimgURL = this.data.previewCloudimgURL;
      const loaded = newVal;
      if (loaded) {
        //if loaded change style to loaded
        this.loadedStyle = [this.className, "cloudimage-background", "loaded"]
          .join(" ")
          .trim();
        //updating value of container style if page loaded
        this.container = styles.container({ style, cloudimgURL });
      } else {
        //if still loading change to loading
        this.loadedStyle = [this.className, "cloudimage-background", "loading"]
          .join(" ")
          .trim();
      }
    },

    lazyLoadActive: function() {
      if (!this.lazyLoadActive) {
        const {
          config: { delay }
        } = this.cloudProvider;

        if (typeof delay !== "undefined") {
          setTimeout(() => {
            this.preLoadImg(this.data.cloudimgURL);
          }, delay);
        } else {
          this.preLoadImg(this.data.cloudimgURL);
        }
      }
    }
  }
};
</script>
