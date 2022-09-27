const _ = require('lodash');
module.exports = function(self) {
  return {
    getBrowserData(_super, req) {
      const result = _super(req);

      const options = {};

      _.defaults(options, {
        browser: {}
      });

      _.extend(options.browser, {
        name: self.options.alias,
        action: self.action,
        ace: self.ace,
        mode: process.env.NODE_ENV || 'development'
      });

      _.extend(result, options);

      return result;
    }
  };
};
