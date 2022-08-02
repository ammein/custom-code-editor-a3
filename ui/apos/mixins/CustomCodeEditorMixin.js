import _ from 'lodash';
export default {
  methods: {
    beforeInit(element) {
      // For extendMethods
    },
    init(element) {
      let self = this;
      // Default Empty Value
      this.beforeInit(element);
      let editor = this.editor(element);
      this.setEditor(editor);
      editor.setValue('');
      editor.session.setMode(this.ace.aceModePath + this.ace.defaultMode.toLowerCase());
      editor.setTheme(this.ace.aceThemePath + this.ace.theme);

      // Set schema value onBlur event editor
      editor.on('blur', function () {
        // eslint-disable-next-line no-useless-call
        self.setSubmitValue.call(self, editor);
      })

      // If got specific height for editor container
      if (_.has(this.ace, 'config.editorHeight')) {
        element.style.height = this.ace.config.editorHeight
      }

      // If got fontSize config for editor
      if (_.has(this.ace, 'config.fontSize')) {
        element.style.fontSize = (typeof this.ace.config.fontSize === 'number') ? 'font-size :' + this.ace.config.fontSize.toString() + 'px !important;' : 'font-size :' + this.ace.config.fontSize + ' !important;';
      }

      // Options reference: https://github.com/ajaxorg/ace/wiki/Configuring-Ace
      if (_.has(this.ace, 'options')) {
        let options = this.ace.options;
        for (let key in options) {
          if (options.hasOwnProperty(key)) {
            editor.setOptions(apos.util.assign(options));
          }
        }
      }

      // Enable dropdown
      if (_.has(this.ace, 'config.dropdown') && _.has(this.ace, 'config.dropdown.enable')) {
        if (this.ace.config.dropdown.enable) {
          this.setDropdown();
        }
      }

      // Invoke after init
      this.afterInit(element);

      // Always return editor so that superInit can get editor directly from the extend method.
      return editor;
    },
    afterInit(element) {
      this.setDefaultSubmitValue();
    },
    setDropdown() {
      let editor = this.getEditor();
      let self = this;

      // Save new value when press save command
      editor.commands.addCommand({
        name: 'saveNewCode',
        bindKey: {
          win: (_.has(this.ace, 'config.saveCommand.win')) ? this.ace.config.saveCommand.win : 'Ctrl-Shift-S',
          mac: (_.has(this.ace, 'config.saveCommand.mac')) ? this.ace.config.saveCommand.mac : 'Command-Shift-S'
        },
        exec: function (editor) {
          // If Two or more editor in single schema , show field name
          if (self.$root.$el.querySelectorAll('.editor-container').length > 1) {
            apos.notify((_.has(self.ace, 'config.saveCommand.message')) ? self.ace.config.saveCommand.message + ' - Field Name : ' + self.field.name : 'Selected Code Saved Successfully' + ' - Field Name : ' + self.field.name, {
              type: 'success',
              dismiss: 2
            });
          } else {
            apos.notify((_.has(self.ace, 'config.saveCommand.message')) ? self.ace.config.saveCommand.message : 'Selected Code Saved Successfully', {
              type: 'success',
              dismiss: 2
            });
          }

          self.originalValue = editor.getSelectedText();
        },
        readOnly: false
      });

      // create dropdown modes
      for (let i = 0; i < this.ace.modes.length; i++) {

        // Set defaultMode if found defined modes
        if (self.ace.defaultMode.toLowerCase() === self.ace.modes[i].name.toLowerCase()) {

            editor.session.setMode('ace/mode/' + self.ace.defaultMode.toLowerCase());

            if (self.ace.modes[i].snippet && !self.ace.modes[i].disableSnippet) {

                let beautify = ace.require('ace/ext/beautify');
                editor.session.setValue(self.ace.modes[i].snippet);
                beautify.beautify(editor.session);
                // Find the template for replace the code area
                let find = editor.find('@code-here', {
                    backwards: false,
                    wrap: true,
                    caseSensitive: true,
                    wholeWord: true,
                    regExp: false
                });

                // If found
                if (find) {
                    editor.replace('');
                }
            }
        }
      };
    },
    filterModesList(e) {
      let input, filter, li, i, div, txtValue;
      input = e.currentTarget;
      filter = input.value.toUpperCase();
      div = this.$el.querySelector('.dropdown-content');
      li = div.querySelectorAll('li');
      for (i = 0; i < li.length; i++) {
        (function (i) {
            txtValue = li[i].innerText;

            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                li[i].style.display = '';
            } else {
                li[i].style.display = 'none';
            }
        }(i));
      }
    },
    changeMode(e) {
      let getText = e.currentTarget.getAttribute('data-name');
      let getTitle = e.currentTarget.getAttribute('data-title');
      let editor = this.getEditor();
      this.$el.querySelector('.dropdown-title').innerText = ((getTitle) || this.getName(getText));
      for (let i = 0; i < this.ace.modes.length; i++) {
        if (getText === this.ace.modes[i].name.toLowerCase()) {

          editor.session.setMode('ace/mode/' + this.ace.modes[i].name.toLowerCase());

          if (this.ace.modes[i].snippet) {
            // If got disableContent , get out from this if else
            if (this.ace.modes[i].disableSnippet) {
                return;
            }

            let beautify = ace.require('ace/ext/beautify');
            editor.session.setValue(this.ace.modes[i].snippet);
            beautify.beautify(editor.session);
            // If changing mode got existing codes , replace the value
            if (editor.getSelectedText().length > 1) {
              this.originalValue = editor.replace(editor.getSelectedText());
              return;
            }

            // Find the template for replace the code area
            let find = editor.find('@code-here', {
                backwards: false,
                wrap: true,
                caseSensitive: true,
                wholeWord: true,
                regExp: false
            });

            // If found
            if (find && this.originalValue !== undefined) {
                editor.replace(this.originalValue);
            } else {
                editor.replace('');
            }
          }
        }
      }
    },
    setEditor(editor) {
      this.ace.aceEditor = editor;
      apos.customCodeEditor.browser.editor = apos.util.assign({}, apos.customCodeEditor.browser.editor, {
        [this.field.name]: editor
      })
    },
    getEditor() {
      if (this.ace.aceEditor) {
        return this.ace.aceEditor;
      }

      return null;
    },
    setDefaultSubmitValue() {
      if (!_.isObject(this.next)) {
        this.next = {
          code: '',
          type: ''
        }
      } else {
        // Assign to original value;
        this.originalValue = this.next.code;
      }
    },
    setEditorValue() {
      let editor = this.getEditor();
      if (_.isObject(this.next) && (_.has(this.next, 'code') && !_.isEmpty(this.next.code)) && (_.has(this.next, 'type') && !_.isEmpty(this.next.type))) {
        editor.session.setValue(this.next.code);
        editor.session.setMode('ace/mode/' + this.next.type.toLowerCase());
      }
    },
    setSubmitValue(editor) {
      let mode = editor.session.getMode().$id.match(/(?!(\/|\\))(?:\w)*$/g)[0];
      if (editor.getValue() !== this.next.code) {
        this.next.code = editor.getValue();
      }

      if ((editor.getValue().length > 0 || this.next.type.length > 0) && mode !== this.next.type) {
        this.next.type = mode;
      }
    },
    editor(element) {
      return ace.edit(element);
    },
    getName(name) {
      return name.replace(/(_|-)/g, ' ')
        .trim()
        .replace(/\w\S*/g, function (str) {
          return str.charAt(0).toUpperCase() + str.substr(1)
        })
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .trim();
    }
  },
  computed: {
    getTitle() {
      let title = '';
        // Set if clearModes and there is no single mode at all
      if (this.ace.modes.length === 0) {
        title = this.getName(this.ace.defaultMode);
      } else {
        // Find modes. When found , set title if available, else set name of the mode. If not found , set to default type object
        this.ace.modes.forEach((val, i) => {
          (function (i, self) {
            if (self.ace.modes[i].name.toLowerCase() === self.next.type.toLowerCase()) {
              title = (self.ace.modes[i].title) ? self.ace.modes[i].title : self.getName(self.next.type);
            } else if (self.next.type.toLowerCase() === self.ace.defaultMode.toLowerCase()) {
              title = self.getName(self.next.type);
            } else {
              title = self.getName(self.ace.defaultMode);
            }
          })(i, this);
        });
      }

      return title;
    }
  }
}