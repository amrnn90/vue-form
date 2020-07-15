import {
  reactive,
  inject,
  computed,
  // ref,
  watch,
  toRefs,
  isRef,
  // onMounted,
} from "@vue/composition-api";
import _ from "./utils/lodash";

export default function useFormField(
  name,
  { label, onFocus, unsetIfNull = false } = {}
) {
  // onFocus = onFocus || onFocusDefault;
  onFocus = onFocus || (() => {});

  const form = inject("FORM");

  // const el = ref(null);

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
      return { id: state.name, name: state.name, value: state.value };
    }),

    value: computed(() => {
      return _.get(form.fields, state.name);
    }),

    initialValue: computed(() => {
      return _.get(form.initialFields, state.name);
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
        Object.keys(form.errors).filter((key) =>
          key.startsWith(state.name + ".")
        ).length > 0
      );
    }),

    hasErrorOrHasDescendentsError: computed(() => {
      return state.hasError || state.hasDescendentsError;
    }),

    isTouched: computed(() => {
      return !!form.touched[state.name];
    }),

    isUpdated: computed(() => {
      return !_.isEqual(
        normalizeValue(state.initialValue),
        normalizeValue(state.value)
      );
    }),
  });

  function onInput(evOrValue) {
    let newValue;
    if (evOrValue && typeof evOrValue === "object" && evOrValue.target) {
      newValue = evOrValue.target.value;
    } else {
      newValue = evOrValue;
    }

    newValue = normalizeValue(newValue);

    form.setField(state.name, newValue);
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

  // function onFocusDefault() {
  //   const input =
  //     el.value &&
  //     el.value.querySelector(
  //       "input:not([type=hidden]):not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex], [contenteditable]"
  //     );
  //   if (!input) return;
  //   input.focus();
  //   input.scrollIntoView({ block: "nearest" });
  // }

  function normalizeValue(value) {
    return Object.is(value, undefined) ||
      value === null ||
      value === false ||
      value === "" ||
      (value.constructor === Object && Object.keys(value).length === 0) ||
      (value.constructor === Array && value.length === 0)
      ? null
      : value;
  }

  watch(
    () => form.waitingForErrorFocus,
    (newState) => {
      if (newState && state.hasErrorOrHasDescendentsError) {
        focus();
        if (!state.hasDescendentsError) {
          form.cancelWaitForErrorFocus();
        }
      }
    },
    { immediate: true }
  );

  watch(
    () => state.name,
    (newName) => {
      const value = normalizeValue(form.getField(newName));
      form.setInitialField(newName, value);
    },
    {
      immediate: true,
    }
  );

  watch(
    () => state.value,
    (newValue) => {
      const value = normalizeValue(newValue);
      if (value === null && unsetIfNull) {
        return form.unsetField(state.name);
      }

      if (value !== newValue) {
        return form.setField(state.name, value);
      }
    },
    {
      immediate: true,
      deep: true,
    }
  );

  // onMounted(function() {
  //   el.value = this.$el;
  // });

  return reactive({
    ...toRefs(state),
    ...{
      reset,
      focus,
    },
  });
}
