<template>
  <ul class="editor-options-container">
    <template v-for="(option, categoryKey) in optionsTypes">
      <li :id="categoryKey" style="margin-bottom:60px;" :data-category="$parent.$parent.getName(categoryKey)"
          :data-header="$parent.$parent.getName(categoryKey)" @load="loadTitleClick(categoryKey)">
        <h1 class="editor-options-title" style="cursor:pointer;" @click="listHeaderClick">
          {{ $parent.$parent.getName(categoryKey) }} Options
          <component :is="collapseComponent(categoryKey)"
                     :data-category="$parent.$parent.getName(categoryKey)"
                     :data-icon="titleClick[camelCase(categoryKey)] ? 'up' : 'down'"/>
        </h1>
        <template v-for="(value, key) in option">
          <li v-if="checkOptionType(value, categoryKey) === 'slider'" :id="value.name" ref="listItems" class="lists-inputs" :data-category="$parent.$parent.getName(value.category)">
            <label :for="value.name" class="label-text" style="text-transform: capitalize;">{{ $parent.$parent.getName(value.name) }} :<Help v-if="value.help" class="tooltip" style="color: blue !important;" :size="14"><span class="tooltiptext">{{ value.help }}</span></Help></label>
            <input  :value="checkOptionValue(value, 'slider')"
                    type="range"
                    class="range-slider__range"
                    :name="value.name"
                    :max="value.value.max"
                    :min="value.value.min"
                    :step="value.value.steps"
                    @input="onInput($event, 'slider', value)"
                    @change="onChange($event, 'slider', value)"
                    @mouseup="onMouseUp($event, 'slider', value)">
            <span class="range-slider__value" style="display:none;"></span>
          </li>
          <li v-if="checkOptionType(value, categoryKey) === 'dropdownArray'" :id="value.name" ref="listItems" class="lists-inputs" :data-category="$parent.$parent.getName(value.category)">
            <label :for="value.name" class="label-text" style="text-transform: capitalize;">{{ $parent.$parent.getName(value.name) }} :<Help v-if="value.help" class="tooltip" style="color: blue !important;" :size="14"><span class="tooltiptext">{{ value.help }}</span></Help></label>
            <select :name="value.name"
                    @change="onChange($event, 'dropdownArray', value)">
              <template v-for="(valueOption, index) in value.value">
                <option :value="checkOptionValue(value, 'dropdownArray', valueOption)" :selected="value.saveValue === valueOption ? true : editor.getOption(value.name) === valueOption ? true : null">{{ valueOption }}</option>
              </template>
            </select>
          </li>
          <li v-if="checkOptionType(value, categoryKey) === 'dropdownObject'" :id="value.name" ref="listItems" class="lists-inputs" :data-category="$parent.$parent.getName(value.category)">
            <label :for="value.name" class="label-text" style="text-transform: capitalize;">{{ $parent.$parent.getName(value.name) }} :<Help v-if="value.help" class="tooltip" style="color: blue !important;" :size="14"><span class="tooltiptext">{{ value.help }}</span></Help></label>
            <select :name="value.name"
                    @change="onChange($event, 'dropdownObject', value)">
              <template v-for="(valueOption, index) in value.value">
                <option :value="checkOptionValue(value, 'dropdownObject', valueOption.value)" :selected="value.saveValue === valueOption.value ? true : editor.getOption(value.name) === valueOption.value ? true : null">{{ valueOption.value }}</option>
              </template>
            </select>
          </li>
          <li v-if="checkOptionType(value, categoryKey) === 'checkbox'" :id="value.name" ref="listItems" class="lists-inputs" :data-category="$parent.$parent.getName(value.category)">
            <label :for="value.name" class="label-text" style="text-transform: capitalize;">{{ $parent.$parent.getName(value.name) }} :<Help v-if="value.help" class="tooltip" style="color: blue !important;" :size="14"><span class="tooltiptext">{{ value.help }}</span></Help></label>
            <input  type="checkbox"
                    class="error"
                    :name="value.name"
                    :checked="checkOptionValue(value, 'checkbox')"
                    @change="onChange($event, 'checkbox', value)">
          </li>
        </template>
      </li>
    </template>
  </ul>
</template>

<!--suppress JSUnresolvedReference -->
<script>
import _ from 'lodash';
import CollapseDown from '@apostrophecms/vue-material-design-icons/MenuDown.vue';
import CollapseUp from '@apostrophecms/vue-material-design-icons/MenuUp.vue';
import Help from '@apostrophecms/vue-material-design-icons/HelpCircleOutline.vue';

/**
 * @typedef optionsTypes
 * @prop {String} name - Options Name
 * @prop {String | Array} type - Options Types either that accept string value of `string`, `number` and/or `boolean`
 * @prop {Object[] | Array | Object | String | Null} value - Default value of options
 * @prop {String} category - Category of options
 */

/**
 * @typedef aceEditor
 * @prop {Ace} Ace - Ace Constructor Object
 * @prop {aceEditor} editor - Ace Editor Initialized
 * @see {@link https://ace.c9.io/#nav=api} API Reference
 */

/**
 * @component OptionsContainerComponent
 * @desc Options Container Component that will generate options and compare from module options
 * @lifecycle created Get `options` from `this.getOptions` async function that call server GET route to get current user saved options
 * @lifecycle mounted Attach emit listener **on** for `customCodeEditor:getOptions` to `this.updateOptions`
 * @lifecycle beforeDestroy Attach emit listener **off** for `customCodeEditor:getOptions` to `this.updateOptions`
 * @lifecycle render Only render when `this.editor` & `this.optionsTypes` is available
 */
export default {
  components: {
    CollapseDown,
    CollapseUp,
    Help
  },

  props: {

    /**
     * @vprop {optionsTypes} optionsTypes - Default Options Types
     */
    optionsTypes: {
      type: Object,
      required: true
    },

    /**
     * @vprop {Object[]} cache - Cache Storage
     */
    cache: {
      type: Array,
      required: true
    },

    /**
     * @vprop {aceEditor} editor - Ace Editor JS
     */
    editor: {
      type: Object
    },

    /**
     * @vprop {String} search - Search input
     */
    search: {
      type: String
    }
  },

emits: ['updateOptionsTypes', 'resetCache', 'pushCache', 'updateCache'],

  data() {
    return {
      /**
       * @member {Object} - To store original options
       */
      originalOptions: {},
      /**
       * @member {Object} - To grab modified custom-code-editor module for editor options
       */
      options: {},
      /**
       * @member {Object.<Boolean>} - Title Click Check
       */
      titleClick: {}
    };
  },

  async mounted() {
    // Event Removed: https://v3-migration.vuejs.org/breaking-changes/events-api.html#_2-x-syntax
    // this.$root.$on('customCodeEditor:getOptions', this.updateOptions);
    if (!this.options || Object.keys(this.originalOptions).length === 0) {
      // if options || originalOptions is null on mount, it means the component
      // is dynamically rendered on the client. Perform a
      // client-side fetch instead.
      try {
        const options = await this.getOptions();

        if (Object.keys(this.originalOptions).length === 0) {
          this.originalOptions = _.assign({}, _.cloneDeep(this.editor.getOptions()), _.isUndefined(apos.customCodeEditor.browser, `fieldAce.${this.$parent.field.name}`) ? !_.isUndefined(apos.customCodeEditor.browser.ace, 'options') ? apos.customCodeEditor.browser.ace.options : {} : !_.isUndefined(apos.customCodeEditor.browser.fieldAce[this.$parent.field.name], `options`) ? apos.customCodeEditor.browser.fieldAce[this.$parent.field.name].options : {});
        }

        if (options.status === 'error') {
          apos.notify(options.message, {
            dismiss: true,
            type: 'error'
          });
        }

        try {
          this.options = _.assign({}, this.options, JSON.parse(options.message));
        } catch (e) {
          apos.notify(e.message, {
            dismiss: true,
            type: 'error'
          });
        }

        this.$forceUpdate();
      } catch (err) {
        apos.notify(err, {
          dismiss: true,
          type: 'error'
        });
      }
    }
  },

  beforeUnmount() {
    // Event Removed: https://v3-migration.vuejs.org/breaking-changes/events-api.html#_2-x-syntax
    // this.$root.$off('customCodeEditor:getOptions', this.updateOptions);
    this.$emit('resetCache');
  },

  methods: {

    /**
     * @method collapseComponent component
     * @param {string} category
     * @returns {Object}
     */
    collapseComponent(category) {
      if(this.titleClick[category]) {
        return CollapseUp;
      } else {
        return CollapseDown;
      }
    },

    /**
     * @method camelCase
     * @param {string} val
     * @returns {string}
     */
    camelCase(val) {
      return _.camelCase(val);
    },

    /**
     * @method loadTitleClick
     * @param {string} key
     */
    loadTitleClick(key) {
      this.titleClick[_.camelCase(key)] = false;
    },

    /**
     * @method onInput
     * @param {Event} e - HTML Event
     * @param {string} type - Type of input either 'dropdownArray', 'dropdownObject', 'slider' or 'checkbox'
     * @param {Object} object - Options Types object
     */
    onInput(e, type, object) {
      switch (type) {
        case 'slider':
          const percent = (e.currentTarget.value - object.value.min) / (
              object.value.max - object.value.min);
          const newPos = (parseInt(getComputedStyle(e.currentTarget)
              .width) - e.currentTarget.style.marginLeft) * percent;
          e.currentTarget.nextElementSibling.style.left = newPos + 'px';
          e.currentTarget.nextElementSibling.style.display = null;
          e.currentTarget.nextElementSibling.innerHTML = e.currentTarget
              .value;
          break;
      }
    },

    /**
     * @method onChange
     * @param {Event} e - HTML Event
     * @param {string} type - Type of input either 'dropdownArray', 'dropdownObject', 'slider' or 'checkbox'
     * @param {Object} object - Options Types object
     */
    onChange(e, type, object) {
      switch (type) {
        case 'slider':
          e.target.setAttribute('value', e.currentTarget.value);
          this.editor.setOption(object.name, e.currentTarget.value);
          break;

        case 'dropdownArray':
          this.editor.setOption(object.name, e.currentTarget.value);
          break;

        case 'dropdownObject':
          const value = (e.currentTarget.value === 'true' || e.currentTarget
              .value === 'false') ? JSON.parse(e.currentTarget
              .value) : e.currentTarget.value;
          this.editor.setOption(object.name, value);
          break;

        case 'checkbox':
          if(e.currentTarget.checked) {
            this.editor.setOption(object.name, true);
          } else {
            this.editor.setOption(object.name, false);
          }
          break;
      }
    },

    /**
     * @method onMouseUp
     * @param {Event} e - HTML Event
     * @param {string} type - Type of input either 'dropdownArray', 'dropdownObject', 'slider' or 'checkbox'
     * @param {Object} object - Options Types object
     */
    onMouseUp(e, type, object) {
      switch (type) {
        case 'slider':
          e.currentTarget.nextElementSibling.style.display = 'none';
          break;
      }
    },

    /**
     * @method checkOptionValue
     * @param {Object} value value
     * @param {string} type
     * @param {any | undefined} val
     * @return {number | string}
     */
    checkOptionValue(value, type, val){
      let setValue;

      switch (type) {
        case 'slider':
          if(!_.isUndefined(value.saveValue)){
            setValue = value.saveValue;
            this.editor.setOption(value.name, value.saveValue);
          } else {
            setValue = this.editor.getOptions()[value.name] ? this.editor.getOption(value.name) : 0;
          }
          break;

        case 'dropdownArray':
          if(!_.isUndefined(value.saveValue) && value.saveValue === val) {
            this.editor.setOption(value.name, value.saveValue);
          }
          setValue = val;
          break;

        case 'dropdownObject':
          if(!_.isUndefined(value.saveValue) && value.saveValue === val) {
            this.editor.setOption(value.name, value.saveValue);
          }
          setValue = val.value;
          break;

        case 'checkbox':
          if(!_.isUndefined(value.saveValue)){
            setValue = value.saveValue;
            this.editor.setOption(value.name, value.saveValue);
          } else {
            setValue = this.editor.getOptions()[value.name] ? this.editor.getOption(value.name) : null;
          }
          break;
      }

      const cache = {
        [value.name]: (!_.isUndefined(value.saveValue)) ? value.saveValue : this.editor
            .getOptions()[value.name]
      }

      if (!this.cache.some(eachCache => Object.prototype.hasOwnProperty.call(eachCache, value.name))) {
        this.$emit('pushCache', cache);
      }

      return setValue
    },

    /**
     * @method checkOptionType
     * @param {{ name: string, type: string, value: { value: number, min: number, max: number, steps: number } | Object[] | string[] | string | null, category: string }} groupedOptions
     * @param {string} key
     */
    checkOptionType(groupedOptions, key) {
      let type;
      switch (true) {
        case _.isArray(groupedOptions.value) && !_.every(groupedOptions.value, _.isObject):
          groupedOptions = !_.isUndefined(this.options[key]) ? apos.util.assign(
              groupedOptions, {
                saveValue: this.options[key]
              }) : groupedOptions;

          type = 'dropdownArray';
          break;

        case _.isArray(groupedOptions.value) && _.every(groupedOptions.value, _.isObject):
          groupedOptions = !_.isUndefined(this.options[key]) ? apos.util.assign(
              groupedOptions, {
                saveValue: this.options[key]
              }) : groupedOptions;

          type = 'dropdownObject';
          break;

        case _.isObject(groupedOptions.value):
          groupedOptions = !_.isUndefined(this.options[key]) ? apos.util.assign(
              groupedOptions, {
                saveValue: this.options[key]
              }) : groupedOptions;

          type = 'slider';
          break;

        case groupedOptions.type === 'boolean':
          groupedOptions = !_.isUndefined(this.options[key]) ? apos.util.assign(
              groupedOptions, {
                saveValue: this.options[key]
              }) : groupedOptions;

          type = 'checkbox';
          break;
      }

      // Update Options Types Value
      this.$emit('updateOptionsTypes', {
        category: key,
        name: groupedOptions.name,
        saveValue: !_.isUndefined(this.options[key]) ? this.options[key] : undefined,
        value: groupedOptions.value
      });

      return type;
    },

    /**
     * @method getOptions
     * @desc ```js
     * // Example object returns
     * {
     *      status: 'success',
     *      message: '{"cursorStyle": true}'
     * }
     * // Example empty object returns
     * {
     *      status: 'empty',
     *      message: '{}'
     * }
     * ```
     * @async
     * @return {Object} - `options` object to override editor options
     */
    async getOptions() {
      try {
        return await apos.http.get(apos.customCodeEditor.browser.action + '/options', {});
      } catch (e) {
        console.warn('Unable to get options due to error:\n', e);
        throw new Error(e);
      }
    },

    /**
     * @method saveOptions
     * @desc ```js
     * // Example object returns
     * {
     *      status: 'success',
     *      message: 'Options saved!'
     * }
     * ```
     * @async
     * @param {Object} copyOptions - Grab `options` object from modified options container and save it to current user logged in
     * @return {Object} Returns status from server
     */
    async saveOptions(copyOptions) {
      try {
        return await apos.http.post(apos.customCodeEditor.browser.action + '/submit', {
          body: {
            [apos.customCodeEditor.alias]: copyOptions
          }
        });
      } catch (e) {
        console.warn('Save options ERROR', JSON.parse(e));
        throw new Error(JSON.parse(e));
      }
    },

    /**
     * @method deleteOptions
     * @desc ```js
     * // Example object returns
     * {
     *      status: 'success',
     *      message: 'Success delete options!'
     * }
     * ```
     * @async
     * @return {Object} Returns status delete options
     */
    async deleteOptions() {
      try {
        return await apos.http.delete(apos.customCodeEditor.browser.action +
            '/remove', {});
      } catch (e) {
        console.warn('Delete options ERROR', JSON.parse(e));
        throw new Error(JSON.parse(e));
      }
    },

    /**
     * @method buttonOptionsClick
     * @desc Trigger emits
     * @param {EventListener} e - HTML Event Listener
     */
    buttonOptionsClick(e) {
      const button = e.currentTarget;
      let allCopy = {};
      const inputEmits = {};
      const self = this;
      this.$refs.listItems.forEach(function (value, i) {
        const key = Object.keys(self.cache[i])[0];
        const cacheValue = self.cache[i];
        const input = value.querySelector('[name=\'' + value.id + '\']');

        // Detect changes by comparing all cache with incoming list arrays.
        // This will be useful and only executes if it not matches the cache value
        switch (true) {
          case (/select/g).test(input.type) && !_.isUndefined(cacheValue[input.name]):
            if (button.className === 'delete-options') {
              // Reset the cache first, then run checking
              self.$emit('updateCache', {
                property: input.name,
                value: self.originalOptions[input.name]
              });
            }

            // Transform the value
            const value = (input.options[input.selectedIndex].value === 'true' || input.options[input.selectedIndex].value === 'false') ? JSON.parse(input.options[input.selectedIndex].value) : input.options[input.selectedIndex].value;

            if (value !== cacheValue[input.name]) {
              let passValue = '';

              if (button.className === 'copy-options' || button.className ===
                  'save-options') {
                // Assign to local copy to pass it as local reference
                allCopy[input.name] = input.options[input.selectedIndex].value;

                // Pass Value to emit
                passValue = input.options[input.selectedIndex].value;
              } else if (button.className === 'undo-options') {
                // Revert to default value
                input.value = cacheValue[input.name];

                // Pass Value to emit
                passValue = cacheValue[input.name];

                // Delete assigned self.options
                delete self.options[key];

                // And reset options on editor
                self.editor.setOption(input.name, cacheValue[input.name]);
              } else if (button.className === 'delete-options') {
                // Revert to default value based on module options
                input.value = self.originalOptions[input.name];

                // Pass Value to emit
                passValue = self.originalOptions[input.name];

                // And reset options on editor
                self.editor.setOption(input.name, self.originalOptions[input.name]);
              }

              inputEmits[input.name] = {
                input,
                value: passValue,
                button,
                allCopy
              };
            }
            break;

          case (/range/g).test(input.type):
            if (button.className === 'delete-options') {
              // Reset the cache first, then run checking
              self.$emit('updateCache', {
                property: input.name,
                value: self.originalOptions[input.name]
              });
            }

            if (
                parseFloat(input.value) !== cacheValue[input.name] &&
                input.getAttribute('value') !== null
            ) {
              let passValue = '';

              if (button.className === 'copy-options' || button.className ===
                  'save-options') {
                // Assign to local copy to pass it as local reference
                allCopy[input.name] = parseFloat(input.value);

                // Pass Value to emit
                passValue = parseFloat(input.value);
              } else if (button.className === 'undo-options') {
                // Revert to default value
                input.value = cacheValue[input.name];

                // Pass value to emit
                passValue = cacheValue[input.name];

                // Display none on span value
                input.nextElementSibling.style.display = 'none';

                // Delete assigned self.options
                delete self.options[key];

                // And reset options on editor
                self.editor.setOption(input.name, cacheValue[input.name]);

                // Remove the attribute as default
                input.removeAttribute('value');
              } else if (button.className === 'delete-options') {
                // Revert to default value based on module options
                input.value = self.originalOptions[input.name];

                // Pass value to emit
                passValue = self.originalOptions[input.name];

                // Display none on span value
                input.nextElementSibling.style.display = 'none';

                // And reset options on editor
                self.editor.setOption(input.name, self.originalOptions[input.name]);

                // Remove the attribute as default
                input.removeAttribute('value');
              }

              inputEmits[input.name] = {
                input,
                value: passValue,
                button,
                allCopy
              };
            }
            break;

          case (/checkbox/g).test(input.type):
            if (button.className === 'delete-options') {
              // Reset the cache first, then run checking
              self.$emit('updateCache', {
                property: input.name,
                value: _.isUndefined(self.originalOptions[input.name]) ? false : self.originalOptions[input.name]
              });
            }

            if (input.checked !== cacheValue[input.name]) {
              if (button.className === 'copy-options' || button.className ===
                  'save-options') {
                allCopy[input.name] = input.checked;
              } else if (button.className === 'undo-options') {
                // Revert to default value
                input.checked = cacheValue[input.name];

                // Delete assigned self.options
                delete self.options[key];

                // And reset options on editor
                self.editor.setOption(input.name, cacheValue[input.name]);
              } else if (button.className === 'delete-options') {
                // Revert to default value based on module options
                input.checked = self.originalOptions[input.name];

                // And reset options on editor
                self.editor.setOption(input.name, self.originalOptions[input.name]);
              }

              inputEmits[input.name] = {
                input,
                value: input.checked,
                button,
                allCopy
              };
            }
            break;
        }
      });

      if (button.className === 'copy-options') {
        // Merge allCopy options
        if (Object.keys(self.options).length > 0) {
          allCopy = Object.assign(self.options, allCopy);

          // Loop and find if existing default saved options detected matches module options
          for (const key of Object.keys(self.originalOptions)) {
            if (Object.prototype.hasOwnProperty.call(self.originalOptions, key)) {

              // Only allow non-module options to be copy
              if (self.originalOptions[key] === allCopy[key]) {
                delete allCopy[key];
              }
            }
          }
        }

        // Will use clipboard.js, much more functional to all browsers
        button.dataset.clipboardText = JSON.stringify(allCopy);

        // Click again to copy the dataset
        button.click();
      } else if (button.className === 'save-options') {
        if (Object.keys(allCopy).length > 0) {
          self.saveOptions(allCopy).then((data) => {
            if (data.status === 'success') {
              return apos.notify(data.message, {
                dismiss: true,
                type: 'success'
              });
            }

            return apos.notify(data.message, {
              dismiss: true,
              type: 'error'
            });
          }).catch((e) => {
            return apos.notify('Unable to save options. Please try again', {
              type: 'error',
              dismiss: true
            });
          });
        } else {
          return apos.notify(
              'ERROR : Save unsuccessful, options empty. Try adjust your desire options than your default settings.', {
                type: 'error',
                dismiss: 8
              });
        }
      } else if (button.className === 'delete-options') {
        self.deleteOptions().then((result) => {
          if (result.status === 'success') {
            // Set self.options to be empty too
            self.options = {};

            // Loop the optionsTypes, if there is `saveValue` assigned to it, delete it
            for (const categoryKey of Object.keys(self.optionsTypes)) {
              if (Object.prototype.hasOwnProperty.call(self.optionsTypes, categoryKey)) {
                for (const key of Object.keys(self.optionsTypes[categoryKey])) {
                  if (!_.isUndefined(self.optionsTypes[categoryKey][key].saveValue)) {
                    self.$emit('updateOptionsTypes', {
                      category: categoryKey,
                      name: self.optionsTypes[categoryKey][key].name,
                      saveValue: undefined
                    });
                  }
                }
              }
            }

            return apos.notify('Saved options successfully removed', {
              type: 'success',
              dismiss: true
            });
          } else {
            return apos.notify('ERROR : ' + result.message, {
              type: 'error',
              dismiss: true
            });
          }
        }).catch((e) => {
          return apos.notify('ERROR : ' + e.message, {
            type: 'error',
            dismiss: true
          });
        });
      }

      if (Object.keys(inputEmits).length > 0) {
        for (const key in inputEmits) {
          if (Object.prototype.hasOwnProperty.call(inputEmits, key)) {
            self.emitOptions(inputEmits[key]);
          }
        }
      }
    },


    /**
     * @method
     * @desc When list header is clicked. `this.$forceUpdate()` triggers when done update titleClick[category]
     * @param {EventListener} e - HTML Event Click
     */
    listHeaderClick(e) {
      const category = _.camelCase(e.currentTarget.parentElement.dataset.category);
      const condition = this.titleClick[category];
      this.titleClick[category] = !condition;
      this.$forceUpdate();
    },

    /**
     * @method emitOptions
     * @desc Emit Events to `$root` by check the `input.type`
     * @param {HTMLElement} input
     * @param {string | boolean} value - Grab Options Value
     * @param {HTMLButtonElement} button
     * @param {Object} allCopy
     */
    emitOptions({ input, value, button, allCopy }) {
      // Emit event to alert other similar components
      switch (true) {
        case (/select/g).test(input.type):
          /**
           * @event component:OptionsContainerComponent~customCodeEditor:getOptions
           * @desc ```js
           * // This function emits on input type `select`
           * this.$root.$emit('customCodeEditor:getOptions', {
           * customCodeEditor: {
           *          field: this.$parent.field.name,
           *          input: input,
           *          name: input.name,
           *          value: value.toString(),
           *          action: button.className.replace('-options', '').trim(),
           *          options: allCopy,
           *          button: button
           *      }
           * });
           * ```
           */
          this.$root.$emit('customCodeEditor:getOptions', {
            customCodeEditor: {
              field: this.$parent.field.name,
              input,
              name: input.name,
              value: value.toString(),
              action: button.className.replace('-options', '').trim(),
              options: allCopy,
              button
            }
          });
          break;

        case (/range/g).test(input.type):
          /**
           * @event component:OptionsContainerComponent~customCodeEditor:getOptions
           * @desc ```js
           * // This function emits on input type `range`
           * this.$root.$emit('customCodeEditor:getOptions', {
           * customCodeEditor: {
           *          field: this.$parent.field.name,
           *          input: input,
           *          name: input.name,
           *          value: parseFloat(input.value),
           *          action: button.className.replace('-options', '').trim(),
           *          options: allCopy,
           *          button: button
           *      }
           * });
           * ```
           */
          this.$root.$emit('customCodeEditor:getOptions', {
            customCodeEditor: {
              field: this.$parent.field.name,
              input,
              name: input.name,
              value: parseFloat(input.value),
              action: button.className.replace('-options', '').trim(),
              options: allCopy,
              button
            }
          });
          break;

        case (/checkbox/g).test(input.type):
          /**
           * @event component:OptionsContainerComponent~customCodeEditor:getOptions
           * @desc ```js
           * // This function emits on input type `checkbox`
           * this.$root.$emit('customCodeEditor:getOptions', {
           * customCodeEditor: {
           *          field: this.$parent.field.name,
           *          input: input,
           *          name: input.name,
           *          value: input.checked,
           *          action: button.className.replace('-options', '').trim(),
           *          options: allCopy,
           *          button: button
           *      }
           * });
           * ```
           */
          this.$root.$emit('customCodeEditor:getOptions', {
            customCodeEditor: {
              field: this.$parent.field.name,
              input,
              name: input.name,
              value: input.checked,
              action: button.className.replace('-options', '').trim(),
              options: allCopy,
              button
            }
          });
          break;

      }
    },

    /**
     * @method updateOptions
     * @deprecated ApostropheCMS migrated Vue version https://v3-migration.vuejs.org/breaking-changes/events-api.html#_2-x-syntax
     * @desc Update Options whenever other similar OptionsContainer is modified
     * @param {Event} e - Vue Event Emitter
     * @fires component:OptionsContainerComponent~customCodeEditor:getOptions
     */
    updateOptions(e) {
      if (!_.isUndefined(e.customCodeEditor) && !_.isUndefined(e.customCodeEditor.value) && e.customCodeEditor.field !== this.$parent.field.name) {
        // Find input from this current component
        const input = this.$el.querySelector(`[name="${e.customCodeEditor.input.name}"]`);

        switch (e.customCodeEditor.input.type) {
          case 'checkbox':
            input.checked = e.customCodeEditor.value;
            break;

          default:
            input.value = e.customCodeEditor.value;
            input.removeAttribute('value');
        }

        if (e.customCodeEditor.action) {
          const copyButton = this.$parent.$el.querySelector('button.copy-options');
          switch (e.customCodeEditor.action) {
            case 'copy':
              copyButton.dataset.clipboardText = JSON.stringify(e.customCodeEditor.options);
              break;

            case 'undo':
              // Remove self.options[key] if available
              if (this.options[e.customCodeEditor.name]) {
                delete this.options[e.customCodeEditor.name];
              }
              copyButton.dataset.clipboardText = JSON.stringify(this.options);
              break;

            case 'delete':
              if (this.options) {
                this.options = {};
                delete copyButton.dataset.clipboardText;
              }
              break;
          }
        }
      }
    }
  }
};
</script>

<style scoped lang="scss">
@import '../scss/index.scss';

.label-text {
  color: $dim-gray;
  align-self: stretch;
  margin-bottom: 10px;
  @include arial-14-regular;
}

.editor-options-container {
  list-style-type: none;

  .editor-options-title {
    color: $dark-slate-gray-3;
    text-align: left;
    @include arial-20-bold;
  }
}

// Tooltip
.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 5px;

  /* Position the tooltip */
  position: absolute;
  z-index: 1;
  right: 20px;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}

.lists-inputs {
  padding: 10px 0 10px 0;
  gap: 8px;
  display: flex;
  flex-direction: column;

  // Select
  & select {
    padding: 5px 20px;
    width: 80%;
    border-radius: 5px;
    background: #f8f8f8;
    border: none;
    font-size: 15px;
  }

  // Checkbox
  input[type='checkbox'] {
    display: block;
    border: none;
    background-color: #ccc;
    width: 62px;
    height: 27px;
    border-radius: 3px;
    box-shadow: inset 0 1px 4px rgba(0, 0, 0, .2);
    cursor: pointer;
    position: relative;
    transition: background-color 1s;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }

  input[type='checkbox'].error {
    background-color: #FF4C1F;
  }

  input[type='checkbox']:after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 45%;
    height: 80%;
    background-color: #fdfdfd !important;
    margin: 4%;
    border-radius: 3px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, .2);
    background: rgb(255, 255, 255);
    background: linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(243, 243, 243, 1) 100%);
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#ffffff', endColorstr='#f3f3f3', GradientType=0);

    transition: .5s all;
  }

  input[type='checkbox']:checked {
    background-color: #89F869;
  }

  input[type='checkbox']:checked:after {
    left: 45%;
  }

  // Slider
  /* Range Slider */
  .range-slider__range {
    appearance: none;
    width: calc(100% - (73px));
    height: 19px;
    border-radius: 5px;
    border: 1px solid #E1E1E1;
    background: #F0F0F0;
    outline: none;
    padding: 0;
    display: inline-block;
    margin: 0;
  }

  .range-slider__range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 23px;
    height: 23px;
    border-radius: 5px;
    background: #484848;
    cursor: pointer;
    transition: background .15s ease-in-out;
  }

  .range-slider__range::-webkit-slider-thumb:hover {
    background: #3a3a3a;
  }

  .range-slider__range:active::-webkit-slider-thumb {
    background: #2e2b2b;
  }

  .range-slider__range::-moz-range-thumb {
    width: 23px;
    height: 23px;
    border: 0;
    border-radius: 5px;
    background: #484848;
    cursor: pointer;
    transition: background .15s ease-in-out;
  }

  .range-slider__range::-moz-range-thumb:hover {
    background: #3a3a3a;
  }

  .range-slider__range:active::-moz-range-thumb {
    background: #2e2b2b;
  }

  .range-slider__range:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px #fff, 0 0 0 6px #2e2b2b;
  }

  .range-slider__value {
    display: inline-block;
    position: relative;
    width: fit-content;
    color: #fff;
    line-height: 20px;
    text-align: center;
    border-radius: 3px;
    background: #484848;
    padding: 5px 10px;
    margin-left: 8px;
  }

  .range-slider__value:after {
    position: absolute;
    inset: -45% auto auto 2px;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-bottom: 7px solid #2c3e50;
    border-top: 7px solid transparent;
    content: '';
  }

  ::-moz-range-track {
    background: #d7dcdf;
    border: 0;
  }

  input::-moz-focus-inner,
  input::-moz-focus-outer {
    border: 0;
  }
}
</style>