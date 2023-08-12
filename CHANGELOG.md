### 2.0.1
- Update tests better according to current webpack solution.
- Update README for better documentation on how to add more methods.

### 2.0.0
- Update packages & README.md (Thanks to @BoDonkey - https://github.com/BoDonkey)
- Able to extend APOS UI on `afterInit` & `beforeInit` methods by overriding the file names inside 'modules/custom-code-editor-a3/ui/apos/mixins' directories
- Move production files that were generated for Ace-Builds sourcemap files using handlers method on event `apostrophe:ready`. Only works if the user is running `build` || `release` script. (Temporary Solution until Apostrophe fix/update the issue).
- Using `magic comments` on renaming chunk files on development modes.

### 1.1.3
- Update `homepage` to package.json

### 1.1.2
- Fix spacings
- Fix package.json to have Git URL

### 1.1.1
- Fix typos & comments

### 1.1.0
- Fix `aceBuildsFileLoader` to have better & proper cleaning builds folder options from project level module to override.
- Fix lint codes on Vue files
- Fix `checkOptionsCustomizer` to have better override config merge value
- Add lint rules & extends into `.eslintrc` file

### 1.0.1
- Fix clean-webpack-plugin onto dependencies and remove it from devDependencies
- Fix README.md on `Custom-Code-Editor` to `Custom-Code-Editor-A3`
- Add options for webpack to override from project level module

### 1.0.0
- Initial package using the same as Custom-Code-Editor in ApostropheCMS version 2.x.x. First Release for ApostropheCMS version 3.x.x!