![Banner](/assets/banner.png)

# Css Variables Replacer

A vscode extension helps replacing CSS properties with CSS variables on **.css/.less/.scss/.vue files**, with extensive support for industry-level needs. <br>

[Bug reports](https://github.com/jorschac/Issues/issues)


- [Css Variables Replacer](#css-variables-replacer)
  - [What's for?](#whats-for)
  - [Usage](#usage)
  - [Compility](#compility)
  - [Config](#config)
  - [Special Thanks](#special-thanks)

## What's for?

Given a style variables declaration files (either local or cloud-deployed), Css Code Action proivides dynamic dianostcis and quick fix options to current stylesheet file. **This will help developers effortlessly replace numeric style properties with neat concise style variables on their existing files**.<br>

## Usage

1. ### prepare your style variables declaration files <br>

   > style variables declaration file could be local

   ![placeholder for image-variable-declare-file](/assets/vars.png) <br>

   > and it could be cloud-deployed

   ![placeholder for image-variable-cdn-declare-file](/assets/css-cdn.png) <br>

2. ### make sure you configure it appropriately so that extension can locate your declaration files <br>

   > in your settings

   ![placeholder for image-settins](/assets/settins.png) <br>

3. ### now move to the file you are working on <br>
   ![placeholder for image-diagnostics](/assets/css-sample.png) <br>
   ![placeholder for image-pallete](/assets/palette.png) <br>
   ![placeholder for image-fixoptions](/assets/fix-options.png) <br>
   ![placeholder for image-fixed](/assets/fixed.png) <br>

## Compility

1. ### ALL Formats <br>

   CSS Variables Replacer can read from declaration files in **.css/.less/.scss**. Diagnostics and fixes
   can be made to files in **.css/.less/.scss/.vue**

   check [screenshots](https://github.com/jorschac/vscode-css-action/tree/master/assets) and [tests](https://github.com/jorschac/vscode-css-action/tree/master/tests) for more examples

2. ### Auto Transfers <br>

   `black, #000000, hsl(0deg, 0%, 0%),  hwb(0deg, 0%, 100%), rgba(0,0,0)` are actually refering to the same color. Distinguishing them **shouldn't be your concern.** By adding anyone of above to declaration file, all
   rest of values can be detected automatically if used inappropriately in stylesheet files.

   e.g

   you have following statement in your declaration file:

   ```css
   :root {
     --text-color: #000000;
   }
   ```

   All of following should be **"waved and fixable"**

   ```css
   .background {
     color: #000000;
     /**
       color: #000;
       color: black;
       color: rgba(0,0,0)
       color: hsl(0deg, 0%, 0%)
       color: hwb(0deg, 0%, 100%)
       */
   }
   ```

## Config

for those who may not know, you can configure it in settins.json or File -> Settings...

1. ### baseDir

   Base directory to your variables file. Ideally the shared root path to all your declaration files. Default
   value will be the toppest directory of your project. <br>

   **example:** <br>
   `cssReplacer.baseDir='/Users/name_1/dir_2/project_3'`<br>

2. ### variablesFile

   style variables file path. multiple files paths should be seperated by coma <br>

   **example:** <br>
   `cssReplacer.variablesFile='src/variables/vriable.css'`<br>

   > In this case, final absolute path to your variable file will be:
   > **'/Users/name_1/dir_2/project_3/src/variables/vriable.css'**

3. ### severity

   severity level of diagnostics

   0 - disable,

   1 - information,

   2 - warning,

   3 - error,

   default value is 2 <br>

---

🤔 Following settings are not recommanded to change, but still you can change them, as long as you know what you are doing 🤔

---

4. ### ejs render context:

   ```js
   {
     _VAR_NAME_: 'color and size var name defined in variablesFile',
     _MATCHED_TEXT_: 'origin text matched by regex',
     _REM_RESULT_: 'rem result converted from px value based on rootFontSize, only in `colorReplaceOptions`'
   }
   ```

5. ### Color Replace

   > color replace help replace hex css string to color variable defined in (scss/less) file.

   ```json
   {
     "cssReplacer.variablesFile": "src/style/variables.scss",
     "cssReplacer.colorReplaceOptions": ["<%= _VAR_NAME_ %>"]
   }
   ```

![color replace action](https://tva1.sinaimg.cn/large/0081Kckwly1gld7ygo47aj319h0u07b3.jpg)

6. ### Px convert

   > px convert help convert px to sccc/less func or auto calc based on root font size.

   ```json
   {
     "cssReplacer.rootFontSize": 16,
     "cssReplacer.pxReplaceOptions": [
       "<%= _VAR_NAME_ %>",
       "<%= _REM_RESULT_ %>",
       "px2rem(<%= _MATCHED_TEXT_ %>)"
     ]
   }
   ```

![addition action](https://tva1.sinaimg.cn/large/0081Kckwly1gldfsn0l21j317w0u0wjn.jpg)


## Special Thanks

Great Great thanks to [vscode-css-action](https://github.com/kikyous/vscode-css-action) and [vscode-css-variables](https://github.com/vunguyentuan/vscode-css-variables). Thanks for ideas and inspirations 🚀



