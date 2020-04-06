<template>
  <form @submit.prevent="onSubmit">
    <slot :form="form"></slot>
  </form>
</template>

<script>
import { reactive, computed, provide } from "@vue/composition-api";
import _ from "./utils/lodash";
import lastPromise from "./utils/last-promise";

export default {
  props: {
    item: { type: Object, default: null },
    validate: { type: Function, default: null },
  },
  setup(props, { emit }) {
    const lastValidatePromise = lastPromise();

    const form = reactive({
      fields: _.cloneDeep(props.item) || {},
      initialFields: {},
      touched: {},
      errors: {},
      hasErrors: computed(
        () => Object.values(form.errors).filter((error) => !!error).length > 0
      ),
      waitingForErrorFocus: false,
      isValidating: false,
      isSubmitting: false,
      hasSubmitted: false,
      runValidate: runValidate,
      getField: getField,
      initField: initField,
      setField: setField,
      setTouched: setTouched,
      cancelWaitForErrorFocus: cancelWaitForErrorFocus,
    });

    provide("FORM", form);

    function onSubmit() {
      form.hasSubmitted = true;
      clearErrors();

      const runSubmit = () => {
        form.isSubmitting = true;
        const onSuccess = () => {
          form.isSubmitting = false;
        };

        const onError = (errors) => {
          setErrors(errors);
          form.isSubmitting = false;
          waitForErrorFocus();
        };

        emit("submit", {
          data: form.fields,
          onSuccess,
          onError,
        });
      };

      runValidate().then(() => {
        if (form.hasErrors) {
          waitForErrorFocus();
          return;
        }
        runSubmit();
      });
    }

    function clearErrors() {
      form.errors = {};
    }

    function setErrors(errors) {
      errors = { ...(errors || {}) };
      form.errors = form.hasSubmitted
        ? errors
        : _.pick(errors, Object.keys(form.touched));
    }

    function waitForErrorFocus() {
      form.waitingForErrorFocus = true;
      setTimeout(() => {
        cancelWaitForErrorFocus();
      }, 500);
    }

    function cancelWaitForErrorFocus() {
      form.waitingForErrorFocus = false;
    }

    function runValidate() {
      form.isValidating = true;

      return lastValidatePromise(
        props.validate ? props.validate(form.fields, form.errors) : form.errors
      ).then((errors) => {
        form.isValidating = false;
        setErrors(errors);
        return errors;
      });
    }

    function getField(name) {
      return _.get(form.fields, name);
    }

    function initField(name) {
      const current = _.cloneDeep(getField(name));
      if (!(name in Object.keys(form.initialFields))) {
        const newInitialFields = { ...form.initialFields };
        newInitialFields[name] = valueShouldBeNulled(current) ? null : current;
        form.initialFields = newInitialFields;
      }
      setField(name, current);
    }

    function setField(name, newValue) {
      const newFields = { ...form.fields };
      _.set(newFields, name, valueShouldBeNulled(newValue) ? null : newValue);
      form.fields = newFields;
      form.errors = { ..._.omit(form.errors, [name]) };
    }

    function setTouched(name) {
      form.touched = { ...form.touched, [name]: true };
    }

    function valueShouldBeNulled(value) {
      return (
        Object.is(value, undefined) ||
        value === null ||
        value === false ||
        value === "" ||
        (value.constructor === Object && Object.keys(value).length === 0) ||
        (value.constructor === Array && value.length === 0)
      );
    }

    return { form, onSubmit };
  },
};
</script>
