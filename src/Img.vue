<template>
  <img v-if="server" :alt="properties.alt" />
  <lazy-component
    v-else-if="!server && properties.config.lazyLoading && lazyLoadActive"
    @show="handler"
  >
    <div v-bind:class="loadedStyle" :style="picture">
      <Canvas
        v-if="properties.blurhash"
        :blurhash="properties.blurhash"
        :loaded="loaded"
      />
      <img
        v-bind:alt="properties.alt"
        :style="imgStyle"
        v-bind:ratio="otherProps.ratio"
        @load="_onImgLoad"
      />
    </div>
  </lazy-component>
  <div v-else v-bind:class="loadedStyle" :style="picture">
    <Canvas
      v-if="properties.blurhash"
      :blurhash="properties.blurhash"
      :loaded="loaded"
    />
    <img
      v-bind:alt="properties.alt"
      :style="imgStyle"
      v-bind:ratio="otherProps.ratio"
      v-bind:src="data.cloudimgURL"
      @load="_onImgLoad"
      :srcset="cloudimgSRCSET"
    />
  </div>
</template>

<script>
import { isServer, processReactNode, generateAlt } from "cloudimage-responsive-utils";
import Canvas from "./Canvas.vue";

import { getFilteredProps } from "./utils";
import { blurHashImgStyes as styles } from "cloudimage-responsive-utils";

export default {
  components: {
    Canvas,
  },
  // geting the data from the provider
  inject: ["cloudProvider"],
  props: {
    src: {
      type: String,
      default: undefined,
      required: true,
    },
    width: {
      type: String,
      default: undefined,
    },
    height: {
      type: String,
      default: undefined,
    },
    params: {
      type: String,
      default: undefined,
    },
    sizes: {
      type: Object,
      default: undefined,
    },
    ratio: {
      type: Number,
    },
    alt: {
      type: String,
    },
    className: {
      type: String,
    },
    blurhash: {
      type: String,
    },
    onImgLoad: {
      type: Function,
      default: undefined,
    },
    doNotReplaceURL: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      server: isServer(),
      lazyLoadActive: true,
      cloudimgURL: "",
      processed: false,
      loaded: false,
      loadedImageWidth: "",
      loadedImageHeight: "",
      loadedImageRatio: "",
      data: "",
      properties: {
        src: this.src,
        width: this.width,
        height: this.height,
        params: this.params,
        sizes: this.sizes,
        ratio: this.ratio,
        blurhash: this.blurhash,
        alt: this.alt || generateAlt(this.src),
        className: this.className,
        config: this.cloudProvider.config,
        onImgLoad: this.onImgLoad,
        doNotReplaceURL: this.doNotReplaceURL
      },

      preserveSize: "",
      imgNodeWidth: "",
      imgNodeHeight: "",
      otherProps: "",
      cloudimgSRCSET: "",
      imgStyle: "",
      picture: "",
      loadedStyle: "",
    };
  },
  mounted() {
    if (this.server) return;
    const operation = this.data.operation;
    const preview = this.data.preview;
    const loaded = this.loaded;
    const previewLoaded = this.previewLoaded;
    const {
      preserveSize,
      imgNodeWidth,
      imgNodeHeight,
      ...otherProps
    } = getFilteredProps(this.properties);

    //initial loading style
    this.loadedStyle = `${this.className} cloudimage-background loading`
      .trim();

    //initial value image style
    this.imgStyle = styles.img({ preview, loaded, operation });
    //initial value picture style
    this.picture = styles.picture({
      preserveSize,
      imgNodeWidth,
      imgNodeHeight,
      ratio: this.data.ratio || this.loadedImageRatio || this.properties.ratio,
      previewLoaded,
      loaded,
    });

    const {
      config: { delay },
    } = this.cloudProvider;

    if (typeof delay !== "undefined") {
      setTimeout(() => {
        this.processImg();
      }, delay);
    } else {
      this.processImg();
    }

    //the value from filter and passing to data

    this.preserveSize = preserveSize;
    this.imgNodeWidth = imgNodeWidth;
    this.imgNodeHeight = imgNodeHeight;
    this.otherProps = { ...otherProps };
  },
  updated() {
    //srcset value after processing image
    if (this.data.cloudimgSRCSET) {
      const cloudimgSRCSET = this.data.cloudimgSRCSET
        .map(({ dpr, url }) => `${url} ${dpr}x`)
        .join(", ");
      this.cloudimgSRCSET = cloudimgSRCSET;
    }
  },
  methods: {
    handler(component) {
      setTimeout(() => {
        this.lazyLoadActive = false;
      }, 100);
    },
    processImg(update, windowScreenBecomesBigger) {
      const imgNode = this.$el;

      const data = processReactNode(
        this.properties,
        imgNode,
        update,
        windowScreenBecomesBigger,
      );

      if (data) {
        //if size is defined so data is defined if not error well appear
        this.data = data;
      }
    },

    updateLoadedImageSize(image) {
      this.loadedImageWidth = image.naturalWidth;
      this.loadedImageHeight = image.naturalHeight;
      this.loadedImageRatio = image.naturalWidth / image.naturalHeight;
    },

    _onImgLoad(event) {
      this.updateLoadedImageSize(event.target);
      this.loaded = true;

      const { onImgLoad } = this.properties;
      if (typeof onImgLoad === "function") {
        onImgLoad(event);
      }
    },
  },
  watch: {
    "properties.config.innerWidth": function (newVal, oldVal) {
      if (this.server) return;
      const operation = this.data.operation;
      const preview = this.data.preview;
      const loaded = this.loaded;
      const { preserveSize, imgNodeWidth, imgNodeHeight } = getFilteredProps(
        this.properties
      );
      const previewLoaded = this.previewLoaded;

      const {
        config: { innerWidth },
      } = this.properties;

      if (oldVal !== innerWidth) {
        //if width changed update the data from proccesing image
        this.processImg(true, innerWidth > oldVal);
      }

      //updating value of image style if width changed
      this.imgStyle = styles.img({ preview, loaded, operation });
      //updating value of picture style if width changed
      this.picture = styles.picture({
        preserveSize,
        imgNodeWidth,
        imgNodeHeight,
        ratio: this.data.ratio || this.loadedImageRatio,
        previewLoaded,
        loaded,
      });
    },

    "properties.src": function (newVal, oldVal) {
      const { src } = this.properties;
      if (src !== oldVal.src) {
        this.processImg();
      }
    },

    loaded: function (newVal) {
      const operation = this.data.operation;
      const preview = this.data.preview;
      const loaded = newVal;
      const { preserveSize, imgNodeWidth, imgNodeHeight } = getFilteredProps(
        this.properties
      );
      const previewLoaded = this.previewLoaded;

      if (loaded) {
        // updating img style if page loaded
        this.imgStyle = styles.img({ preview, loaded, operation });
        // updating picture style if page loaded
        this.picture = styles.picture({
          preserveSize,
          imgNodeWidth,
          imgNodeHeight,
          ratio: this.data.ratio || this.loadedImageRatio,
          previewLoaded,
          loaded,
        });
      }

      this.loadedStyle = `${this.className} cloudimage-background ${loaded ? 'loaded' : 'loading'}`
        .trim();
    },
  },
};
</script>
