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
          throw self.apos.error(e);
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
            })
          }
        } catch (e) {
          return res.send({
            status: 'error',
            message: 'Unable to get user\'s options'
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
          }).toObject;

        } catch (e) {
          throw self.apos.error(e);
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
