<script>
    import _ from 'lodash';
    import CollapseDown from 'vue-material-design-icons/MenuDown.vue';
    import CollapseUp from 'vue-material-design-icons/MenuUp.vue';

    /**
     * @typedef optionsTypes
     * @prop {String} name
     * @prop {String} type
     * @prop {Object[] | Object | String | Null} value
     * @prop {String} category
     */

    /**
     * @typedef aceEditor
     * @prop {Ace} Ace - Ace Constructor Object
     * @prop {Ace.Editor} editor - Ace Editor Initialized
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
        components:{
            CollapseDown,
            CollapseUp
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
                titleClick: {},
            }
        },
        methods: {
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
                    let getOptions = await apos.http.get(apos.customCodeEditor.browser.action + '/options', {});
                    return getOptions;
                } catch (e) {
                    console.warn('Unable to get options due to error:\n', e)
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
                    let saveOptions = await apos.http.post(apos.customCodeEditor.browser.action + '/submit', {
                        body: {
                            [apos.customCodeEditor.alias]: copyOptions
                        }
                    });
                    return saveOptions;
                } catch (e) {
                    console.warn('Save options ERROR', e);
                    throw new Error(e);
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
                    let deleteOptions = await apos.http.delete(apos.customCodeEditor.browser.action +
                    '/remove', {});

                    return deleteOptions;
                } catch (e) {
                    console.warn('Delete options ERROR', e);
                    throw new Error(e);
                }
            },
            /**
             * @method buttonOptionsClick
             * @desc Trigger emits
             * @param {HTMLEvent} e - HTML Event Listener
             */
            buttonOptionsClick(e) {
                let button = e.currentTarget;
                let allCopy = {};
                let inputEmits = {}
                var self = this;
                this.$el.querySelectorAll('li:not([data-header])').forEach(function (value, i) {
                    let key = Object.keys(self.cache[i])[0];
                    let cacheValue = self.cache[i];
                    let input = value.querySelector("[name='" + value.id + "']");

                    // Detect changes by comparing all cache with incoming list arrays.
                    // This will be useful and only executes if it not matches the cache value
                    switch (true) {
                        case (/select/g).test(input.type) && !_.isUndefined(cacheValue[input.name]):
                            if (button.className === 'delete-options') {
                                // Reset the cache first, then run checking
                                self.$emit('updateCache', {
                                    property: input.name,
                                    value: self.originalOptions[input.name]
                                })
                            }

                            // Transform the value
                            let value = (input.options[input.selectedIndex].value === 'true' || input.options[
                                input.selectedIndex].value === 'false') ? JSON.parse(input.options[input
                                .selectedIndex].value) : input.options[input.selectedIndex].value;

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
                                    input: input,
                                    value: passValue,
                                    button: button,
                                    allCopy: allCopy
                                };
                            }
                            break;

                        case (/range/g).test(input.type):
                            if (button.className === 'delete-options') {
                                // Reset the cache first, then run checking
                                self.$emit('updateCache', {
                                    property: input.name,
                                    value: self.originalOptions[input.name]
                                })
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
                                    input: input,
                                    value: passValue,
                                    button: button,
                                    allCopy: allCopy
                                };
                            }
                            break;

                        case (/checkbox/g).test(input.type):
                            if (button.className === 'delete-options') {
                                // Reset the cache first, then run checking
                                self.$emit('updateCache', {
                                    property: input.name,
                                    value: _.isUndefined(self.originalOptions[input.name]) ? false : self.originalOptions[input.name]
                                })
                            }

                            if (input.checked !== cacheValue[input.name]) {
                                if (button.className === 'copy-options' || button.className ===
                                    'save-options') {
                                    allCopy[input.name] = input.checked
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
                                    input: input,
                                    value: input.checked,
                                    button: button,
                                    allCopy: allCopy
                                };
                            }
                            break;
                    }
                })

                if (button.className === 'copy-options') {
                    // Merge allCopy options
                    if (Object.keys(self.options).length > 0) {
                        allCopy = Object.assign(self.options, allCopy);

                        // Loop and find if existing default saved options detected matches module options
                        for (let key of Object.keys(self.originalOptions)) {
                            if (self.originalOptions.hasOwnProperty(key)) {

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
                            })
                        }).catch((e) => {
                            return apos.notify('Unable to save options. Please try again', {
                                type: 'error',
                                dismiss: true
                            })
                        })
                    } else {
                        return apos.notify(
                            'ERROR : Save unsuccessful, options empty. Try adjust your desire options than your default settings.', {
                                type: 'error',
                                dismiss: 8
                            })
                    }
                } else if (button.className === 'delete-options') {
                    self.deleteOptions().then((result) => {
                        if (result.status === 'success') {
                            // Set self.options to be empty too
                            self.options = {}

                            // Loop the optionsTypes, if there is `saveValue` assigned to it, delete it
                            for (let categoryKey of Object.keys(self.optionsTypes)) {
                                if (self.optionsTypes.hasOwnProperty(categoryKey)) {
                                    for(let key of Object.keys(self.optionsTypes[categoryKey])) {
                                        if (!_.isUndefined(self.optionsTypes[categoryKey][key].saveValue)) {
                                            self.$emit('updateOptionsTypes', {
                                                category: categoryKey,
                                                name: self.optionsTypes[categoryKey][key].name,
                                                saveValue: undefined
                                            })
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
                    })
                }

                if (Object.keys(inputEmits).length > 0) {
                    for (let key in inputEmits){
                        if(inputEmits.hasOwnProperty(key)){
                            self.emitOptions.call(self, inputEmits[key]);
                        }
                    }
                }
            },
            /**
             * @method optionsInputs
             * @desc Init Options Lists and append to List Header
             * @param {Object} object - Object of optionsTypes merge with saveValue
             * @param {String} type - Either `slider`, `dropdownArray`, `dropdownObject` or `checkbox`
             * @param {aceEditor} editor - Ace JS Editor
             * @param {Vue.VNode} h - Vue render function
             * @return {Vue.VNode} Returns Lists of options in a category
             */
            optionsInputs(object, type, editor, h) {
                let display = '';

                // Only override display when keyword search happens
                if (this.search.length > 0) {
                    let findKeyword = this.$parent.$parent.getName(object.name).indexOf(this.search);

                    // Only allow matched input, make display none for the rest of the list
                    if (findKeyword === -1) {
                        display = 'none';
                    }
                }

                // Hide when titleClick for the category is true
                if (this.titleClick[_.camelCase(object.category)]) {
                    display = 'none';
                }

                let lists = h('li', {
                    class: 'lists-inputs',
                    attrs: {
                        'data-category': this.$parent.$parent.getName(object.category),
                        id: object.name
                    },
                    style: {
                        display
                    }
                }, [])
                switch (type) {
                    case 'slider':
                        (function (self) {
                            // Create <label> element
                            let label = h('label', {
                                class: 'label-text',
                                style: {
                                    textTransform: 'capitalize'
                                },
                                domProps: {
                                    for: object.name
                                }
                            }, self.$parent.$parent.getName(object.name) + ' :');

                            // Create <span> for slider output
                            let output = h('span', {
                                class: 'range-slider__value',
                                style: {
                                    display: 'none'
                                }
                            }, '')

                            // Create <input> element
                            let input = h('input', {
                                class: 'range-slider__range',
                                domProps: {
                                    value: editor.getOptions()[object.name].value,
                                    name: object.name,
                                    type: 'range',
                                    max: object.value.max,
                                    min: object.value.min,
                                    step: object.value.steps
                                },
                                on: {
                                    input: (e) => {
                                        let percent = (e.currentTarget.value - object.value.min) / (
                                            object.value.max - object.value.min);
                                        let newPos = (parseInt(getComputedStyle(e.currentTarget)
                                            .width) - e.currentTarget.style.marginLeft) * percent;
                                        e.currentTarget.nextElementSibling.style.left = newPos + "px";
                                        e.currentTarget.nextElementSibling.style.display = null;
                                        e.currentTarget.nextElementSibling.innerHTML = e.currentTarget
                                            .value;
                                    },
                                    change: (e) => {
                                        e.target.setAttribute('value', e.currentTarget.value);
                                        editor.setOption(object.name, e.currentTarget.value);
                                    },
                                    mouseup: (e) => {
                                        e.currentTarget.nextElementSibling.style.display = 'none';
                                    }
                                }
                            }, []);

                            // Set selected & editor options
                            if (!_.isUndefined(object.saveValue)) {
                                input.data.domProps.value = object.saveValue;
                                editor.setOption(object.name, object.saveValue);
                            } else if (_.isUndefined(object.saveValue)) {
                                (editor.getOptions()[object.name]) ? input.data.domProps.value = editor
                                    .getOptions()[object.name]: input.data.domProps.value = 0;
                            }

                            let cache = {
                                [object.name]: (!_.isUndefined(object.saveValue)) ? object.saveValue : editor
                                    .getOptions()[object.name]
                            }

                            if (!self.cache.some(eachCache => eachCache.hasOwnProperty(object.name))) {
                                self.$emit('pushCache', cache);
                            }

                            lists.children.push(label);
                            lists.children.push(input);
                            lists.children.push(output);
                        })(this);
                        break;

                    case 'dropdownArray':
                        (function (self) {
                            // Create <label> element
                            let label = h('label', {
                                class: 'label-text',
                                style: {
                                    textTransform: 'capitalize'
                                },
                                attrs: {
                                    for: object.name
                                }
                            }, self.$parent.$parent.getName(object.name) + ' :');

                            // Create <select> element
                            let select = h('select', {
                                domProps: {
                                    name: object.name
                                },
                                on: {
                                    change: (e) => {
                                        editor.setOption(object.name, e.currentTarget.value);
                                    }
                                }
                            }, object.value.map((val, i) => {
                                // Create <option> element
                                let selected = false;

                                // Set selected & editor options
                                if (object.saveValue === val) {
                                    selected = true;
                                    editor.setOption(object.name, object.saveValue);
                                } else if (_.isUndefined(object.saveValue)) {
                                    (editor.getOptions()[object.name] === val) ? selected = true: null;
                                }

                                return h('option', {
                                    domProps: {
                                        value: val,
                                        selected: selected
                                    }
                                }, val);
                            }));

                            let cache = {
                                [object.name]: (!_.isUndefined(object.saveValue)) ? object.saveValue : editor
                                    .getOptions()[object.name]
                            }

                            if (!self.cache.some(eachCache => eachCache.hasOwnProperty(object.name))) {
                                self.$emit('pushCache', cache);
                            }

                            lists.children.push(label);
                            lists.children.push(select);
                        })(this);
                        break;

                    case "dropdownObject":
                        (function (self) {
                            // Create <label> element
                            let label = h('label', {
                                class: 'label-text',
                                style: {
                                    textTransform: 'capitalize'
                                },
                                domProps: {
                                    for: object.name
                                }
                            }, self.$parent.$parent.getName(object.name) + ' :');

                            // Create <select> element
                            let select = h('select', {
                                domProps: {
                                    name: object.name
                                },
                                on: {
                                    change: (e) => {
                                        let value = (e.currentTarget.value === 'true' || e.currentTarget
                                            .value === 'false') ? JSON.parse(e.currentTarget
                                            .value) : e.currentTarget.value;
                                        editor.setOption(object.name, value);
                                    }
                                }
                            }, object.value.map((val, i) => {
                                // Create <option> element
                                let selected = false;

                                // Set selected & editor options
                                if (object.saveValue === val) {
                                    selected = true;
                                    editor.setOption(object.name, object.saveValue);
                                } else if (_.isUndefined(object.saveValue)) {
                                    (editor.getOptions()[object.name] === val.value) ? selected = true:
                                        null;
                                }

                                return h('option', {
                                    domProps: {
                                        value: val.value,
                                        selected: selected
                                    }
                                }, val.value);
                            }));

                            let cache = {
                                [object.name]: (!_.isUndefined(object.saveValue)) ? object.saveValue : editor
                                    .getOptions()[object.name]
                            }

                            if (!self.cache.some(eachCache => eachCache.hasOwnProperty(object.name))) {
                                self.$emit('pushCache', cache);
                            }

                            lists.children.push(label);
                            lists.children.push(select);
                        })(this);
                        break;

                    case "checkbox":
                        (function (self) {
                            // Create <label> element
                            let label = h('label', {
                                class: 'label-text',
                                style: {
                                    textTransform: 'capitalize'
                                },
                                domProps: {
                                    for: object.name
                                }
                            }, self.$parent.$parent.getName(object.name) + ' :');

                            let checked = null;
                            if (!_.isUndefined(object.saveValue)) {
                                checked = !checked;
                                editor.setOption(object.name, object.saveValue);
                            } else if (_.isUndefined(object.saveValue)) {
                                editor.getOptions()[object.name] ? checked = editor.getOptions()[object.name] : null;
                            }

                            // Create <select> element
                            let input = h('input', {
                                domProps: {
                                    checked,
                                    type: 'checkbox',
                                    name: object.name,
                                },
                                class: 'error',
                                on: {
                                    change: (e) => {
                                        if (e.currentTarget.checked) {
                                            editor.setOption(object.name, true);
                                        } else {
                                            editor.setOption(object.name, false);
                                        }
                                    }
                                }
                            }, []);

                            let cache = {
                                [object.name]: (!_.isUndefined(object.saveValue)) ? object.saveValue : !!editor
                                    .getOptions()[object.name]
                            }

                            if (!self.cache.some(eachCache => eachCache.hasOwnProperty(object.name))) {
                                self.$emit('pushCache', cache);
                            }

                            lists.children.push(label);
                            lists.children.push(input);
                        })(this);
                        break;

                }

                return lists;
            },
            /**
             * @method loopOptions
             * @desc Loop function to loop with current save options and init with `optionsInput()` function
             * @param {Object} myOptions - Object of editor options that either saved from user options or default value
             * @param {Vue.VNode} h - Vue render function
             * @return {Vue.VNode} Returns <ul> element that are grouped all the lists in the children
             */
            loopOptions(myOptions, h) {
                if (Object.keys(this.originalOptions).length === 0) {
                    this.originalOptions = _.cloneDeep(this.editor.getOptions())
                }

                let editor = this.editor;
                let self = this;
                // Create new <ul> element to group all lists in its children
                let unorderedLists = h('ul', {
                    class: 'editor-options-container'
                }, []);
                // Create default <li> element as starting Header List element
                let listHeader = h('li', {
                    style: {
                        marginBottom: "60px"
                    }
                }, [ ]);
                // Grab props Options Types
                let optionsTypes = this.optionsTypes;
                let categoryTitle = '';

                // Loop Group By Options
                for (let categoryKey in optionsTypes) {
                    let display = '';

                    // Only override display when keyword search happens
                    if (this.search.length > 0) {
                        // Filter keyword that has the value
                        let filterKeyword = _.filter(optionsTypes[categoryKey], (val) => self.$parent.$parent.getName(
                            val.name).indexOf(self.search) > -1);

                        // Only hide header list if it not match with the filter keyword
                        if (filterKeyword.length === 0) {
                            display = 'none';
                        }
                    }

                    // Create new listHeader
                    listHeader = h('li', {
                        style: {
                            marginBottom: "60px",
                            display
                        }
                    }, [])
                    // Assign Attributes to listHeader
                    listHeader.data.attrs = {
                        'data-category': this.$parent.$parent.getName(categoryKey),
                        'data-header': this.$parent.$parent.getName(categoryKey),
                        id: categoryKey
                    }

                    // Assign Data Title Click for checking
                    if (_.isUndefined(this.titleClick[_.camelCase(categoryKey)])) {
                        this.titleClick[_.camelCase(categoryKey)] = false;
                    }

                    // Create new <h1> title
                    let h1 = h('h1', {
                        class: 'editor-options-title',
                        style: {
                            cursor: 'pointer'
                        },
                        on: {
                            click: this.listHeaderClick.bind(self)
                        }
                    }, [
                        ' ' + this.$parent.$parent.getName(categoryKey) + ' Options' + ' ',
                        h(this.titleClick[_.camelCase(categoryKey)] ? CollapseUp : CollapseDown, {
                            attrs: {
                                'data-category': this.$parent.$parent.getName(categoryKey),
                                'data-icon': this.titleClick[_.camelCase(categoryKey)] ? 'up' : 'down'
                            }
                        }, [])
                        ]);
                    // Push <h1> to new listHeader created
                    listHeader.children.push(h1);
                    // Assign new categoryTitle for this particular loop conditional
                    categoryTitle = categoryKey;
                    // Finally push the listHeader to <ul> parent element
                    unorderedLists.children.push(listHeader);

                    // Loop existing Editor Options
                    // Something is wrong in here. Should do filter instead
                    for (let key of Object.keys(this.editor.getOptions())) {
                        if (editor.getOptions().hasOwnProperty(key)) {
                            let groupedOptions = optionsTypes[categoryKey].find((val) => val.name === key);

                            // Assign child of listHeader
                            if (groupedOptions && groupedOptions.name === key && categoryKey === groupedOptions
                                .category) {
                                switch (true) {
                                    case _.isArray(groupedOptions.value) && !_.every(groupedOptions.value, _.isObject):
                                        groupedOptions = !_.isUndefined(myOptions[key]) ? apos.util.assign(
                                            groupedOptions, {
                                                saveValue: myOptions[key]
                                            }) : groupedOptions;

                                        listHeader.children.push(this.optionsInputs(groupedOptions, 'dropdownArray',
                                            editor, h))
                                        break;

                                    case _.isArray(groupedOptions.value) && _.every(groupedOptions.value, _.isObject):
                                        groupedOptions = !_.isUndefined(myOptions[key]) ? apos.util.assign(
                                            groupedOptions, {
                                                saveValue: myOptions[key]
                                            }) : groupedOptions;

                                        listHeader.children.push(this.optionsInputs(groupedOptions, 'dropdownObject',
                                            editor, h))
                                        break;

                                    case _.isObject(groupedOptions.value):
                                        groupedOptions = !_.isUndefined(myOptions[key]) ? apos.util.assign(
                                            groupedOptions, {
                                                saveValue: myOptions[key]
                                            }) : groupedOptions;

                                        listHeader.children.push(this.optionsInputs(groupedOptions, 'slider', editor,
                                            h))
                                        break;

                                    case groupedOptions.type === 'boolean':
                                        groupedOptions = !_.isUndefined(myOptions[key]) ? apos.util.assign(
                                            groupedOptions, {
                                                saveValue: myOptions[key]
                                            }) : groupedOptions;
                                            

                                        listHeader.children.push(this.optionsInputs(groupedOptions, 'checkbox', editor,
                                            h));
                                        break;
                                }
                            }
                        }
                    }
                }

                return unorderedLists;
            },
            /**
             * @method
             * @desc When list header is clicked. `this.$forceUpdate()` triggers when done update titleClick[category]
             * @param {HTMLEvent} e - HTML Event Click
             */
            listHeaderClick(e){
                let category = _.camelCase(e.currentTarget.parentElement.dataset.category);
                let condition = this.titleClick[category];
                this.titleClick[category] = !condition;
                this.$forceUpdate();
            },
            /**
             * @method emitOptions
             * @desc Emit Events to `$root` by check the `input.type`
             * @param {{ input: HTMLElement, value: String | Boolean, button: HTMLElement, allCopy: Object }} value - Grab Options Value
             */
            emitOptions({input ,value, button, allCopy}){
                // Emit event to alert other similar components
                switch(true) {
                    case (/select/g).test(input.type):
                        /**
                         * @event component:OptionsContainerComponent~customCodeEditor:getOptions
                         * @desc ```js
                         * // This function emits on input type `select`
                         * this.$root.$emit('customCodeEditor:getOptions', {
                         * customCodeEditor: {
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
                                input: input,
                                name: input.name,
                                value: value.toString(),
                                action: button.className.replace('-options', '').trim(),
                                options: allCopy,
                                button: button
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
                                input: input,
                                name: input.name,
                                value: parseFloat(input.value),
                                action: button.className.replace('-options', '').trim(),
                                options: allCopy,
                                button: button
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
                                input: input,
                                name: input.name,
                                value: input.checked,
                                action: button.className.replace('-options', '').trim(),
                                options: allCopy,
                                button: button
                            }
                        });
                        break;

                }
            },
            /**
             * @method updateOptions
             * @desc Update Options whenever other similar OptionsContainer is modified
             * @param {Event} e - Vue Event Emitter
             * @fires component:OptionsContainerComponent~customCodeEditor:getOptions
             */
            updateOptions(e){
                if(e.customCodeEditor && !_.isUndefined(e.customCodeEditor.value)) {
                    // Find input from this current component
                    let input = this.$el.querySelector(`[name="${e.customCodeEditor.input.name}"]`);

                    switch (e.customCodeEditor.input.type){
                        case "checkbox":
                            input.checked = e.customCodeEditor.value;
                            break;

                        default:
                            input.value = e.customCodeEditor.value;
                            input.removeAttribute('value');
                    }

                    if(e.customCodeEditor.action) {
                        let copyButton = this.$parent.$el.querySelector('button.copy-options');
                        switch(e.customCodeEditor.action){
                            case "copy":
                                    copyButton.dataset.clipboardText = JSON.stringify(e.customCodeEditor.options);
                                break;

                            case "undo":
                                    // Remove self.options[key] if available
                                    if(this.options[e.customCodeEditor.name]) {
                                        delete this.options[e.customCodeEditor.name];
                                    }
                                    copyButton.dataset.clipboardText = JSON.stringify(this.options);
                                break;

                            case "delete":
                                if(this.options){
                                    this.options = {};
                                    delete copyButton.dataset.clipboardText;
                                }
                                break;
                        }
                    }
                }
            },
        },
        created(){
            this.getOptions()
                .then((options) => {
                    try {
                        if (options.status !== 'error') {
                            return JSON.parse(options.message);
                        } else {
                            throw new Error(options.message);
                        }
                    } catch (e) {
                        throw new Error(e.message)
                    }
                })
                .then((result) => this.options = _.assign(this.options, result))
                .then(() => this.$forceUpdate())
                .catch((message) => {
                     apos.notify(message, {
                        dismiss: true,
                        type: 'error'
                    })
                });
        },
        mounted(){
            this.$root.$on('customCodeEditor:getOptions', this.updateOptions);
        },
        beforeDestroy(){
            this.$root.$off('customCodeEditor:getOptions', this.updateOptions);
            this.$emit('resetCache');
        },
        render(h) {
            if (this.editor && this.optionsTypes) {
                return this.loopOptions(this.options, h);
            }
        }
    }
</script>


<style lang="scss" scoped>
    @import "../../src/index.scss";

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

    .lists-inputs {
        padding: 10px 0 10px 0;
        gap: 8px;
        display: flex;
        flex-direction: column;

        // Select
        & select {
            padding: 5px 20px;
            width: 80%;
            font-size: 12px;
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
            background-color: #fdfdfd;
            margin: 4%;
            border-radius: 3px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, .2);

            background: rgb(255, 255, 255);
            background: -moz-linear-gradient(top, rgba(255, 255, 255, 1) 0%, rgba(243, 243, 243, 1) 100%);
            background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, rgba(255, 255, 255, 1)), color-stop(100%, rgba(243, 243, 243, 1)));
            background: -webkit-linear-gradient(top, rgba(255, 255, 255, 1) 0%, rgba(243, 243, 243, 1) 100%);
            background: -o-linear-gradient(top, rgba(255, 255, 255, 1) 0%, rgba(243, 243, 243, 1) 100%);
            background: -ms-linear-gradient(top, rgba(255, 255, 255, 1) 0%, rgba(243, 243, 243, 1) 100%);
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
            -webkit-appearance: none;
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