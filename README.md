# Css Code Action
  Forked from https://github.com/kikyous/vscode-css-action
  A vscode extension helps replacing CSS properties with CSS variables on .css/.less/.scss/.vue files, with extensive support for industry-level needs. All changes has been merged into original repo.

## What's for?
  Given a style variables declaration files (either local or cloud-deployed), Css Code Action proivides dynamic dianostcis and quick fix options to current stylesheet file. __This will help developers replace numeric style properties with neat concise style variables on their existing files__. 

  [placeholder for image-variable-declare-file]
  [placeholder for image-current-stylesheet-file]

## Usage
  ### Compility
  ### Config
  #### ejs render context: 
      ```js
      {
        _VAR_NAME_: 'color and size var name defined in variablesFile',
        _MATCHED_TEXT_: 'origin text matched by regex',
        _REM_RESULT_: 'rem result converted from px value based on rootFontSize, only in `colorReplaceOptions`'
      }
      ```

  #### Color Replace
      > color replace help replace hex css string to color variable defined in (scss/less) file.

      ```json
      {
        "cssAction.variablesFile": "src/style/variables.scss",
        "cssAction.colorReplaceOptions": ["<%= _VAR_NAME_ %>"]
      }
      ```
  ![color replace action](https://tva1.sinaimg.cn/large/0081Kckwly1gld7ygo47aj319h0u07b3.jpg)

  #### Px convert

      > px convert help convert px to sccc/less func or auto calc based on root font size. 

      ```json
      {
        "cssAction.rootFontSize": 16,
        "cssAction.pxReplaceOptions": ["<%= _VAR_NAME_ %>", "<%= _REM_RESULT_ %>", "px2rem(<%= _MATCHED_TEXT_ %>)"]
      }
      ```
  ![addition action](https://tva1.sinaimg.cn/large/0081Kckwly1gldfsn0l21j317w0u0wjn.jpg)
