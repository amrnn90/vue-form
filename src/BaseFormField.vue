<template>
  <div ref="el" class="base-form-field">
    <label :for="field.name" class="base-form-field__label">
      {{ field.label }}
    </label>

    <slot
      :input-props="field.inputProps"
      :input-listeners="field.inputListeners"
      class="base-form-field__input"
    />

    <div v-if="field.error" class="base-form-field__error">
      {{ field.error }}
    </div>
  </div>
</template>

<script>
import useFormField from "./useFormField";

export default {
  props: {
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default: null,
    },
  },
  setup(props) {
    const field = useFormField(props.name, {
      label: props.label,
    });

    return { field };
  },
};
</script>

<style></style>
