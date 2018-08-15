/**
 * @customElement
 * @polymer
 * @extends {Polymer.Element}
 */
class SwipeablePages extends Polymer.Element {
  static get is() {
    return 'swipeable-pages';
  }

  static get properties() {
    return {
      /**
       * Index of the selected page.
       */
      selected: {
        type: Number,
        value: 0,
        notify: true,
      },

      /**
       * Computed tab label and background color for each page.
       * The value is set from data attribues of the child nodes in light DOM.
       *
       * Example:
       * <cells-swipeable-tab-pages>
       *   <div data-label="Tab 1" data-background="#7043C4"></div>
       * </cells-swipeable-tab-pages>
       */
      _pagesData: {
        type: Array,
      },

      /**
       * Duration of the slide transition in milliseconds.
       */
      transitionDuration: {
        type: Number,
        value: 300,
      },

      /**
       * Timing function for the translate transition.
       */
      transitionTimingFunction: {
        type: String,
        value: 'ease-out',
      },

      /**
       * The value used to decide if a transition is effective and therefore the page is swiped.
       */
      threshold: {
        type: Number,
        value: 0.2,
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
       * Set to true to enable cycling between the first and last slides.
       */
      cycle: {
        type: Boolean,
        value: false,
      },

      /**
       * Set to true to disable the slider (swiping and changing page).
       */
      disabled: {
        type: Boolean,
        value: false,
      },

      /**
       * Number of visible tabs per slide.
       */
      tabsPerSlide: {
        type: Number,
        value: 3,
      },

      _centerTabPosition: {
        type: Number,
        computed: '_computeCenterTabPosition(tabsPerSlide, _pagesData)',
      },

      _tabPercentageWidth: {
        type: Number,
        computed: '_computeTabPercentageWidth(tabsPerSlide, _pagesData)',
        observer: '_tabPercentageWidthChanged',
      },

      /**
       * Returns the ratio resulting of the division of the translatedPixels by the layer width.
       */
      translateRatio: {
        type: Number,
        value: 0,
        readOnly: true,
        notify: true,
      },

      /**
       * Returns the index of the next selected slide depending on the dragging direction.
       */
      nextSelected: {
        type: Number,
        readOnly: true,
        notify: true,
      },

      _tabLabels: {
        type: Array,
      },

      /**
       * Returns if the dragging is horizontal.
       */
      isHorizontalDragging: {
        type: Boolean,
        value: false,
        readOnly: true,
        notify: true,
      }
    };
  }

  static get observers() {
    return [
      '_selectedChanged(selected, _pagesData)',
    ];
  }

  connectedCallback() {
    super.connectedCallback();
    this._boundTrackHandler = this._trackHandler.bind(this);
    this._setTabsAndBackgrounds();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.$.slider.removeEventListener('track', this._boundTrackHandler);
  }

  /**
   * Updates the internal references for the child nodes (slides).
   * Use this method to reflect the changes made in `data-label` and/or `data-background` attributes.
   */
  updateSlides() {
    this._setTabsAndBackgrounds();
  }

  _setTabsAndBackgrounds() {
    const nodes = [ ...this.children ];

    if (nodes.length) {
      const hasTabsData = nodes.every(node => node.dataset.label);

      if (hasTabsData) {
        this._pagesData = nodes.map(node => ({
          label: node.dataset.label,
          background: node.dataset.background || '',
        }));

        this._backgrounds = this._pagesData.map(page => page.background);
        this._tabLabels = this._pagesData.map(page => page.label);

        this.$.slider.addEventListener('track', this._boundTrackHandler);
      }
    }
  }

  get _previousSlideIndex() {
    const previousSlideIndex = this.selected - 1;
    const lastSlideIndex = this._pagesData.length - 1;
    const isFirstSlideInCycleMode = (this.cycle && previousSlideIndex === -1);
    return (isFirstSlideInCycleMode) ? lastSlideIndex : previousSlideIndex;
  }

  get _nextSlideIndex() {
    const nextSlideIndex = this.selected + 1;
    const isLastSlideInCycleMode = (this.cycle && nextSlideIndex === this._pagesData.length);
    return (isLastSlideInCycleMode) ? 0 : nextSlideIndex;
  }

  get _tabs() {
    if (!this.__tabs) {
      this.__tabs = this.shadowRoot.querySelector('#tabs');
    }

    return this.__tabs;
  }

  /**
   * Sets the center tab position to half of the tabsPerSlide when tabsPerSlide is not a pair number (5 / 2 => 2,5 => 2)
   * or to the half of tabsPerSlide minus 0.5 when tabsPerSlide is a pair number (4 / 2 => 2 => 1.5)
   */
  _computeCenterTabPosition(tabsPerSlide, pagesData) {
    if (pagesData) {
      const isOdd = tabsPerSlide % 2;
      return (isOdd)
          ? Math.floor(tabsPerSlide / 2)
          : (tabsPerSlide / 2) - 0.5;
    }
  }

  _computeTabPercentageWidth(tabsPerSlide, pagesData) {
    if (pagesData) {
      return Math.round(100 / tabsPerSlide);
    }
  }

  _tabPercentageWidthChanged(tabPercentageWidth) {
    this.updateStyles({
      '--cells-private_tabs-flex': `1 0 ${tabPercentageWidth}%`
    });
  }

  _trackHandler(e) {
    const actions = {
      start: this._onTrackStart.bind(this),
      track: this._onTrack.bind(this),
      end: this._onTrackEnd.bind(this),
    };

    actions[e.detail.state](e.detail);
  }

  _onTrackStart(e) {
    const {dy: translatedPixelsY, dx: translatedPixelsX} = e;
    this._setIsHorizontalDragging(Math.abs(translatedPixelsY) < Math.abs(translatedPixelsX));
  }

  _onTrack(e) {
    if (this.$.slider.trackEnabled && this.isHorizontalDragging) {
      const translatedPixels = e.dx;
      this.__setNextSelected(translatedPixels);
      this.__setTranslateRatio(translatedPixels);
    }
  }

  __setNextSelected(translatedPixels) {
    const isDraggingToRight = (translatedPixels > 0);
    const nextSelected = (isDraggingToRight)
        ? this._previousSlideIndex
        : this._nextSlideIndex;
    this._setNextSelected(nextSelected);
  }

  __setTranslateRatio(translatedPixels) {
    this._setTranslateRatio(Math.abs(translatedPixels) / this.$.slider.sliderWidth);
  }

  _onTrackEnd() {
    this._setIsHorizontalDragging(false);
    this._setTranslateRatio(0);
  }

  _selectedChanged(selected, pagesData) {
    if (!pagesData) {
      return;
    }

    if (!this._tabs) {
      Polymer.flush(); // ensure that content inside dom-if is rendered
    }

    const multiplier = this._centerTabPosition - selected;
    const translation = this._tabPercentageWidth * multiplier;
    this._tabs.style.transform = `translateX(${translation}%)`;
  }
}

customElements.define(SwipeablePages.is, SwipeablePages);
