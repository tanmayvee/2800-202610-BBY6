/**
 * Creates a input element that automatically validates its value.
 */
class VInput extends HTMLElement {
  constructor() {
    super();

    this._input = null;
    this._value = "";
  }

  connectedCallback() {
    this.innerHTML = `<input/>`;
    this._input = this.querySelector("input");

    // pass all attributes to this._input
    for (let i = 0; i < this.attributes.length; i++) {
      const attr = this.attributes.item(i);
      this._input.setAttribute(attr.name, attr.value);
    }
  }

  /**
   * Sets the value of the input to a specified value.
   *
   * @param {*} value Value to be set
   */
  setValue(value) {
    // No point in casting here
    this._input.value = value;
  }

  /**
   * Safely gets the value of the user input and automatically
   * casts the value. Add a layer of safety against injection.
   *
   * @param {*} opt_fallbackValue Fallback value to return if the input is invalid
   * @return Casted Input Value
   */
  getValue(opt_fallbackValue) {
    const type = this._input.type;
    let value = this._input.value;

    const shouldTrim = this.getAttribute("trim") === "true";
    const isRequired = this.getAttribute("required") === "true";
    const min = this.getAttribute("min") ?? this.getAttribute("minlength");
    const max = this.getAttribute("max") ?? this.getAttribute("maxlength");
    const pattern = this.getAttribute("pattern");

    // Only handle the main types we would use for this project
    switch (type) {
      case "number":
      case "range": {
        value = Number(value);
        if (isNaN(value)) value = 0;
        if (max !== null) value = Math.min(Number(max), value);
        if (min !== null) value = Math.max(Number(min), value);
        break;
      }
      case "email":
      case "password":
      case "text": {
        value = String(value);
        if (shouldTrim) value = value.trim();
        if (min !== null && value.length < Number(min)) {
          return opt_fallbackValue ?? null;
        }
        if (max !== null) {
          value = value.substring(0, Number(max));
        }

        if (isRequired && value.length === 0) return opt_fallbackValue ?? null;

        if (pattern) {
          const regex = new RegExp(`^${pattern}$`);
          if (!regex.test(value)) return opt_fallbackValue ?? null;
        }
        break;
      }
      default:
        console.warn("Casting input into unsupported type!", this);
        return value;
    }

    if (type === "email") {
      // Standard HTML5 email validation regex according to
      // stackoverflow.com/questions/62415313/how-to-make-html5-email-validation-regex-work-in-c
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

      if (!emailRegex.test(value)) return opt_fallbackValue ?? null;
    }

    return value;
  }
}

customElements.define("v-input", VInput);
