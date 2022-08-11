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
                        <div v-if="ace.config && (!ace.config.optionsCustomizer || ace.config.optionsCustomizer.enable)"
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
                                <div class="search-buttons">
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
    import _ from 'lodash';

    // Import Ace NPM
    import 'ace-builds';
    import 'ace-builds/webpack-resolver';

    // Solve beautify problem
        // Solve beautify problem
    for(let i = 0; i < apos.customCodeEditor.browser.ace._otherFiles.length; i++) {
        import("ace-builds/src-noconflict/" + apos.customCodeEditor.browser.ace._otherFiles[i]).catch((e) => {
            // Do nothing
        })
    }

    // Get Browser Options
    let browserOptions = apos.modules["custom-code-editor"].browser;

    export default {
        name: 'CustomCodeEditor',
        mixins: [AposInputMixin, CustomCodeEditorMixinVue],
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
                ace: {
                    theme: browserOptions.ace.theme,
                    modes: browserOptions.ace.modes,
                    options: browserOptions.ace.options ? browserOptions.ace.options : {},
                    defaultMode: browserOptions.ace.defaultMode,
                    optionsTypes: browserOptions.ace.optionsTypes,
                    aceEditor: null,
                    aceModePath: 'ace/mode/',
                    aceThemePath: 'ace/theme/',
                    cache: [],
                    config: _.has(browserOptions, "ace.config") ? browserOptions.ace.config : null,
                },
                originalValue: '',
                optionsClick: false,
                moreOptionsClick: false,
                dropdownClick: false,
                searchOptions: '',
                log: console.log
            }
        },
        mounted() {
            let editor = this.init(this.$refs.editor);
            this.setEditorValue();
        },
        computed: {
            checkDropdown() {
                return _.has(this.ace, 'config.dropdown.enable');
            },
            dropdownComponentSwitch() {
                if (this.dropdownClick) {
                    return 'ChevronDropupIcon';
                } else {
                    return 'ChevronDropdownIcon';
                }
            },
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
        methods: {
            validate(value) {
                if (this.field.required) {
                    if (!value) {
                        return 'required';
                    }
                }

                return false;
            },
            optionsEvents(e) {
                this.$refs.optionsContainer.buttonOptionsClick(e);
            },
            resetCacheValue(){
                this.ace.cache = [];
            },
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
            optionsScroll(e){
                if(this.moreOptionsClick) {
                    this.moreOptionsClick = false;
                }
            },
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
                            break;

                        case cloneObject.saveValue && !_.isUndefined(saveValue):
                            cloneObject.saveValue = saveValue; 
                            break;
                    
                        default:
                            val.value = value;
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