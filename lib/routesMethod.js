const _ = require('lodash');
module.exports = function(self) {
  return {
    async submitUserOptions(req, pieces) {
      const clonePieces = _.cloneDeep(pieces);
      if (clonePieces[self.options.alias]) {
        clonePieces[self.options.alias] = Object.assign(clonePieces[self.options.alias], req.body[self.options.alias]);
      } else {
        clonePieces[self.options.alias] = req.body[self.options.alias];
      }

      try {
        const updateUsers = await self.apos.modules['apostrophe-users'].update(req, clonePieces);

        if (updateUsers) {
          return {
            status: 'success',
            message: 'Custom Code Editor User Options Saved'
          };
        }
      } catch (e) {
        return {
          status: 'error',
          message: e
        };
      }
    }
  };
};
