<script>
export default {
    props: {
        optionsTypes: {
            type: Object,
            required: true,
            validator: function (value) {
                return Object.keys(value).map((val, i, arr) => {
                    typeof value[val].name === "string" ? true : false
                })
            }
        },
        cache: {
            type: Array,
            required: true
        },
        editor: {
            type: Object
        }
    },
    data(){
        return {
            count: 0,
            options: {}
        }
    },
    methods: {
        async getOptions(){
            try {
                let getOptions = await apos.http.get(apos.customCodeEditor.browser.action + '/options', {});
                this.count = this.count++;
                _.assign(this.options, JSON.parse(getOptions.message));
                console.log("Options Assign", this.options);
            } catch(e){
                console.log("Options Not Assign", e);
                // Do Nothing
            }
        },
        getName(name){
            return name.replace(/(_|-)/g, ' ')
                .trim()
                .replace(/\w\S*/g, function (str) {
                    return str.charAt(0).toUpperCase() + str.substr(1)
                })
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
                .trim();
        },
        optionsInputs(object, type, editor, h){
            let lists = h('li', {}, [])
            switch(type){
                case 'slider':
                    (function(self){
                        // Create <label> element
                        let label = h('label', {
                            class: 'label-text',
                            style: {
                                textTransform: 'capitalize'
                            },
                            domProps: {
                                for: object.name
                            }
                        }, self.getName(object.name) + ' :');

                        // Create <span> for slider output
                        let output = h('span', {
                            class: 'range-slider__value',
                            style: {
                                display: 'none'
                            }
                        }, '')

                        // Create <input> element
                        let input = h('input', {
                            class: 'range-slider__range',
                            domProps: {
                                value: editor.getOptions()[object.name],
                                name: object.name,
                                type: 'range',
                                max: object.value.max,
                                min: object.value.min,
                                step: object.value.steps
                            },
                            onInput: (e) => {
                                output.data.style.display = 'inline';
                                output.data.domProps.innerHTML = this.value;
                            },
                            onChange: (e) => {
                                debugger;
                                e.target.dispatchEvent(new Event('input', {bubbles:false}));
                                input.data.domProps.value = this.value;
                                // e.target.setAttribute('value', this.value);
                                editor.setOption(object.name, this.value);
                            }
                        }, []);

                        // Set selected & editor options
                        if(object.saveValue !== undefined){
                            input.data.domProps.value = object.saveValue;
                            editor.setOption(object.name, object.saveValue);
                        } else if(object.saveValue === undefined){
                            (editor.getOptions()[object.name]) ? input.data.domProps.value = editor.getOptions()[object.name] : input.data.domProps.value = 0;
                        }

                        let cache = {
                                [object.name]: (object.saveValue !== undefined) ? object.saveValue : editor.getOptions()[object.name]
                            }

                        if (!_.some(self.$props.cache, cache)){
                            self.$emit('updateCache', cache);
                        }

                        lists.data.class = 'lists-inputs'
                        lists.data.attrs = {
                            'data-category': self.getName(object.category),
                            id: object.name
                        }
                        lists.children.push(label);
                        lists.children.push(input);
                        lists.children.push(output);
                    })(this);
                    break;

                case 'dropdownArray':
                    (function(self){
                        // Create <label> element
                        let label = h('label', {
                            class: 'label-text',
                            style: {
                                textTransform: 'capitalize'
                            },
                            attrs: {
                                for: object.name
                            }
                        }, self.getName(object.name) + ' :');

                        // Create <select> element
                        let select = h('select', {
                            domProps: {
                                name: object.name
                            },
                            onChange: (e) => {
                                editor.setOption(object.name, e.value);
                            }
                        }, object.value.map((val, i) => {
                            // Create <option> element
                            let selected = false;

                            // Set selected & editor options
                            if(object.saveValue === val){
                                selected = true;
                                editor.setOption(object.name, object.saveValue);
                            } else if(object.saveValue === undefined){
                                (editor.getOptions()[object.name] === val) ? selected = true : null;
                            }

                            return h('option', {
                                domProps: {
                                    value: val,
                                    selected: selected
                                }
                            }, val);
                        }));

                        let cache = {
                                [object.name]: (object.saveValue !== undefined) ? object.saveValue : editor.getOptions()[object.name]
                            }

                        if (!_.some(self.$props.cache, cache)){
                            self.$emit('updateCache', cache);
                        }

                        lists.data.class = 'lists-inputs'
                        lists.data.attrs = {
                            'data-category': self.getName(object.category),
                            id: object.name
                        }
                        lists.children.push(label);
                        lists.children.push(select);
                    })(this);
                    break;

                case "dropdownObject":
                    (function(self){
                        // Create <label> element
                        let label = h('label', {
                            class: 'label-text',
                            style: {
                                textTransform: 'capitalize'
                            },
                            domProps: {
                                for: object.name
                            }
                        }, self.getName(object.name) + ' :');

                        // Create <select> element
                        let select = h('select', {
                            domProps: {
                                name: object.name
                            },
                            onChange: (e) => {
                                let value = (this.value === 'true' || this.value === 'false') ? JSON.parse(this.value) : this.value;
                                editor.setOption(object.name, value);
                            }
                        }, object.value.map((val, i) => {
                            // Create <option> element
                            let selected = false;

                            // Set selected & editor options
                            if(object.saveValue === val){
                                selected = true;
                                editor.setOption(object.name, object.saveValue);
                            } else if(object.saveValue === undefined){
                                (editor.getOptions()[object.name] === val.value) ? selected = true : null;
                            }

                            return h('option', {
                                domProps: {
                                    value: val.value,
                                    selected: selected
                                }
                            }, val.value);
                        }));

                        let cache = {
                                [object.name]: (object.saveValue !== undefined) ? object.saveValue : editor.getOptions()[object.name]
                            }

                        if (!_.some(self.$props.cache, cache)){
                            self.$emit('updateCache', cache);
                        }

                        lists.data.class = 'lists-inputs'
                        lists.data.attrs = {
                            'data-category': self.getName(object.category),
                            id: object.name
                        }
                        lists.children.push(label);
                        lists.children.push(select);
                    })(this);
                    break;

                case "checkbox":
                    (function(self){
                        // Create <label> element
                        let label = h('label', {
                            class: 'label-text',
                            style: {
                                textTransform: 'capitalize'
                            },
                            domProps: {
                                for: object.name
                            }
                        }, self.getName(object.name) + ' :');

                        // Create <select> element
                        let input = h('input', {
                            domProps: {
                                checked: object.saveValue !== undefined ? object.saveValue && editor.setOption(object.name, object.saveValue) : editor.getOptions()[object.name] ? editor.getOptions()[object.name] : null,
                                type: 'checkbox',
                                name: object.name,
                            },
                            class: 'error',
                            onChange: (e) => {
                                if (e.checked) {
                                    editor.setOption(object.name, true);
                                } else {
                                    editor.setOption(object.name, false);
                                }
                            }
                        }, []);

                        let cache = {
                                [object.name]: (object.saveValue !== undefined) ? object.saveValue : editor.getOptions()[object.name]
                            }
                        
                        if (!_.some(self.$props.cache, cache)) {
                            self.$emit('updateCache', cache);
                        }

                        lists.data.class = 'lists-inputs'
                        lists.data.attrs = {
                            'data-category': self.getName(object.category),
                            id: object.name
                        }
                        lists.children.push(label);
                        lists.children.push(input);
                    })(this);
                    break;

            }

            return lists;
        },
        loopOptions(myOptions, h){
            let editor = this.editor;
            // Create new <ul> element to group all lists in its children
            let unorderedLists = h('ul', {
                class: 'editor-options-container'
            }, []);
            // Create default <li> element as starting Header List element
            let listHeader = h('li', {
                style: {
                    marginBottom: "60px"
                }
            }, []);
            // Grab props Options Types
            let optionsTypes = this.$props.optionsTypes;
            // Assign to reference for make it as Original Options
            let originalOptions = _.assign({}, editor.getOptions());
            let categoryTitle = '';

            // Loop existing Editor Options
            for(let key of Object.keys(editor.getOptions())){

                // Assign child of listHeader
                if(optionsTypes[key] && optionsTypes[key].name === key && categoryTitle === optionsTypes[key].category) {
                    switch(true){
                        case _.isArray(optionsTypes[key].value) && !_.every(optionsTypes[key].value, _.isObject):
                            optionsTypes[key] = myOptions[key] !== undefined ? _.assign(optionsTypes[key], {
                                saveValue: myOptions[key]
                            }) : optionsTypes[key];

                            listHeader.children.push(this.optionsInputs(optionsTypes[key], 'dropdownArray', editor, h))
                            break;

                        case _.isArray(optionsTypes[key].value) && _.every(optionsTypes[key].value, _.isObject):
                            optionsTypes[key] = myOptions[key] !== undefined ? _.assign(optionsTypes[key], {
                                saveValue: myOptions[key]
                            }) : optionsTypes[key];

                            listHeader.children.push(this.optionsInputs(optionsTypes[key], 'dropdownObject', editor, h))
                            break;

                        case _.isObject(optionsTypes[key].value):
                            optionsTypes[key] = myOptions[key] !== undefined ? _.assign(optionsTypes[key], {
                                saveValue: myOptions[key]
                            }) : optionsTypes[key];

                            listHeader.children.push(this.optionsInputs(optionsTypes[key], 'slider', editor, h))
                            break;

                        case optionsTypes[key].type === 'boolean':
                            optionsTypes[key] = myOptions[key] !== undefined ? _.assign(optionsTypes[key], {
                                saveValue: myOptions[key]
                            }) : optionsTypes[key];

                            listHeader.children.push(this.optionsInputs(optionsTypes[key], 'checkbox', editor, h));
                            break;
                    }
                }
                // Create new listHeader and push to children of <ul>
                else if (optionsTypes[key] && optionsTypes[key].name === key && categoryTitle !== optionsTypes[key].category) {

                    // Create new listHeader
                    listHeader = h('li', {
                        style: {
                            marginBottom: "60px"
                        }
                    }, [])
                    // Assign Attributes to listHeader
                    listHeader.data.attrs = {
                        'data-category': this.getName(optionsTypes[key].category),
                        'data-header': this.getName(optionsTypes[key].category),
                        id: optionsTypes[key].category
                    }
                    // Create new <h1> title
                    let h1 = h('h1', {
                            class: 'editor-options-title',
                            style: {
                                cursor: 'pointer'
                            }
                        }, ' ' + this.getName(optionsTypes[key].category) + ' Options');
                    // Push <h1> to new listHeader created
                    listHeader.children.push(h1);
                    // Assign new categoryTitle for this particular loop conditional
                    categoryTitle = optionsTypes[key].category;
                    // Finally push the listHeader to <ul> parent element
                    unorderedLists.children.push(listHeader);
                }

            }

            return unorderedLists;
        }
    },
    async mounted(){
        await this.getOptions();
    },
    updated(){
        console.log("Updated Cache: ", this.$props.cache);
    },
    render(h){
        if(this.$props.editor && this.$props.optionsTypes) {
            console.log("Count Run Options: ", this.count);
            console.log("Run Options: ", performance.now());
            return this.loopOptions(this.options, h);
        }
    }
}
</script>


<style lang="scss" scoped>
@import "../../src/index.scss";

.label-text {
    color: $dim-gray;
    align-self: stretch;
    margin-bottom: 10px;
    @include arial-14-regular;
}

.editor-options-container {
    list-style-type: none;

    .editor-options-title {
        color: $dark-slate-gray-3;
        text-align: left;
        @include arial-20-bold;
    }
}

.lists-inputs{
    padding: 10px 0 10px 0;
    gap: 8px;
    display: flex;
    flex-direction: column;
    
    // Select
    & select{
      padding: 5px 20px;
      width: 80%;
      font-size: 12px;
      border-radius: 5px;
      background: #f8f8f8;
      border: none;
      font-size: 15px;
    }

    // Checkbox
    input[type='checkbox'] {
      display: block;
      border: none;
      background-color: #ccc;
      width: 62px;
      height: 27px;
      border-radius: 3px;
      box-shadow: inset 0 1px 4px rgba(0, 0, 0, .2);
      cursor: pointer;
      position: relative;
      transition: background-color 1s;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }

    input[type='checkbox'].error {
      background-color: #FF4C1F;
    }

    input[type='checkbox']:after {
      content: "";
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 45%;
      height: 80%;
      background-color: #fdfdfd;
      margin: 4%;
      border-radius: 3px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, .2);

      background: rgb(255, 255, 255);
      background: -moz-linear-gradient(top, rgba(255, 255, 255, 1) 0%, rgba(243, 243, 243, 1) 100%);
      background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, rgba(255, 255, 255, 1)), color-stop(100%, rgba(243, 243, 243, 1)));
      background: -webkit-linear-gradient(top, rgba(255, 255, 255, 1) 0%, rgba(243, 243, 243, 1) 100%);
      background: -o-linear-gradient(top, rgba(255, 255, 255, 1) 0%, rgba(243, 243, 243, 1) 100%);
      background: -ms-linear-gradient(top, rgba(255, 255, 255, 1) 0%, rgba(243, 243, 243, 1) 100%);
      background: linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(243, 243, 243, 1) 100%);
      filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#ffffff', endColorstr='#f3f3f3', GradientType=0);

      transition: .5s all;
    }

    input[type='checkbox']:checked {
      background-color: #89F869;
    }

    input[type='checkbox']:checked:after {
      left: 45%;
    }


    // Slider
    /* Range Slider */
    .range-slider__range {
      -webkit-appearance: none;
      width: calc(100% - (73px));
      height: 19px;
      border-radius: 5px;
      border:1px solid #E1E1E1;
      background: #F0F0F0;
      outline: none;
      padding: 0;
      display: inline-block;
      margin: 0;
    }

    .range-slider__range::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 23px;
      height: 23px;
      border-radius: 5px;
      background: #484848;
      cursor: pointer;
      transition: background .15s ease-in-out;
    }

    .range-slider__range::-webkit-slider-thumb:hover {
      background: #3a3a3a;
    }

    .range-slider__range:active::-webkit-slider-thumb {
      background: #2e2b2b;
    }

    .range-slider__range::-moz-range-thumb {
      width: 23px;
      height: 23px;
      border: 0;
      border-radius: 5px;
      background: #484848;
      cursor: pointer;
      transition: background .15s ease-in-out;
    }

    .range-slider__range::-moz-range-thumb:hover {
      background: #3a3a3a;
    }

    .range-slider__range:active::-moz-range-thumb {
      background: #2e2b2b;
    }

    .range-slider__range:focus::-webkit-slider-thumb {
      box-shadow: 0 0 0 3px #fff, 0 0 0 6px #2e2b2b;
    }

    .range-slider__value {
      display: inline-block;
      position: relative;
      width: 60px;
      color: #fff;
      line-height: 20px;
      text-align: center;
      border-radius: 3px;
      background: #484848;
      padding: 5px 10px;
      margin-left: 8px;
    }

    .range-slider__value:after {
      position: absolute;
      top: 8px;
      left: -7px;
      width: 0;
      height: 0;
      border-top: 7px solid transparent;
      border-right: 7px solid #2c3e50;
      border-bottom: 7px solid transparent;
      content: '';
    }

    ::-moz-range-track {
      background: #d7dcdf;
      border: 0;
    }

    input::-moz-focus-inner,
    input::-moz-focus-outer {
      border: 0;
    }
}
</style>