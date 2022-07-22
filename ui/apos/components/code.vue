<template>
    <AposInputWrapper :modifiers="modifiers" :field="field" :error="effectiveError" :uid="uid"
        :display-options="displayOptions">
        <template #body>
            <div class="apos-input-wrapper">
                <div class="input-wrapper">
                    <div class="editor-container">
                        <div class="code-snippet-wrapper" ref="editor" data-editor>
                            <!-- Where the codes begin -->
                        </div>
                        <div v-if="config && (!config.optionsCustomizer || config.optionsCustomizer.enable)"
                            class="options-config">
                            <button class="button-options" title="Adjust Options" @click="optionsClick = !optionsClick">
                                <ChevronGearIcon :size="16" />
                            </button>
                            <div class="options-container" v-show="optionsClick">
                                <div class="search-buttons">
                                    <div class="first-row">
                                        <input class="search-bar" placeholder="Search" />
                                        <button class="more-options-button"
                                            @click="moreOptionsClick = !moreOptionsClick">
                                            <ChevronDotVerticalIcon :size="16" />
                                        </button>
                                        <div class="more-options" v-show="moreOptionsClick">
                                            <button class="save-options">
                                                <ChevronSaveIcon :size="16" />Save
                                            </button>
                                            <button class="delete-options">
                                                <ChevronDeleteIcon :size="16" /> Reset
                                            </button>
                                        </div>
                                    </div>
                                    <div class="input-wrapper">
                                        <button class="copy">
                                            <ChevronCopyIcon :size="16" />
                                        </button>
                                        <button class="undo">
                                            <ChevronUndoIcon :size="16" />
                                        </button>
                                    </div>
                                </div>
                                <div class="search-buttons">
                                    <img alt="" class="divider-title"
                                        src="https://static.overlay-tech.com/assets/2ea72787-5ae1-42f3-aa97-80b116cc2ab2.svg" />
                                    <p class="editor-options-title">Editor Options</p>
                                </div>
                                <div class="editor-options-container" ref="optionsContainer">
                                    <!-- This is where all options begins -->
                                    {{ log("Options Types:", optionsTypes) }}
                                </div>
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

// Import Ace NPM
import * as ace from 'ace-builds';

// Get Browser Options
let browserOptions = apos.modules["custom-code-editor"].browser;

// Push All Ace files if true
if (browserOptions.ace.pushAllAce) {
    // Import All Modes
    for (let allModes = 0; allModes < browserOptions.ace._allModes.length; allModes++) {
        import(`ace-builds/src-min-noconflict/mode-${browserOptions.ace._allModes[allModes]}.js`);
        import(`ace-builds/src-min-noconflict/snippets/${browserOptions.ace._allModes[allModes]}.js`);

        // Try import Workers if available
        import(`ace-builds/src-min-noconflict/worker-${browserOptions.ace._allModes[allModes]}.js`)
            .catch((e) => null);
    }

    // Import All Themes
    for (let allThemes = 0; allThemes < browserOptions.ace._allThemes.length; allThemes++) {
        import(`ace-builds/src-min-noconflict/theme-${browserOptions.ace._allThemes[allThemes]}.js`);
    }
} else {
    // Dynamic Import Modes, Themes, and Snippets that are defined by your module
    for (let i = 0; i < browserOptions.ace.modes.length; i++) {
        import(`ace-builds/src-min-noconflict/mode-${browserOptions.ace.modes[i].name}`)
            .catch((e) => console.warn(`Unable to use mode for: '${browserOptions.ace.modes[i].name}''. Please make sure you use the correct mode names defined by 'Ace' Module`));

        import(`ace-builds/src-min-noconflict/snippets/${browserOptions.ace.modes[i].name}`).catch((e) => null);

        // Try import Workers if available
        import(`ace-builds/src-min-noconflict/worker-${browserOptions.ace.modes[i].name}`)
            .catch((e) => null);
    };

    // Import just One Theme
    import(`ace-builds/src-min-noconflict/theme-${browserOptions.ace.theme}.js`);
}

// Import other files
for (let otherIndex = 0; otherIndex < browserOptions.ace._otherFiles.length; otherIndex++) {
    import(`ace-builds/src-min-noconflict/${browserOptions.ace._otherFiles[otherIndex]}`);
}

export default {
    name: 'CustomCodeEditor',
    mixins: [AposInputMixin],
    components: {
        ChevronCopyIcon,
        ChevronUndoIcon,
        ChevronDotVerticalIcon,
        ChevronGearIcon,
        ChevronSaveIcon,
        ChevronDeleteIcon
    },
    data() {
        return {
            theme: browserOptions.ace.theme,
            modes: browserOptions.ace.modes,
            defaultMode: browserOptions.ace.defaultMode,
            optionsTypes: browserOptions.ace.optionsTypes,
            aceEditor: null,
            aceModePath: 'ace/mode/',
            aceThemePath: 'ace/theme/',
            cache: [],
            config: _.has(browserOptions, "ace.config") ? browserOptions.ace.config : null,
            optionsClick: false,
            moreOptionsClick: false,
            log: console.log
        }
    },
    mounted() {
        let editor = null;
        let optionsContainer = null;
        if (this.$refs.editor) editor = this.initEditor(this.$refs.editor);
        // Default Empty Value
        editor.setValue('');
        editor.session.setMode(this.aceModePath + this.defaultMode.toLowerCase());
        editor.setTheme(this.aceThemePath + this.theme);

        // Editor
        this.setEditor(editor);

        // Options Container
        optionsContainer = this.$refs.optionsContainer;

        console.log(optionsContainer)

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
        setEditor(editor) {
            this.aceEditor = {
                [this.field.name]: editor
            }
        },
        getEditor() {
            if (this.aceEditor) {
                return this.aceEditor[this.field.name];
            }

            return null;
        },
        initEditor(element) {
            return ace.edit(element);
        },
        aceOptionsUI(object, type, editor, $fieldSet) {

        }
    }
}
</script>

<style lang="scss" scoped>
// This is the project stylesheet
// Colors
$black: rgba(4, 3, 3, 1);
$dark-slate-gray: rgba(36, 41, 46, 1);
$dark-slate-gray-2: rgba(52, 50, 50, 1);
$dark-slate-gray-3: rgba(72, 72, 72, 1);
$dim-gray: rgba(94, 94, 94, 1);
$gainsboro: rgba(225, 228, 232, 1);
$lavender: rgba(233, 233, 233, 1);
$light-blue: rgba(177, 208, 255, 1);
$light-coral: rgba(249, 117, 131, 1);
$light-green: rgba(137, 248, 105, 1);
$light-salmon: rgba(255, 171, 112, 1);
$light-sky-blue: rgba(121, 184, 255, 1);
$light-sky-blue-2: rgba(158, 203, 255, 1);
$orange-red: rgba(255, 76, 31, 1);
$plum: rgba(179, 146, 240, 1);
$transparent-gainsboro: rgba(225, 228, 232, 0.3);
$white: rgba(255, 255, 255, 1);
$white-smoke: rgba(239, 239, 239, 1);
$white-smoke-2: rgba(240, 240, 240, 1);
$white-smoke-3: rgba(248, 248, 248, 1);

// Typographies
@mixin arial-14-regular {
    font-family: "Arial";
    font-size: 14px;
    font-weight: 400;
    line-height: normal;
}

@mixin arial-20-bold {
    font-family: "Arial";
    font-size: 20px;
    font-weight: 700;
    line-height: normal;
}

.editor-container {
    width: 100%;
}

.input-wrapper {
    display: flex;
    align-items: flex-start;
}

.code-snippet-wrapper {
    width: 100%;
    height: 500px;
    position: relative;
}

.options-container {
    background-color: $white;
    overflow: hidden;
    padding: 32px 21px 0;
    width: auto;
    flex-direction: column;
    align-items: center;
    height: 100%;
    z-index: 999;
}

.options-config {
    display: flex;
    position: absolute;
    z-index: 100;
    right: 0;
    height: auto;
    top: 0;
}

.search-buttons {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 240px;

    &:not(:last-of-type) {
        margin-bottom: 18px;
    }
}

.first-row {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
}

.search-bar {
    width: 162px;
    background-color: $white-smoke-2;
    margin-right: 14px;
    border-radius: 5px;
    padding: 15px;
    color: $dark-slate-gray-2;
    border: 0;
    @include arial-14-regular;
}

.more-options-button {
    background-color: $white-smoke-3;
    border-radius: 50px;
    padding: 8px 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    cursor: pointer;
    border: 0;

    &:hover {
        background-color: $gainsboro;
    }
}

.button-options {
    border: 0;
    background-color: $white-smoke-3;
    box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
    width: 35px;
    height: 50px;
    border-radius: 0 0 0 15px;
    cursor: pointer;

    &:hover {
        background-color: $gainsboro;
    }
}

.copy {
    background-color: $light-blue;
    margin-right: 10px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 29.88px;
    height: 29.88px;
    cursor: pointer;
    border: 0;

    &:hover {
        background-color: $plum;
    }
}

.vector {
    width: 16px;
    height: 16px;
}

.undo {
    background-color: $lavender;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    cursor: pointer;
    border: 0;

    &:hover {
        background-color: $dim-gray;
    }
}

.divider-title {
    width: 240px;
    margin-bottom: 12px;
}

.editor-options-title {
    color: $dark-slate-gray-3;
    @include arial-20-bold;
}

.editor-options-container {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    height: 100%;
    width: 100%;
}

.editor-options {
    align-self: stretch;

    &:not(:last-of-type) {
        margin-bottom: 19px;
    }
}

.editor-options-two {
    align-self: stretch;
    position: absolute;
    left: 0;
    top: 360px;
}

.more-options {
    width: 129px;
    height: auto;
    position: absolute;
    top: 57px;
    right: 38px;
    background-color: white;
    z-index: 101;
    border-radius: 2px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.16);
}

.save-options {
    border: none;
    height: 46px;
    font-size: 14px;
    justify-content: space-evenly;
    align-items: center;
    display: flex;
    width: 100%;
    background-color: white;
    cursor: pointer;

    &:hover {
        background-color: $gainsboro;
    }
}

.delete-options {
    border: none;
    height: 46px;
    font-size: 14px;
    width: 100%;
    justify-content: space-evenly;
    align-items: center;
    display: flex;
    background-color: white;
    cursor: pointer;

    &:hover {
        background-color: $gainsboro;
    }
}
</style>