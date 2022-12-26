# Custom-Code-Editor-A3 ApostropheCMS 3 Schema

[![test-custom-code-editor-a3](https://github.com/ammein/custom-code-editor-a3/actions/workflows/main.yml/badge.svg)](https://github.com/ammein/custom-code-editor-a3/actions/workflows/main.yml)

An ApostropheCMS Custom Schema for your own custom-code-editor-a3 field.

This extension adds a full-featured code editor that is perfect for coding tutorials, documentation containing code examples, or any other type of page that needs to display code.

This schema uses the open-source Ace Editor library that you may found here [Ace Editor](https://ace.c9.io/)


![Ace Editor Example](https://thumbs.gfycat.com/DecisiveThickGilamonster-size_restricted.gif)

Falling in love with custom-code-editor-a3 module ? Send love ❤️ through Paypal here : <br>
[Paypal.me/AminShazrin](https://paypal.me/AminShazrin?locale.x=en_US)


# Install
From within your apostrophe project `npm install --save custom-code-editor-a3`

Include in app.js:
```javascript
// In app.js
  modules: {
    'custom-code-editor-a3': {},
    // ... other modules
}
```


# Enable Code Editor Schema
Simple :
```javascript
fields: {
    add: {
        myCode: {
            type: 'custom-code-editor-a3',
            label: 'First Code'
        }
    }
}
```

### Getting the `custom-code-editor-a3` values
This custom-code-editor schema returns an object composed of a `code` string containing the formatted code along with a `type` string that is derived from the type of editor used to input the code.

```javascript
{
    code : '<string code value>',
    type : '<modes>'
}
```

Following the example above, in your template HTML file you can simply get an object like this :

```twig
{{ data.page.myCode.code }}
{{ data.page.myCode.type }}
```

or you can simply use `apos.log()` to see what's available on `custom-code-editor-a3` objects :

```twig
{{ apos.log(data.page.myCode) }}
```

### Displaying the custom code

It is up to the developer to format the code string supplied to the template by the `custom-code-editor`. We recommend using a package like [`highlight.js`](https://highlightjs.org/), but there are a number of other similar packages out there.

For the `highlight.js` package you will need to add the package script and styling, plus a small additional script to activate it on the page. It is typically sufficient to surround the editor code string with `<pre>` and `<code>` tags, but you can also supply the `type` if needed.

```twig
<pre>
  <code class="language-{{ data.page.myCode.type}}">
    {{ data.page.myCode.code }}
  </code>
</pre>
```

# Custom-Code-Editor-A3 Options Available

The custom-code-editor has a number of options available. You can customize your editor experience by creating your own `index.js` file in the `modules/custom-code-editor` folder of your project to extend the existing options.

```javascript
// in modules/custom-code-editor-a3/index.js
module.exports = {
    options: {
        ace : {
            theme : 'tomorrow', // themes available : https://github.com/ajaxorg/ace/tree/master/lib/ace/theme (Case Sensitive)
            defaultMode : 'javascript',
            options : {
                // All options available in : https://github.com/ajaxorg/ace/wiki/Configuring-Ace
            },
            modes : [
                {
                    title : 'Javascript', // Title to Override Name
                    name : 'javascript', // Name of the mode (Case-Sensitive)
                    snippet : '// Content Start Here \n print(\"Hello World\") \n @code-here', // Default Value (String)
                    disableSnippet : true // Disable default snippet value when switching (OPTIONAL - Boolean)
                }
            ],
            config: {
                fontSize: 16, // Editor Font Size (Number or String)
                editorHeight: 500, // Editor Height (Number or String)
                dropdown: {
                    enable: true, // Enable it for switching modes button (Boolean)
                    height: 30, // Height Dropdown (Number or String)
                    borderRadius: 5, // Border Radius Dropdown (Number or String)
                    fontFamily: "Mont-Regular", // Font Family Dropdown (String)
                    backgroundColor : "Orange", // Background Color Dropdown (String)
                    textColor : "white", // Text Color Dropdown (String)
                    fontSize: 16, // Font Size Dropdown (Number or String)
                    position: {
                        // All top , left , right , bottom dropdown position enable for configs
                        bottom: 20,
                        right: 20
                    },
                    arrowColor: "blue" // To change arrow color in dropdown (String)
                }
            }
        }
    }
}
```

# List of default modes available
- ActionScript
- Bash
- C++
- C#
- PHP
- HTML
- Javascript

# Name Of The Modes References
### [List of all Modes](https://github.com/ajaxorg/ace-builds/blob/6526ea4a845a3682789a9224f319271496051873/src/ext-modelist.js#L33)

# How to Override Existing Mode ?
Simple , make sure the name of the mode is similar to default modes provided. 

### Default Mode
By default , `defaultMode : 'javascript'` is enable. But you can choose a default mode by yourself! Just add the name of any mode available to you. Lets say you want 'css' to be the default mode.

```javascript
ace : {
    defaultMode : 'css' // Same as `name : 'css' in mode : []`
}
```

> This will select `css` a the starting mode, then you can choose a different mode by choosing from the dropdown if needed.

### Enable Snippet
To enable your snippet to be added automatically when this schema is open, you have to enable the dropdown
```javascript
ace : {
    config : {
        dropdown : {
            enable : true
        }
    }
}
```

WARNING !
Once enabled, your dropdown will be in the upper left corner. This will block your code input so we recommend that at the same time you enable the dropdown you add a custom position. For example, to position the dropdown on bottom left corner with an offset of 30px from the container edge use:

```javascript
ace : {
    config : {
        dropdown : {
            enable : true
            position : {
                bottom : 30,
                left : 30
            }
        }
    }
}
```

### Disable Snippet
If you want to disable snippet addition for a specific mode, write the `name` of the mode and set the `disableSnippet` property to `true`:

```javascript
ace : {
    modes : [
        {
            name : "html",
            disableSnippet : true // This will not automatically change snippet when you change mode on dropdown
        }
    ]
}
```

### Override Snippet
Also , if you want to override the default snippet for specific mode, write the `name` of the mode and insert your `snippet` :

```javascript
ace : {
    modes : [
        {
            name: 'javascript', // name must be the same as existing default mode
            snippet: "document.addEventListener(\"DOMContentLoaded\" , function(){\n
            @code-here\n
        });"
        }
    ]
}
```

### `@code-here` in a Snippet
What is this syntax for? Well, whenever you change your mode on dropdown, the existing codes in the schema will be replaced automatically into the new snippet in place of `@code-here`. Amazing right? If you did not provide this, your existing value in the editor schema will be lost. Let's make a new override snippet that has our own `@code-here` in it:
```javascript
ace: {
    modes : [
        {
            name :'javascript',
            snippet : "// Content Start Here \n print(\"Hello World\") \n @code-here"
        }
    ],
}
```

### Title of Dropdown
By default, the name of a dropdown will be in the `name` property. But some of the names don't make sense! Can I change it? Yes you can! Simply add the `title` property with your prefered name For example, rename the existing `sh` mode to be called **`Bash`** :
```javascript
ace : {
    modes : [
        {
            name : 'sh',
            title : 'Bash' // This will make dropdown name as Bash instead of Sh
        }
    ]
}
```

### Clear Default Modes
What if I want to clear all default modes and define them myself? Easy, add the `clearModes : true` setting:
```javascript
ace : {
    clearModes : true
}
```

Once you clear your modes, you can define your own modes without considering any overrides mode. Doesn't this makes your life easier?
```javascript
ace : {
    modes : [
        {
            // List of all modes that you want to define. The options you may write like this
            title : '<title of your mode>',
            name : '<name of your mode (case sensitive)>',
            snippet : '<code snippet>'
        }
    ]
}
```

> Don't worry about the indent in your Snippet , Ace will automatically beautify the code whenever you enter your new content.

# Insert My Own Theme
By default , `theme : 'chrome'` . If you wish to change the theme (Case Sensitive), you can find all available themes here [All Ace Editor Themes Available](https://github.com/ajaxorg/ace-builds/blob/6526ea4a845a3682789a9224f319271496051873/src/ext-themelist.js#L9) :
```javascript
ace : {
    theme : 'monokai'
}
```

# Ace Editor Options
Now this one , I just extend it for you to enable ace editor options. Reference : [Ace Editor Options](https://github.com/ajaxorg/ace/wiki/Configuring-Ace)

```javascript
ace : {
    options : {
        // Same property and value as in : https://github.com/ajaxorg/ace/wiki/Configuring-Ace
        // Example :
        cursorStyle: "smooth",
        useSoftTabs: true
    }
}
```

## Enable Emmet Option
By default, emmet is not enable and you need to configure it yourself. But Ace Editor provides a simple options to enable emmet. However, you need a library to load it to Ace Editor. You can find any emmet libraries available online but I provide some sample to you below that works :

```javascript
ace : {
    options : {
        enableEmmet : true
    }
}
```

Then load emmet library in your template views :
```html
<!-- load emmet code and snippets compiled for browser -->
<script src="https://cloud9ide.github.io/emmet-core/emmet.js"></script>
```

# Custom-Code-Editor-A3 & Dropdown Configurations
You also can customize your own dropdown/ace editor css styles. All the dropdown configurations available for you are listed in this example:

```javascript
module.exports = {
    options: {
        ace : {
            config : {
                fontSize : '<Number or String>', // Editor Font Size
                editorHeight : '<Number or String>', // Editor Height
                dropdown : {
                    enable : '<Boolean>', // Enable it for switching modes button
                    height : '<Number or String>', // Height Dropdown - Default : 30
                    borderRadius : '<Number or String>', // Border Radius Dropdown
                    fontFamily : '<String>', // Font Family Dropdown
                    fontSize : '<Number or String>' , // Font Size Dropdown
                    backgroundColor : "<String>", // Background Color Dropdown (String)
                    textColor : "<String>", // Text Color Dropdown (String)
                    position : {
                        top : '<Number or String>',
                        bottom : '<Number or String>',
                        right : '<Number or String>',
                        left : '<Number or String>'
                    },
                    arrowColor : '<String or Hex or RGB or RGBA>' // To change arrow color in dropdown - Default : "black"
                }
            }
        }
    }
}
```

You must be thinking , why are `fontSize` and `editorHeight` available for editor options ? While we could do it at the `options` level:

```javascript
ace : {
    options : {
        // all editor options
    }
}
```

> Because we have a css issue with `!important` to override apostrophe css default normalize. So, I made it for you to easily override in the `config` settings. Or maybe you can push your own file to override it. Either way, both are possible override options :)

# Specific Field Customization
Well, I know some of you don't want some specific editor to have the same options in all custom-code-editor-a3 field instances, right? To make it backward compatibility, only some of the options can be overridden on your schema fields. Here is an example :

```javascript
fields: {
    add: {
        code: {
            type: 'custom-code-editor-a3',
            label: 'Your code here',
            ace: {
                defaultMode: 'c_cpp',
                config: {
                    dropdown: {
                        backgroundColor: '#040303',
                        textColor: '#fffcf2',
                        arrowColor: '#fffcf2'
                    }
                }
            }
        }
    }
}
```
> Why are `modes` and `theme` not available to override? This will go against the rule optimizing webpack feature that only project level options module by your own defined modes and theme get setup in the browser. All `options` values must be configure in project level module `index.js` or directly on `app.js` in `modules: {}`

### If you wish to disable some options, just set it to `null` on that property option. It will removed from your specific field option. For example :
```javascript
fields: {
    add: {
        code: {
            type: 'custom-code-editor-a3',
            label: 'Your code here',
            ace: {
                config: {
                    saveCommand: null,
                }
            }
        }
    }
}
```

> Warning ! If you did not set any config value, config will not be available on specific field. To use existing config, simply set it as empty object `config : {}`

# How To
### Search Bar
Ace got its own search bar. Simply hit `Ctrl + F` ! 

![Search Function](https://thumbs.gfycat.com/HandsomeHopefulFallowdeer-size_restricted.gif)

### Save Selection
Now this one is a new function ONLY for ApostropheCMS . If you hit `Ctrl + Shift + S` while selecting new code, it will replace an existing highlighted text previously when you change your mode. Don't believe me? Check it out!

![Save Feature](https://thumbs.gfycat.com/ReliableHastyGrouper-size_restricted.gif)

Wait ! Can I change save command ? Yup , you can. Add options like this :
```javascript
ace : {
    config : {
        saveCommand : {
            win : 'Ctrl-Shift-F', // Windows Key
            mac : 'Command-Shift-F',// Mac Key,
            message : 'Your Selected Text Saved ! ' // Your custom save message
        }
    }
}
```

# Options Customizer
Have you ever lamented that you are tired of testing options by restarting the app and adjusting your options all over again? Now we have the Options Customizer that helps you more easily tweak your editor options configuration.

![Options Customizer](https://thumbs.gfycat.com/GrossShoddyIbisbill-size_restricted.gif)

### What does it do ?
It brings you more features that you can't live without! All options available for you to modify can now be saved for each logged in user or even you could copy all the desired options and paste it to your project level module! Here are four core features for Options Customizer :
- Copy Options
- Undo Options
- Save Options
- Reset Options

> These options will make your editor change live upon options modified.

## Copy Options
You can copy your modified options and paste it on your project level module that will apply to all! The copy features uses [Clipboard JS](https://clipboardjs.com/) to make it work. Below are the demonstration on how to use it :

![Copy Options](https://thumbs.gfycat.com/WarmheartedGlossyCow-size_restricted.gif)


> NOTE : It only copies from modified changes, not the entirty of the options. If your module options are already configured, it will not copy your module options. Instead, it will copy all your changes options that you did through On/Off Toggle(s), Select Input(s) and Range Input(s).

## Undo Options
You can undo your modified options to the default settings. This will help you reset your changes to default options.

![Undo Options](https://thumbs.gfycat.com/ElementaryGeneralCentipede-size_restricted.gif)


> NOTE : This will not undo saved options to the default setting. If you wish to reset from saved options, refer to section "Reset Options" below.


## Save Options
You can also saves all your modified options. This will keep all your modified options apply to all custom-code-editor-a3 types !

![Save Options](https://thumbs.gfycat.com/KlutzyAridCavy-size_restricted.gif)

In MongoDB, you will see this data directly in `type : apostrophe-user`:
```json
"customCodeEditor" : {
    "highlightActiveLine" : false
}
```

> NOTE : Save options will not apply to all users. It will load current users saved options and apply it to all editors. This will allow each users to their own desired options.

## Reset Options
You can also reset all options. This will remove current saves options and change it to the default module options settings. Let say you have follows save options demonstration above, you simply click `Reset` like example below :

![Reset Options](https://thumbs.gfycat.com/BlandWelloffAngwantibo-size_restricted.gif)

> NOTE : This will affect the currently logged in user only. It will not remove any other user's options.

## Modify Options
What if you want to add your own help text? You could simply done it in project level module like this : 
```javascript
// In custom-code-editor-a3/index.js :
module.exports = {
    options: {
        ace : {
            optionsTypes : [
                {
                    name : "highlightActiveLine",
                    help : "This will highlight active line cursor position"
                }
            ]
        }
    }
}
```

> NOTE : If you wish to add more options, take a look at `aceTypes.js` in `node_modules/custom-code-editor-a3/aceTypes.js` to see how it is done. And MAKE SURE you do it in an ARRAY like the example above.

## Disable Options Customizer
You wish to remove the options customizer? You don't like it? Don't worry, just set it to `enable : false` like this :
```javascript
// In custom-code-editor-a3/index.js :
module.exports = {
    options: {
        ace : {
            config : {
                optionsCustomizer : {
                    enable : false
                    // More configuration coming soon
                }
            }
        }
    }
}
```

### Why are some other options missing ?
Well, some other options will break apostrophe's UI and are also against the rule of pushing assets. For instance, we cannot set other themes via the Options Customizer because we will only push desired theme configuration from your project level module. This is because Ace contains more than 10 js files for each modes and themes available.

# Browser

### Browser Object
How can I get the schema browser object for `custom-code-editor-a3` ?

Simply you can find it on :

```javascript
apos.customCodeEditor
```

> I keep it similar `apos.customCodeEditor` object from ApostropheCMS version 2 so that you can copy paste your previous code from ApostropheCMS version 2 into ApostropheCMS version 3 easily without breaking change.

### Get Editor Browser Object
How can I get from the one that defined in javascript browser at `var editor = ace.edit("editor")` as in Ace Editor Website has telling you about ?

You can get it via browser scripting
```javascript
apos.customCodeEditor.browser.editor[your-field-name]
```

By that , you can test anything on browser-side. For example you open on Chrome Developer Tools and enter :

```javascript
apos.customCodeEditor.browser.editor[your-field-name].session.getValue()
```

### Get Multiple Editor Browser in Single Schema
Oops! How can I get specific editor browser object if I have two fields in a same schema? I made it simple for you, let say you have these fields:

```javascript
fields: {
    add: {
        code: {
            type: 'custom-code-editor-a3',
            label: 'First Code'
        },
        secondCode: {
                type: 'custom-code-editor-a3',
                label: 'Second Code',
                ace: {
                    defaultMode: 'html',
                    config: {
                        saveCommand: null
                    }
                }
        }
    }
}
```

Next, simply get the `name` property to get specific schema in browser object : 
```javascript
// First Editor
apos.customCodeEditor.browser.editor.code

// Second Editor
apos.customCodeEditor.browser.editor.secondCode
```

> Easy right? Hell yeah it is! :D

# Advanced Configuration (Skip this if you comfortable with current features)

## Why can't I switch to other themes or other modes by scripting ?
By default we only push asset that are defined modes. It detect by your modes name and push. The rest of the modes will not be available in your browser. This is due to performance where the Ace Editor contains more than 10 js files for all modes. If you really want scripting that can switch themes or maybe other modes via scripting, you have to push ALL ACE's JS files in order to do that. Here is the code :

```javascript
// In modules/custom-code-editor-a3/index.js
module.exports = {
    options: {
        ace : {
            // all other ace options...
            scripts : {
                pushAllAce : true
            }
        }
    }
}
```

> NOTE: Beware that this push ALL ACE JS files including your own mode. Enable this only when you want to configure ace more from on your own script. This might decrease performance and may require long time page loads.

## Add More Methods/Commands/Event Listener To Your Ace Editor

Let say you want to add MORE commands that are already refered to [Ace Editor HOW TO](https://ace.c9.io/#nav=howto) or maybe add new events by yourself. First, let's create new js file to any name you like and push like this:

Inside `CustomCodeEditor.vue` :
```vue
<script>
// In modules/custom-code-editor-a3/ui/apos/components/CustomCodeEditor.vue
import customCodeEditor from 'custom-code-editor-a3/components/CustomCodeEditor.vue';

export default {
    extends: customCodeEditor,
    mixins: [customCodeEditor],
    methods: {
        afterInit(element) {
            const editor = this.getEditor();
            const self = this;
            // Add my own custom command
            editor.commands.addCommand({
                name: 'myCommand',
                bindKey: {win: 'Ctrl-Shift-M',  mac: 'Command-Shift-M'},
                exec: function(editor) {
                    // Your commands code in here...
                    return apos.notify('"' + self.field.name + '" field: ' + 'Ctrl + M/ Command + M is pressed!', {
                        type: 'success',
                        dismiss: true
                    });
                },
                readOnly: true // false if this command should not apply in readOnly mode
            });
        }
    }
}
</script>
```

## Extend Methods available
These methods are available for you to use :

| Method | Description |
| --- | --- |
| `this.beforeInit` | This extend method is initialised before editor is initialised but you can access `this.next` default value in it. |
| `this.afterInit` | You can get `this.getEditor()` easily from this method so that you can add more commands anything to editor or you can add more functional programming to yourself :)

## Methods available
You can refer methods available for you to use in here:
[Custom Code Editor Methods](https://ammein.github.io/custom-code-editor-a3/)

## Webpack Extension Options
### ES Module
If you wish to use ES Module in your project, simply set `esModule` to `true` inside `extensionOptions` called `aceBuildsFileLoader` like below example:
```javascript
// In modules/custom-code-editor-a3/index.js
module.exports = {
    webpack: {
        extensionOptions: {
            aceBuildsFileLoader: {
                esModule: true // Default: false
            }
        }
    }
}
```

### Disable Cleaning Build Files for Custom-Code-Editor-A3
If you wish to disable all cleaning release modules for custom-code-editor-a3, simply set `clean` to `false` inside `extensionOptions` called `aceBuildsFileLoader` like below example:
```javascript
// In modules/custom-code-editor-a3/index.js
module.exports = {
    webpack: {
        extensionOptions: {
            aceBuildsFileLoader: {
                clean: false // Default: true
            }
        }
    }
}
```

> This is because there are some errors on Ace-Builds that generates for Production from Development & from Development from Production that I already tested it, to prevent it from happening.

### Disable Clean Release Build for Custom-Code-Editor-A3
If you wish to disable cleaning release modules for custom-code-editor-a3, simply set `cleanRelease` to `false` inside `extensionOptions` called `aceBuildsFileLoader` like below example:
```javascript
// In modules/custom-code-editor-a3/index.js
module.exports = {
    webpack: {
        extensionOptions: {
            aceBuildsFileLoader: {
                cleanRelease: false // Default: true
            }
        }
    }
}
```

### Clean Specific Release Build for Custom-Code-Editor-A3
If you wish to clean specific release modules instead for custom-code-editor-a3, simply set `releaseId` to any releaseID that you initialized in production like below example:
```javascript
// In modules/custom-code-editor-a3/index.js
module.exports = {
    webpack: {
        extensionOptions: {
            aceBuildsFileLoader: {
                releaseId: 'my-release-id'
            }
        }
    }
}
```

> // Default: `**` - That will run cleaning to any APOS_RELEASE_ID that was already created for production

#### Access all options available in `ace : {}` object
Simple , you can access it via `this.ace` in `CustomCodeEditor.vue` extends file in your project level module ui component. You may refer methods available down here:

[Custom Code Editor Methods](https://ammein.github.io/custom-code-editor-a3/)

# Changelog
### 1.2.0
- Update packages & README.md

### 1.1.3
- Update `homepage` to package.json

### 1.1.2
- Fix spacings
- Fix package.json to have Git URL
- Fix README

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