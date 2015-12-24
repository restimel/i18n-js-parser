# i18n JS parser

A tool to manage translation in your code. It looks for strings that must be translated and help you to find which strings are still not translated or are become useless.

A web interface helps you to manage all strings.

You can configure your dictionary format as well from input and output.

Results are dictionary files which can be loaded by your i18n library (like https://github.com/restimel/i18n-js-formatter).

## Goal

i18n-js-parser's mission is to ease the management of keeping i18n dictionary files up-to-date (with latest strings, without old useless sentences and keep them all translated).

## Version 0.0.8

Current version supports dictionaries parsing and output templating.
It still missing code parsing to retrieve all strings that must be translated from your code files. (building dictionary)

*If you want you can help me to improve it. Fork the project and pull request your change.*

## Use cases

* Look for all non translated sentences → Use filter "Partial" or "Not translated" for strings which have no translations at all.

* Delete useless sentences → Use filter "Useless" and then delete all display senetcnes

* Translate sentences which have changed → Look for your new sentence (Filter "New" or Filter "Not translated") and then translate it (you have the old text in similar text section at the right). You can also use the auto-filler to add the first similar sentence and then you can do the small change needed.

## Technology

Back-end
* Node JS

Front-end
* Backbone
* Bootstrap

These 2 libraries are used from CDN, you can change links (in pages/index.html) if you want to run the application locally.

## Start

Go to the root folder of the project and run:

    node main.js

Then in your browser enter the given URL (by default it is htttp://localhost:8000/index.html).


If you want to use a configuration file located elsewhere add its location as argument:

	node main.js ./pages/configuration.json

## Configuration

You can create a configuration.json file at the root of the application to run it with a different configuration.

This is a json file with the following attributes. All attributes are optional, default values will then be used.

* path: This is an object containg all references to path files.
    * dictionaries: This refers to existing dictionary. These files will be read as input.
        * lng: It stores path of dictionaries containing only one language. The attribute name must be the language key.
        example:

            ```javascript
            {"path": {"dictionaries": {
                "lng": {
                    "en": "./ressources/dictionary_en.json"
                }
            }}}
            ```

        Default values is an empty object.

        * globals: list of path for files containing all languages.
        example:

            ```javascript
            {"path": {"dictionaries": {
                "globals": [
                    "./ressources/dictionary.json"
                ]
            }}}
            ```

        Default value is an empty array.

    * parsedFile: refers to where the file which must be sent to the front-end is created and stored.
    example:

        ```javascript
        {"path": {
            "parsedFile": "./ressources/parsed.json"
        }}
        ```

    Default value is "./ressources/parsed.json".

    * dictionary: refers to where the file which contains old keys and which is sent to the front-end is created and stored.
    example:

        ```javascript
        {"path": {
            "dictionary": "./ressources/dictionary.json"
        }}
        ```

    Default value is "./ressources/dictionary.json".

* adapter: This object contains all configuration related to adapter (interpreting the dictionary input).
    * rules: This is an object containing all rules to read the dictionary files

* replacements: This object contains all rules for replacements. A rule is an object containing 3 attributes:
    * pattern: the pattern to look for (a regular expression)
    * flags: the flags to apply on the RegExp
    * substr: A string which replace the pattern

* templates: It contains all templates to define the ouput format. Each attribute can be use as a template replacement.
Templates format are:
    * @@    display a @
    * @tag@ refers to another tag template
    * @TAG@ refers to predefined tag:
        * ITEM: the dictionary item
        * KEY: the key of the item
        * CONTEXT: the context of the item
        * LNG: the language of the sentence (must be used in a LABELS context)
        * LABEL: the translation of the sentence (must be used in a LABELS context)
        * FILE: the path of the file (must be used in a FILES context)
    * @tag[CMD]@ iterate the tag with the CMD as context. Possible CMD:
        * ITEMS: the list of items
        * LABELS: the list of labels sentences
        * FILES: the list of files
    * @tag[CMD](value)@ join the results with 'value' instead of empty string
    *
    * @obj.prop@ get the property 'prop' from the objet 'obj'. obj can be either a tag either a cmd
    * @tag{CMD}@ display the tag only if CMD is truthy
    * @tag~replacement@ display the tag and apply the replacement on it. The replacement refers to an attribute defined in "replacements"
example:

	```javascript
    {
        templates: {
            item: '{\"key\":\"@KEY@\"@context{CONTEXT}@,\"labels\":{@label[LABELS](,)@},\"files\":[@file[FILES](,)@]}',
            context: ',\"context\":\"@CONTEXT@\"',
            label: '\"@LNG@\":\"@LABEL@\"',
            file: '\"@FILE@\"'
        }
    }
    ```

* output: list of output files. It describes which files must be output and how. The tag `@tag@` are defined in templates (cf above).
example:

```javascript
{
    output: [{
        path: '.ressources/dictionary.json',
        format: '[@item[ITEMS](,)@]'
    }]
}
```
