module.exports = function (self) {
  return {
    post: {
      async submit(req, res) {

        let piece;

        try {
          piece = await self.apos.user.find(req, {
            _id: req.user._id
          }).toObject();
        } catch (e) {
          self.apos.error('not-found', e.message);
          return res.send({
            status: 'error',
            message: 'Unable to save options'
          });
        }

        try {
          const submitted = await self.submitUserOptions(req, piece);
          return res.send(submitted);
        } catch (e) {
          return res.send(e.data);
        }
      }
    },
    get: {
      async options(req, res) {
        try {
          const piece = await self.apos.user.find(req, {
            _id: req.user._id
          }).toObject();

          if (piece[self.options.alias]) {
            return res.send({
              status: 'success',
              message: JSON.stringify(piece[self.options.alias])
            });
          } else {
            return res.send({
              status: 'empty',
              message: JSON.stringify({})
            });
          }
        } catch (e) {
          return res.send({
            status: 'error',
            message: 'Unable to get existing options'
          });
        }
      }
    },
    delete: {
      async remove(req, res) {
        let piece;
        try {
          piece = await self.apos.user.find(req, {
            _id: req.user._id
          }).toObject();

        } catch (e) {
          self.apos.error('not-found', e.message);
          return res.send({
            status: 'error',
            message: 'Unable to delete options'
          });
        }

        try {
          const removed = await self.removeUserOptions(req, piece);

          return res.send(removed);
        } catch (e) {
          return res.send(e.data);
        }

      }
    }
  };
};
