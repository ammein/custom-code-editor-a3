export default {
  methods: {
      beforeInit(element) {
        // For extendMethods
      },
      init(element) {
          // Default Empty Value
          this.beforeInit(element);
          let editor = this.editor(element);
          this.setEditor(editor);
          editor.setValue('');
          editor.session.setMode(this.ace.aceModePath + this.ace.defaultMode.toLowerCase());
          editor.setTheme(this.ace.aceThemePath + this.ace.theme);

          // Always return editor so that superInit can get editor directly from the extend method.
          return editor;
      },
      setEditor(editor) {
          this.ace.aceEditor = {
              [this.field.name]: editor
          }
      },
      getEditor() {
          if (this.ace.aceEditor) {
              return this.ace.aceEditor[this.field.name];
          }

          return null;
      },
      editor(element) {
        return ace.edit(element);
      }
  }
}