/**
 * Creates a custom toggle switch component.
 * Essentially a more fancy checkbox.
 */
const SWITCH_MARGIN = 5;

class Switch extends HTMLElement {
  constructor() {
    super();

    this._switch = null;
    this._value = false;
    this._resizeObserver = new ResizeObserver(() => {
      this.initSwitchSize();
      this.updateSwitch();
    });

    Object.defineProperty(this, "value", {
      get() {
        // prevent injection
        return this._value ? true : false;
      },
      set(value) {
        this._value = value;
        this.updateSwitch();
      },
      enumerable: true,
      configurable: false,
    });
  }

  connectedCallback() {
    this.initRender();
    this._resizeObserver.observe(this);

    this.value =
      this.getAttribute("value") === "true" ||
      this.getAttribute("value") === "1";
    if (!this.value) {
      this.setAttribute("value", "false");
    }
  }

  disconnectedCallback() {
    this._resizeObserver.disconnect();
  }

  initRender() {
    this.innerHTML = `<div class="switch-inner"></div>`;
    this._switch = this.querySelector(".switch-inner");
    this.initSwitchSize();

    // setup events
    this.addEventListener("click", (e) => {
      this.value = !this.value;
    });
  }

  initSwitchSize() {
    if (!this._switch) return;

    const height = this.getBoundingClientRect().height;
    this._switch._sizeRatio = height - SWITCH_MARGIN * 2;
    this._switch.style.width = this._switch._sizeRatio + "px";
    this._switch.style.height = this._switch._sizeRatio + "px";
    this._switch.style.margin = SWITCH_MARGIN + "px";
  }

  updateSwitch() {
    this.setAttribute("value", this.value);

    if (this.value) {
      const hostWidth = this.getBoundingClientRect().width;
      const knobSize = this._switch._sizeRatio + SWITCH_MARGIN * 2;

      this._switch.style.transform = `translateX(${hostWidth - knobSize}px)`;
    } else {
      this._switch.style.transform = `translateX(0px)`;
    }
  }
}

customElements.define("i-switch", Switch);
