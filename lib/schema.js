module.exports = function(self) {
  return {
    addCodeFieldType() {
      self.apos.schema.addFieldType({
        name: 'custom-code-editor',
        convert: self.convertInput,
        vueComponent: 'CustomCodeEditor'
      });
    },
    async convertInput(req, field, data, object) {
      const input = data[field.name];

      if (!data[field.name]) {
        if (field.required) {
          throw self.apos.error('notfound', 'Field for \'' + field.name + '\' is required');
        }

        object[field.name] = null;
      } else {
        object[field.name] = {
          code: self.apos.launder.string(input.code),
          type: self.apos.launder.string(input.type)
        };
      }
    }
  };
};
