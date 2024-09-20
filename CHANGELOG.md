**本文档仅作给原作者参考用，PR 后会删除**

**更新内容**

- 使用 post-css 重构变量声明文件解析方式，现在支持检索本地变量声明文件，以及拉取以 cdn 资源形式部署的变量声明文件，变量声明文件现在支持.css/.less/.scss 格式

- 为活跃编辑文件添加诊断（Diagnostics）并关联 quick fix，无需使用以前的“pickVariable”指令搜索需要替换的值，诊断信息会随着窗口切换和文档更改自动更新。支持自定义告警等级 (等同于 stylelint 的功能)

- 为同一颜色值的不同格式进行适配处理。例如，当变量声明文件中有如下声明：

  ```css
  :root {
    --text-color: #000000;
  }
  ```

  那么实际使用的样式文件中出现以下任一数值都可以被检测到并添加诊断和修复：

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

- 支持的文件格式现在包括.css/.less/.scss/.vue

- 性能优化，重复的复杂运算现在会被缓存并跨文件读取，适度为切换编辑器和修改文档的回调加上防抖，避免频繁更新缓存

- 优化变量文件读取目录，使用 **路径前缀 + 相对路径** 的拼接方式帮助用户结构化管理多个变量文件，支持批量读取
  <br>

**使用方法简述**

**_配置_**

**1. 新增配置**

- variablesFile <br>

  变量文件相对路径，该路径下的所有变量文件会被批量读取解析，路径之间使用逗号分隔

- basedir <br>

  变量文件的路径前缀，举个例子：<br>

  `cssAction.baseDir='/Users/name_1/dir_2/project_3'` <br>
  `cssAction.variablesFile='src/variables/vriable.css'` <br>

  那么拼接后的变量文件读取路径为： <br>

  `/Users/name_1/dir_2/project_3/src/variables/${实际该路径下的所有变量声明文件}` <br>

- severity <br>

  诊断的严重等级， 0-关闭诊断, 1-信息级, 2-警告级, 3-错误级, 默认等级是 2

**2. 原有配置**

- rootFontSize <br>

  root font size for rem calc.

- pxReplaceOptions <br>

px replace options, '_REM_RESULT_' for rem calc result based on rootFontSize,
'_VAR_NAME_' for var name, '_MATCHED_TEXT_' for origin text

- colorReplaceOptions <br>

  color replace options, '_VAR_NAME_' for var name, '_MATCHED_TEXT_' for origin text

**_使用_**

- 变量声明文件 <br>

  ![vars](/assets/vars.png) <br>

  或者可以拉取部署在 CDN 资源上的变量声明文件 <br>

  ![vars-cdn](/assets/css-cdn.png)

  - 实际开发中的样式文件 <br>

    ![css-sample](/assets/css-sample.png) <br>

    ![palette](/assets/palette.png) <br>

    ![fix-options](/assets/fix-options.png) <br>

    ![fixed](/assets/fixed.png) <br>

    ![scss-sample](/assets/scss-sample.png) <br>

    ![less-sample](/assets/less-sample.png) <br>

    ![vue-sample](/assets/vue-sample.png) <br>

**后续迭代计划** <br>

- 支持 font-family 和圆角检查替换 <br>
- 因为 diagnostics 的局限性目前当文档修改时会触发文档全量解析，否则会出现诊断位置偏移，19 款 mac pro 会在同时编辑 30 个样式文件时出现卡顿，后续探索只解析增量内容
