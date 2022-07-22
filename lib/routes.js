module.exports = function (self) {
  return {
    post: {
      async submit(req, res) {

        let piece;

        try {
          piece = await self.apos.users.find(req, {
            _id: req.user.id
          });
        } catch (e) {
          throw self.apos.error(e);
        }

        const submitted = await self.submitUserOptions(req, piece);

        res.send(submitted);
      }
    },
    get: {
      async options(req, res) {
        try {
          const getUser = await self.apos.modules['apostrophe-users'](req, {
            _id: req.user._id
          });

          if (getUser[self.options.alias]) {
            res.send({
              status: 'success',
              message: JSON.stringify(getUser)
            });
          }
        } catch (e) {
          res.send({
            status: 'error',
            message: e
          });
        }
      }
    }
  };
};
