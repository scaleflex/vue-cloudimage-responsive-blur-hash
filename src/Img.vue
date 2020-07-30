<template>
  <div>
    <lazy-component
      v-if="properties.config.lazyLoading && lazyLoadActive"
      @show="handler"
    >
      <div v-bind:class="loadedStyle" :style="picture">
        <Canvas
          v-if="properties.blurhash"
          :blurhash="properties.blurhash"
          :loaded="loaded"
        />
        <img
          v-bind:alt="alt"
          :style="imgStyle"
          v-bind:ratio="otherProps.ratio"
          v-bind:src="data.cloudimgURL"
          @load="onImgLoad"
          :srcset="cloudimgSRCSET"
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
        v-bind:alt="alt"
        :style="imgStyle"
        v-bind:ratio="otherProps.ratio"
        v-bind:src="data.cloudimgURL"
        @load="onImgLoad"
        :srcset="cloudimgSRCSET"
      />
    </div>
    <img v-if="server" :alt="alt" :src="BASE_64_PLACEHOLDER" />
  </div>
</template>

<script>
import { isServer, processReactNode } from 'cloudimage-responsive-utils';
import { BASE_64_PLACEHOLDER } from 'cloudimage-responsive-utils/dist/constants';
import Canvas from './Canvas.vue';

import { getFilteredProps } from './utils';
import styles from './img.styles';

export default {
  components: {
    Canvas
  },
  // geting the data from the provider
  inject: ['cloudProvider'],
  props: {
    src: String,
    ratio: Number,
    sizes: Object,
    params: String,
    blurhash: String
  },
  data() {
    return {
      server: isServer(),
      BASE_64_PLACEHOLDER,
      lazyLoadActive: true,
      cloudimgURL: '',
      processed: false,
      loaded: false,
      loadedImageWidth: '',
      loadedImageHeight: '',
      loadedImageRatio: '',
      data: '',
      properties: {
        src: this.src,
        ratio: this.ratio,
        sizes: this.sizes,
        blurhash: this.blurhash,
        params: this.params,
        config: this.cloudProvider.config
      },
      alt: '',
      className: '',
      lazyLoadConfig: '',
      preserveSize: '',
      imgNodeWidth: '',
      imgNodeHeight: '',
      otherProps: '',
      cloudimgSRCSET: '',
      imgStyle: '',
      picture: '',
      loadedStyle: '',
      height: { height: 0 }
    };
  },
  mounted() {
    if (this.server) return;

    const {
      alt,
      className,
      lazyLoadConfig,
      preserveSize,
      imgNodeWidth,
      imgNodeHeight,
      ...otherProps
    } = getFilteredProps(this.properties);
    const operation = this.data.operation;
    const preview = this.data.preview;
    const loaded = this.loaded;
    const previewLoaded = this.previewLoaded;

    //initial loading style
    this.loadedStyle = [this.className, 'cloudimage-background', 'loading']
      .join(' ')
      .trim();
    //initial value image style
    this.imgStyle = styles.img({ preview, loaded, operation });
    //initial value picture style
    this.picture = styles.picture({
      preserveSize,
      imgNodeWidth,
      imgNodeHeight,
      ratio: this.data.ratio || this.loadedImageRatio,
      previewLoaded,
      loaded
    });

    const {
      config: { delay }
    } = this.cloudProvider;

    if (typeof delay !== 'undefined') {
      setTimeout(() => {
        this.processImg();
      }, delay);
    } else {
      this.processImg();
    }

    //the value from filter and passing to data
    this.alt = alt;
    this.className = className;
    this.lazyLoadConfig = lazyLoadConfig;
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
        .join(', ');
      this.cloudimgSRCSET = cloudimgSRCSET;
    }
  },
  methods: {
    handler(component) {
      this.lazyLoadActive = false;
    },
    processImg(update, windowScreenBecomesBigger) {
      const imgNode = this.$el;

      const data = processReactNode(
        this.properties,
        imgNode,
        update,
        windowScreenBecomesBigger,
        false
      );

      if (data) {
        this.data = data;
      }
    },

    onPreviewLoaded(event) {
      if (this.previewLoaded) return;

      this.updateLoadedImageSize(event.target);
      this.previewLoaded = true;
    },

    updateLoadedImageSize(image) {
      this.loadedImageWidth = image.naturalWidth;
      this.loadedImageHeight = image.naturalHeight;
      this.loadedImageRatio = image.naturalWidth / image.naturalHeight;
    },

    onImgLoad(event) {
      this.updateLoadedImageSize(event.target);
      this.loaded = true;
    }
  },
  watch: {
    'properties.config.innerWidth': function(newVal, oldVal) {
      if (this.server) return;
      const operation = this.data.operation;
      const preview = this.data.preview;
      const loaded = this.loaded;
      const { preserveSize, imgNodeWidth, imgNodeHeight } = getFilteredProps(
        this.properties
      );
      const previewLoaded = this.previewLoaded;

      const {
        config: { innerWidth }
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
        loaded
      });
    },

    'properties.src': function(newVal, oldVal) {
      const { src } = this.properties;
      if (src !== oldVal.src) {
        this.processImg();
      }
    },

    loaded: function(newVal) {
      const operation = this.data.operation;
      const preview = this.data.preview;
      const loaded = newVal;
      const { preserveSize, imgNodeWidth, imgNodeHeight } = getFilteredProps(
        this.properties
      );
      const previewLoaded = this.previewLoaded;

      if (loaded) {
        //if loaded change style to loaded
        this.loadedStyle = [this.className, 'cloudimage-background', 'loaded']
          .join(' ')
          .trim();
        // updating img style if page loaded
        this.imgStyle = styles.img({ preview, loaded, operation });
        // updating picture style if page loaded
        this.picture = styles.picture({
          preserveSize,
          imgNodeWidth,
          imgNodeHeight,
          ratio: this.data.ratio || this.loadedImageRatio,
          previewLoaded,
          loaded
        });
      } else {
        //if still loading change to loading
        this.loadedStyle = [this.className, 'cloudimage-background', 'loading']
          .join(' ')
          .trim();
      }
    }
  }
};
</script>
