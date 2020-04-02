import {
  reactive,
  inject,
  computed,
  ref,
  watch,
  toRefs,
  isRef,
  onMounted,
} from "@vue/composition-api";
import _ from "./utils/lodash";

export default function useFormField(
  name,
  { label, onFocus, getValue, setValue } = {}
) {
  onFocus = onFocus || onFocusDefault;

  const form = inject("FORM");

  const el = ref(null);

  const state = reactive({
    name: computed(() => {
      return isRef(name) ? name.value : name;
    }),
    label: computed(() => {
      const val = isRef(label) ? label.value : label;
      return val || state.name;
    }),
    inputListeners: computed(() => {
      return { input: onInput, blur: onBlur };
    }),

    inputProps: computed(() => {
      return { id: state.name, name: state.name, value: state.passedValue };
    }),

    value: computed(() => {
      return _.get(form.fields, name);
    }),

    passedValue: computed(() => {
      return typeof getValue === "function"
        ? getValue(state.value)
        : state.value;
    }),

    initialValue: computed(() => {
      const val = _.get(form.initialFields, state.name);
      return Object.is(val, undefined) ? null : val;
    }),

    isEmpty: computed(() => {
      return _.get(state.value, "length") === 0;
    }),

    error: computed(() => {
      const errors = form.errors[state.name];
      return errors && (Array.isArray(errors) ? errors[0] : errors);
    }),

    hasError: computed(() => {
      return !!state.error;
    }),

    hasDescendentsError: computed(() => {
      return (
        Object.keys(form.errors).filter(key => key.startsWith(state.name + "."))
          .length > 0
      );
    }),

    hasErrorOrHasDescendentsError: computed(() => {
      return state.hasError || state.hasDescendentsError;
    }),

    isTouched: computed(() => {
      return !!form.touched[state.name];
    }),

    isUpdated: computed(() => {
      return !_.isEqual(state.initialValue, state.value);
    }),
  });

  form.initField(state.name);

  function onInput(evOrValue) {
    let newValue;
    if (evOrValue && typeof evOrValue === "object" && evOrValue.target) {
      newValue = evOrValue.target.value;
    } else {
      newValue = evOrValue;
    }

    // newValue = this.isTranslatable
    // ? { ...(this.value || {}),[this.sharedForm.locale]: newValue }
    // : newValue;

    form.setField(
      state.name,
      typeof setValue === "function" ? setValue(newValue) : newValue
    );
  }

  function onBlur() {
    form.runValidate();
    form.setTouched(state.name);
  }

  function reset() {
    onInput(_.cloneDeep(state.initialValue));
  }

  function focus() {
    const onFocusVal = isRef(onFocus) ? onFocus.value : onFocus;
    if (typeof onFocusVal === "function") {
      onFocusVal();
    }
  }

  function onFocusDefault() {
    const input =
      el.value &&
      el.value.querySelector(
        "input:not([type=hidden]):not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex], [contenteditable]"
      );
    if (!input) return;
    input.focus();
    input.scrollIntoView({ block: "nearest" });
  }

  watch(
    () => form.waitingForErrorFocus,
    newState => {
      if (newState && state.hasErrorOrHasDescendentsError) {
        focus();
        if (!state.hasDescendentsError) {
          form.cancelWaitForErrorFocus();
        }
      }
    },
    { immediate: true }
  );

  onMounted(function() {
    el.value = this.$el;
  });

  return reactive({
    ...toRefs(state),
    ...{
      reset,
      focus,
    },
  });
}
