<template>
    <AposInputWrapper :modifiers="modifiers" :field="field" :error="effectiveError" :uid="uid"
        :display-options="displayOptions">
        <template #body>
            <div class="apos-input-wrapper">
                <div class="input-wrapper">
                    <div class="editor-container">
                        <div class="dropdown" v-if="checkDropdown">
                            <button class="button-dropdown result" @click="dropdownClick = !dropdownClick">
                                <component :is="dropdownComponentSwitch" /><span
                                    class="dropdown-title">{{ getTitle }}</span></button>
                            <div class="dropdown-content" v-show="dropdownClick">
                                <input type="text" placeholder="Search.." class="my-input" @keyup.stop="filterModesList"/>
                                <template v-for="(mode, key) in ace.modes">
                                    <li :key="key + mode.title" v-if="mode.title" :data-title="mode.title"
                                        :data-name="mode.name.toLowerCase()" @click="changeMode">
                                        {{ mode.title }}
                                    </li>
                                    <li :key="key + mode.name" v-else :data-name="mode.name.toLowerCase()"
                                        @click="changeMode">
                                        {{ getName(mode.name) }}
                                    </li>
                                </template>
                            </div>
                        </div>
                        <div class="code-snippet-wrapper" ref="editor" data-editor>
                            <!-- Where the codes begin -->
                        </div>
                        <div v-if="checkOptionsCustomizer"
                            class="options-config">
                            <button class="button-options" title="Adjust Options" @click="optionsClick = !optionsClick">
                                <ChevronGearIcon :size="16" />
                            </button>
                            <div class="options-container" v-show="optionsClick" @scroll="optionsScroll">
                                <div class="search-buttons">
                                    <div class="first-row">
                                        <input type="text" class="search-bar" placeholder="Search" v-model="searchOptions" />
                                        <button class="more-options-button"
                                            @click="moreOptionsClick = !moreOptionsClick">
                                            <ChevronDotVerticalIcon :size="16" />
                                        </button>
                                        <div class="more-options" v-show="moreOptionsClick">
                                            <button class="save-options" @click="optionsEvents">
                                                <ChevronSaveIcon :size="16" />Save
                                            </button>
                                            <button class="delete-options" @click="optionsEvents">
                                                <ChevronDeleteIcon :size="16" /> Reset
                                            </button>
                                        </div>
                                    </div>
                                    <div class="input-wrapper">
                                        <button class="copy-options" @click="optionsEvents">
                                            <ChevronCopyIcon :size="16" />
                                        </button>
                                        <button class="undo-options" @click="optionsEvents">
                                            <ChevronUndoIcon :size="16" />
                                        </button>
                                    </div>
                                </div>
                                <div class="divider-buttons">
                                    <img alt="" class="divider-title"
                                        src="https://static.overlay-tech.com/assets/2ea72787-5ae1-42f3-aa97-80b116cc2ab2.svg" />
                                </div>
                                <!-- This is where all options begins -->
                                <OptionsContainerComponent :optionsTypes="ace.optionsTypes" :editor="getEditor()"
                                    :cache="ace.cache" @pushCache="ace.cache.push($event)" :search="searchOptions"
                                    @updateCache="updateCacheValue" ref="optionsContainer" @moreOptionsClick="moreOptionsClick = $event" @updateOptionsTypes="updateOptionsTypesValue" @resetCache="resetCacheValue" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </AposInputWrapper>
</template>

<script>
    // Get Browser Options
    let browserOptions = apos.customCodeEditor.browser;

    // Import Mixins & Components
    import AposInputMixin from 'Modules/@apostrophecms/schema/mixins/AposInputMixin';
    import ChevronCopyIcon from 'vue-material-design-icons/ClipboardMultiple.vue';
    import ChevronUndoIcon from 'vue-material-design-icons/Undo.vue';
    import ChevronDotVerticalIcon from 'vue-material-design-icons/DotsVertical.vue';
    import ChevronGearIcon from 'vue-material-design-icons/Cog.vue';
    import ChevronSaveIcon from 'vue-material-design-icons/ContentSave.vue';
    import ChevronDeleteIcon from 'vue-material-design-icons/Delete.vue';
    import ChevronDropdownIcon from 'vue-material-design-icons/ChevronDown.vue';
    import ChevronDropupIcon from 'vue-material-design-icons/ChevronUp.vue';
    import OptionsContainerComponent from './OptionsContainer.vue';
    import CustomCodeEditorMixinVue from '../mixins/CustomCodeEditorMixin.js';

    // Import lodash
    import _ from 'lodash';

    // Import Ace NPM
    import 'ace-builds';
    
    // Just use dynamic imports from webpack resolver. Let apostrophe compile acejs builds into its own folder by using webpack-merge
    import 'ace-builds/webpack-resolver';

    // Solve beautify problem
    for(let i = 0; i < apos.customCodeEditor.browser.ace._otherFiles.length; i++) {
        import("ace-builds/src-noconflict/" + apos.customCodeEditor.browser.ace._otherFiles[i]).catch((e) => {
            // Do nothing
        })
    }

    /**
     * @component CustomCodeEditor
     * @desc Custom Code Editor component for ApostropheCMS version 3 module
     * @lifecycle mounted Intialized Ace Editor JS
     * @lifecycle mounted Set Default `this.next` value
     * @lifecycle beforeDestroy Destroy clipboardJS Initialized
     */
    export default {
        name: 'CustomCodeEditor',
        mixins: [
            AposInputMixin,
            CustomCodeEditorMixinVue
            ],
        components: {
            ChevronCopyIcon,
            ChevronUndoIcon,
            ChevronDotVerticalIcon,
            ChevronGearIcon,
            ChevronSaveIcon,
            ChevronDeleteIcon,
            ChevronDropdownIcon,
            ChevronDropupIcon,
            OptionsContainerComponent
        },
        data() {
            return {
                /**
                 * @member {Object} - Ace Objects
                 * ```js
                 * ace: {
                 *      theme: <String>,
                 *      modes: <Object[]>,
                 *      options : <Object[]>,
                 *      defaultMode: <String>,
                 *      optionsTypes: <Object[]>,
                 *      aceEditor: ace.edit(element) || null,
                 *      aceModePath: <String>,
                 *      aceThemePath: <String>,
                 *      cache: <Object[]>,
                 *      config: <Object[]>
                 * }
                 * ```
                 */
                ace: {
                    /**
                     * @member {String} theme - Theme String
                     * ```js
                     * ace.theme: <String>
                     * ```
                     */
                    theme: browserOptions.ace.theme,
                    /**
                     * @member {Object[]} modes - Ace JS Modes
                     * ```js
                     * ace.modes: <Object[]>
                     * ```
                     */
                    modes: browserOptions.ace.modes,
                    /**
                     * @member {Object[]} [options={}] - Ace Options
                     * ```js
                     * ace.options : <Object[]>
                     */
                    options: browserOptions.ace.options ? browserOptions.ace.options : {},
                    /**
                     * @member {String} - Default Mode of Ace JS configured by module
                     * ```js
                     * ace.defaultMode: <String>
                     * ```
                     */
                    defaultMode: browserOptions.ace.defaultMode,
                    /**
                     * @member {Object} - Default Options Types for Ace JS
                     * ```js
                     * ace.optionsTypes: <Object[]>
                     * ```
                     */
                    optionsTypes: browserOptions.ace.optionsTypes,
                    /**
                     * @member {aceEditor} [aceEditor=null] - Ace Editor JS store
                     * ```js
                     * ace.aceEditor: ace.edit(element) || null
                     * ```
                     */
                    aceEditor: null,
                    /**
                     * @member {String} [aceModePath='ace/mode/'] - Default Mode path for AceJS
                     * ```js
                     * ace.aceModePath: <String>
                     * ```
                     */
                    aceModePath: 'ace/mode/',
                    /**
                     * @member {String} [aceThemePath='ace/theme/'] - Default Theme path for AceJS
                     * ```js
                     * ace.aceThemePath: <String>
                     * ```
                     */
                    aceThemePath: 'ace/theme/',
                    /**
                     * @member {Array.<Object>} [cache=[]] - Store Cache when initialize Ace Editor Options
                     * ```js
                     * ace.cache: <Object[]>
                     * ```
                     */
                    cache: [],
                    /**
                     * @member {Object} - Config for custom-code-editor module
                     * ```js
                     * ace.config: <Object[]>
                     * ```
                     */
                    config: _.has(browserOptions, "ace.config") ? browserOptions.ace.config : null,
                },
                /**
                 * @member {String} [originalValue=''] - Original value storage for editor.getValue()
                 */
                originalValue: '',
                /**
                 * @member {Boolean} [optionsClick=false] - For options clicked trigger
                 */
                optionsClick: false,
                /**
                 * @member {Boolean} [moreOptionsClick=false] - For 'three dots' button trigger
                 */
                moreOptionsClick: false,
                /**
                 * @member {Boolean} [dropdownClick=false] - For Dropdown click trigger
                 */
                dropdownClick: false,
                /**
                 * @member {String} [searchOptions=''] - For input search value
                 */
                searchOptions: '',
                /**
                 * @member {console.log} log - For logging template value
                 */
                log: console.log
            }
        },
        computed: {
            /**
             * @computed {String} Check config optionsCustomizer object is enable or not
             * @return {Boolean}
             */
            checkOptionsCustomizer() {
                let condition = true;

                if (_.has(this.ace, 'config.optionsCustomizer.enable')) {
                    condition = this.ace.config.optionsCustomizer.enable;
                }

                return condition;
            },
            /**
             * @computed {Boolean} checkDropdown Check whether module options for dropdown is configured or not
             * @return {Boolean}
             */
            checkDropdown() {
                return _.has(this.ace, 'config.dropdown.enable');
            },
            /**
             * @computed {String} dropdownComponentSwitch Switch dropdown icon component
             */
            dropdownComponentSwitch() {
                if (this.dropdownClick) {
                    return 'ChevronDropupIcon';
                } else {
                    return 'ChevronDropdownIcon';
                }
            },
            /**
             * @computed {String} getTitle Get title from modes
             * @return {String}
             */
            getTitle() {
                let title = '';
                if(!_.isObject(this.next)) {
                    // Exit immediately
                    return;
                }
                // Set if clearModes and there is no single mode at all
                if (this.ace.modes.length === 0) {
                    title = this.getName(this.ace.defaultMode);
                } else {
                    // Find modes. When found , set title if available, else set name of the mode. If not found , set to default type object
                    this.ace.modes.forEach((val, i) => {
                        (function (i, self) {
                            if (self.ace.modes[i].name.toLowerCase() === self.next.type.toLowerCase()) {
                                title = (self.ace.modes[i].title) ? self.ace.modes[i].title : self.getName(
                                    self.next.type);
                            } else if (self.next.type.toLowerCase() === self.ace.defaultMode
                                .toLowerCase()) {
                                title = self.getName(self.next.type);
                            } else {
                                title = self.getName(self.ace.defaultMode);
                            }
                        })(i, this);
                    });
                }

                return title;
            }
        },
        mounted() {
            let editor = this.init(this.$refs.editor);
            this.setEditorValue();
        },
        beforeDestroy() {
            if (_.has(this.ace, 'config.optionsCustomizer.enable')) {
                this.destroyClipboard();
            }
        },
        methods: {

            /**
             * Validate Function
             * @method validate
             * @desc Method provide by ApostropheCMS3 to validate value from server
             * @param {object} value - Value return from ApostropheCMS self.validate
             * @return {String | Boolean}
             */
            validate(value) {
                if (this.field.required) {
                    if (!value) {
                        return 'required';
                    }
                }

                return false;
            },
            
            /**
             * @method optionsEvents
             * @desc Trigger reference to optionsContainerComponent to trigger buttonOptionsClick method
             * @param {Event} e
             */
            optionsEvents(e) {
                this.$refs.optionsContainer.buttonOptionsClick(e);
            },

            /**
             * @method resetCacheValue
             * @desc Reset data for `ace.cache` value
             */
            resetCacheValue(){
                this.ace.cache = [];
            },

            /**
             * @method updateCacheValue
             * @desc Update cache value event
             * @param {{property: String, value: String | Boolean}} ObjectValue 
             * ```js
             * updateCacheValue({property, value})
             * ```
             */
            updateCacheValue({ property, value }) {
                const getIndex = _.findIndex(this.ace.cache, (val) => {
                    return val.hasOwnProperty(property);
                })

                if(getIndex !== -1 && this.ace.cache[getIndex][property] !== value){
                    this.ace.cache[getIndex] = {
                        [property]: value
                    };
                }
            },

            /**
             * @method optionsScroll
             * @desc Deactivate `moreOptionsClick` whenever the options container is scrolled
             * @param {Event} e - HTML Event
             */
            optionsScroll(e){
                if(this.moreOptionsClick) {
                    this.moreOptionsClick = false;
                }
            },

            /**
             * @method updateOptionsTypesValue
             * @desc Update options Types module value
             * @param {{ category: String, name: String, value: String | Boolean, saveValue: Boolean }}
             */
            updateOptionsTypesValue({ category, name, value, saveValue }) {
                if(!name) {
                    throw new Error('You must include value for `property` object');
                }

                const getIndex = _.findIndex(this.ace.optionsTypes[category], (val) => {
                    return val.name === name;
                });

                if(getIndex !== -1) {
                    const cloneObject = _.cloneDeep(this.ace.optionsTypes[category][getIndex]);

                    switch (true) {
                        case _.isUndefined(saveValue) && !_.isUndefined(cloneObject.saveValue):
                            delete cloneObject.saveValue;

                        case cloneObject.saveValue && !_.isUndefined(saveValue):
                            cloneObject.saveValue = saveValue;
                    
                        default:
                            if (value) {
                                cloneObject.value = value;
                            }
                            break;
                    }

                    this.ace.optionsTypes[category][getIndex] = cloneObject;
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    @import "../../src/editor.scss";
</style>