<template>
  <div id="app">
    <base-form @submit="onSubmit" #default="{form}">
      <base-form-field name="title" #default="{inputProps, inputListeners}">
        <input type="text" v-bind="inputProps" v-on="inputListeners" />
      </base-form-field>

      <button :disabled="form.hasErrors">Submit</button>
      <pre>{{ form }}</pre>
    </base-form>
  </div>
</template>

<script>
import { BaseForm } from "../../src/";
import BaseFormField from "./BaseFormField";

export default {
  name: "App",
  components: {
    BaseForm,
    BaseFormField,
  },
  methods: {
    onSubmit({ data, onSuccess, onError }) {
      setTimeout(() => {
        if (!data.title) {
          return onError({ title: "must not be empty" });
        }
        alert(JSON.stringify(data, null, 2));
        onSuccess();
      }, 500);
    },
  },
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
  max-width: 500px;
  margin: 60px auto;
}
</style>
