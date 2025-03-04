const { FlatCompat } = require("@eslint/eslintrc")
const eslint = require("@eslint/js")
const esLintConfigPrettier = require('eslint-config-prettier');

const compat = new FlatCompat({
    baseDirectory: __dirname
});

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
    eslint.configs.recommended,
    ...compat.env({
        node: true,
        "es6": true,
        "jest": true,
        "jest/globals": true
    }),
    ...compat.config({
        extends: ["apostrophe", "plugin:vue/vue3-recommended", "plugin:vue/vue3-essential"],
        ignorePatterns: [
            "docs/**",
            "tests/apos-build/**",
            "tests/data/**",
            "tests/node_modules/**",
            "tests/public/**",
            "tests/package.json"
        ],
        plugins: ["jest"],
        globals: {
            "$": "readonly",
            "_": "readonly",
            "ace": "readonly",
            "apos": "writable",
            "after": "readonly",
            "before": "readonly"
        },
        rules: {
            "vue/html-indent": [
                "error",
                "tab"
            ], // enforce tabs in template
            "vue/first-attribute-linebreak": [
                "error",
                {
                    "singleline": "ignore",
                    "multiline": "ignore"
                }
            ],
            "vue/html-closing-bracket-spacing": "off",
            "vue/max-attributes-per-line": [
                "warn",
                {
                    "singleline": {
                        "max": 4
                    },
                    "multiline": {
                        "max": 4
                    }
                }
            ],
            "vue/new-line-between-multi-line-property": [
                "error",
                {
                    "minLineOfMultilineProperty": 2
                }
            ],
            "vue/require-v-for-key": "off",
            "vue/no-unused-vars": "off",
            "vue/require-default-prop": "off",
            "vue/attribute-hyphenation": "off",
            "vue/v-on-event-hyphenation": "off",
            "vue/html-closing-bracket-newline": "off",
            "vue/html-self-closing": "off",
            "no-case-declarations": "off",
            "indent": "off",
            "space-before-function-paren": "off",
            "semi": "warn",
            "no-tabs": "off",
            "no-return-assign": "off",
            "no-unused-labels": "error",
            "no-unused-expressions": "off",
            "padded-blocks": "off",
            "eol-last": "off",
            "no-unused-vars": "error",
            "no-debugger": "warn",
            "jest/valid-expect": [
                "error",
                {
                    "maxArgs": 2
                }
            ]
        }
    }),
    esLintConfigPrettier
];