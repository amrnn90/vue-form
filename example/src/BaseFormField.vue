<template>
  <div ref="el">
    <label :for="field.name">{{ field.label }}</label>
    <slot
      :input-props="field.inputProps"
      :input-listeners="field.inputListeners"
    />
    <div v-if="field.error">{{ field.error }}</div>
  </div>
</template>

<script>
import { useFormField } from "../../src";

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
