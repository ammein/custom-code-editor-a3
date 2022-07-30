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

      if ((data[field.name] == null) || (data[field.name] === '')) {
        if (field.require) {
          throw self.apos.error('notfound');
        }
      }

      object[field.name] = {
        code: self.apos.launder.string(input.code),
        type: self.apos.launder.string(input.type)
      };
    }
  };
};
