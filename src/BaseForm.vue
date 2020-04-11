<template>
  <form @submit.prevent="onSubmit">
    <slot :form="form"></slot>
  </form>
</template>

<script>
import { reactive, computed, provide, onMounted } from "@vue/composition-api";
import _ from "./utils/lodash";
import lastPromise from "./utils/last-promise";

export default {
  props: {
    item: { type: Object, default: null },
    validate: { type: Function, default: null }
  },
  setup(props, { emit }) {
    const lastValidatePromise = lastPromise();

    const form = reactive({
      fields: _.cloneDeep(props.item) || {},
      initialFields: {},
      touched: {},
      errors: {},
      hasErrors: computed(
        () => Object.values(form.errors).filter(error => !!error).length > 0
      ),
      waitingForErrorFocus: false,
      isValidating: false,
      isSubmitting: false,
      hasSubmitted: false,
      runValidate: runValidate,
      getField: getField,
      setInitialField: setInitialField,
      setField: setField,
      unsetField: unsetField,
      setTouched: setTouched,
      cancelWaitForErrorFocus: cancelWaitForErrorFocus
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

        const onError = errors => {
          setErrors(errors);
          form.isSubmitting = false;
          waitForErrorFocus();
        };

        emit("submit", {
          data: form.fields,
          onSuccess,
          onError
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
      ).then(errors => {
        form.isValidating = false;
        setErrors(errors);
        return errors;
      });
    }

    function getField(name) {
      return _.get(form.fields, name);
    }

    function setInitialField(name, value) {
      if (!(name in form.initialFields)) {
        // TODO: use Vue3 reactivity
        const newInitialFields = { ...form.initialFields };
        newInitialFields[name] = _.cloneDeep(value);
        form.initialFields = newInitialFields;
      }
      setField(name, value);
    }

    function setField(name, newValue) {
      // TODO: use Vue3 reactivity
      const newFields = { ...form.fields };
      _.set(newFields, name, newValue);
      form.fields = newFields;
      form.errors = { ..._.omit(form.errors, [name]) };
    }

    function unsetField(name) {
      if (!_.has(form.fields, name)) return;

      // TODO: use Vue3 reactivity
      const newFields = { ...form.fields };
      _.unset(newFields, name);
      form.fields = newFields;
      form.errors = { ..._.omit(form.errors, [name]) };
    }

    function setTouched(name) {
      form.touched = { ...form.touched, [name]: true };
    }

    // after all fields have run initField()
    onMounted(() => {
      form.initialFields = {
        ...form.initialFields,
        ..._.cloneDeep(form.fields)
      };
    });

    return { form, onSubmit };
  }
};
</script>
