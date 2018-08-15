{
  /**
   * @customElement
   * @polymer
   * @extends {Polymer.Element}
   */
  class SwipeableColors extends Polymer.Element {
    static get is() {
      return 'swipeable-colors';
    }

    static get properties() {
      return {
        /**
         * List of background colors.
         * @type {Array}
         */
        backgrounds: {
          type: Array,
        },

        /**
         * Ratio resulting of the division of the translatedPixels by the layer width.
         */
        translateRatio: {
          type: Number,
        },

        /**
         * Selected background.
         */
        selected: {
          type: Number,
        },

        /**
         * Next selected index.
         */
        nextSelected: {
          type: Number,
        },

        /**
         * Sets how much a slide has to be moved to set the opacity of the current slide to 0.
         * The greater the value, the soonest the background-color transform will happen.
         */
        backgroundTransitionSensitivity: {
          type: Number,
          value: 1.5,
        },

        /**
         * Set to true when a slide is beign dragged.
         */
        isDragging: {
          type: Boolean,
          value: false,
        },

        _currentBackgroundOpacity: {
          type: Number,
          computed: '_computeCurrentBackgroundOpacity(translateRatio)',
        },

        _currentBackgroundColor: {
          type: String,
          computed: '_getBackground(selected, backgrounds)',
        },

        _nextBackgroundColor: {
          type: String,
          computed: '_getBackground(nextSelected, backgrounds)',
        },
      };
    }

    _computeCurrentBackgroundOpacity(translateRatio) {
      const notTranslated = (translateRatio === 0);
      const value = parseFloat((1 - (translateRatio * this.backgroundTransitionSensitivity)).toFixed(2));
      const opacity = (value >= 0) ? value : 0; // prevent opacity to be less than 0
      return notTranslated ? 1 : opacity;
    }

    _getBackground(index, backgrounds) {
      if (backgrounds) {
        return backgrounds[index];
      }
    }
  }

  customElements.define(SwipeableColors.is, SwipeableColors);
}
