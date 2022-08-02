const _ = require('lodash');
module.exports = function(self) {
  return {
    async submitUserOptions(req, pieces) {
      const clonePieces = _.cloneDeep(pieces);
      if (clonePieces[self.options.alias]) {
        clonePieces[self.options.alias] = _.assign(clonePieces[self.options.alias], req.body[self.options.alias]);
      } else {
        clonePieces[self.options.alias] = req.body[self.options.alias];
      }

      try {
        const updateUsers = await self.apos.user.update(req, clonePieces);

        if (updateUsers) {
          return {
            status: 'success',
            message: 'Custom Code Editor User Options Saved'
          };
        }
      } catch (e) {
        throw self.apos.error('error', e.message, {
          status: 'error',
          message: 'Unable to save user options'
        });
      }
    },
    async removeUserOptions(req, piece) {
      if (piece[self.options.alias]) {
        let clonePieces = _.cloneDeep(piece);

        delete clonePieces[self.options.alias];

        try {
          const removedUser = await self.apos.user.update(req, clonePieces);

          if (removedUser) {
            return {
              status: 'success',
              message: 'Successfully delete options'
            }
          }
        } catch (e) {
          throw self.apos.error('error', e.message, {
            status: 'error',
            message: 'Unable to delete user options'
          })
        }
      }
    }
  };
};
