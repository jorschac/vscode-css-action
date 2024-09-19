import { Range, Color, Location, Position } from "vscode-languageserver/node";
import * as fs from "fs";
//import fastGlob from "fast-glob";
import fastGlob from "fast-glob";
import * as culori from "culori";
import postcss from "postcss";
import { pathToFileURL } from "url";
import CacheManager from "./CacheManager";
import path from "path";
import postcssSCSS from "postcss-scss";
import postcssLESS from "postcss-less";

export type CSSSymbol = {
  name: string;
  value: string;
};

export type CSSVariable = {
  symbol: CSSSymbol;
  definition: Location;
  color?: Color;
};

export interface CSSVariablesSettings {
  lookupFiles: string[];
  blacklistFolders: string[];
}

export const defaultSettings: CSSVariablesSettings = {
  lookupFiles: ["**/*.less", "**/*.scss", "**/*.sass", "**/*.css"],
  blacklistFolders: [
    "**/.cache",
    "**/.DS_Store",
    "**/.git",
    "**/.hg",
    "**/.next",
    "**/.svn",
    "**/bower_components",
    "**/CVS",
    "**/dist",
    "**/node_modules",
    "**/tests",
    "**/tmp",
  ],
};

function culoriColorToVscodeColor(color: culori.Color): Color {
  const toRgb = culori.converter("rgb");
  const rgb = toRgb(color);
  return { red: rgb.r, green: rgb.g, blue: rgb.b, alpha: rgb.alpha ?? 1 };
}

function isColor(str: string) {
  const colorTemp = culori.parse(str);

  return !!colorTemp;
}

/**
 * get ast of given style file, supports: .css/.less/.scss
 * @param filePath path to that file
 * @param content content of that file
 * @returns
 */
function getAST(filePath: string, content: string) {
  const fileExtension = path.extname(filePath);

  if (fileExtension === ".less") {
    return postcssLESS.parse(content);
  }

  if (fileExtension === ".scss") {
    return postcssSCSS.parse(content);
  }

  return postcss.parse(content);
}

/**
 * Integrated utils set to parse and maintain css variables from files
 */
export default class CssVariableManager {
  private cacheManager = new CacheManager<CSSVariable>();

  /**
   * parse css Vars from a style file and save to cache manager
   * @param param0
   */
  public parseCSSVariablesFromText = async ({
    content,
    filePath,
  }: {
    content: string;
    filePath: string;
  }) => {
    try {
      this.cacheManager.clearFileCache(filePath);
      const ast = getAST(filePath, content);
      // absolute path to file with appropriate protocal
      const fileURI = pathToFileURL(filePath).toString();
      const importUrls: string[] = [];

      // check and parse @import part in style file
      ast.walkAtRules((atRule) => {
        if (atRule.name === "import") {
          // only support absolute url for now
          const match = atRule.params.match(
            /['"](?<protocol>http|https):\/\/(?<url>.*?)['"]/
          );
          if (match) {
            const groups = match.groups;
            const url = groups && `${groups.protocol}://${groups.url}`;
            url && importUrls.push(url);
          }
        }
      });

      // fetch and parse the imported style files recursively
      if (importUrls.length) {
        await Promise.all(
          importUrls.map(async (url) => {
            try {
              const response = await fetch(
                url
                //   {
                //   headers: {
                //     "Accept": "text/html"
                //   }
                // }
              );
              if (!response.ok) {
                console.log("fetch fail");
                throw new Error(`Response status: ${response.status}`);
              }
              const cssText = await response.text();
              // const cssText = await response.data;
              return this.parseCSSVariablesFromText({
                content: cssText,
                filePath: url,
              });
            } catch (err) {
              console.log(err, `cannot fetch data from ${url}`);
            }
          })
        );
      }

      ast.walkDecls((decl) => {
        if (decl.prop.startsWith("--")) {
          let startLine = decl?.source?.start?.line
              ? decl?.source?.start?.line
              : 1,
            startColumn = decl?.source?.start?.column
              ? decl?.source?.start?.column
              : 1,
            endLine = decl?.source?.end?.line ? decl?.source?.end?.line : 1,
            endColumn = decl?.source?.end?.column
              ? decl?.source?.end?.column
              : 1;

          const variable: CSSVariable = {
            symbol: {
              name: decl.prop,
              value: decl.value,
            },
            definition: {
              uri: fileURI,
              range: Range.create(
                Position.create(startLine - 1, startColumn - 1),
                Position.create(endLine - 1, endColumn - 1)
              ),
            },
          };

          const culoriColor = culori.parse(decl.value);

          if (culoriColor) {
            variable.color = culoriColorToVscodeColor(culoriColor);
          }

          // add to cache
          this.cacheManager.set(filePath, decl.prop, variable);
        }
      });
    } catch (e) {
      console.error("Style file parse fail 🤡", e);
      throw new Error("Style file parse fail 🤡" + e);
    }
  };

  /**
   * read local style files and conduct parse
   * @param workspaceFolders - list of targets directories
   * @param settings - files extensions and black list
   */
  public parseAndSyncVariables = async (
    workspaceFolders: string[],
    settings = defaultSettings
  ) => {
    for (const folderPath of workspaceFolders) {
      await fastGlob(settings.lookupFiles, {
        onlyFiles: true,
        cwd: folderPath,
        ignore: settings.blacklistFolders,
        absolute: true,
      }).then((files) => {
        return Promise.all(
          files.map((filePath) => {
            const content = fs.readFileSync(filePath, "utf8");
            return this.parseCSSVariablesFromText({
              content,
              filePath,
            });
          })
        );
      });
    }
  };

  public getAll() {
    return this.cacheManager.getAll();
  }

  public clearFileCache(filePath: string) {
    this.cacheManager.clearFileCache(filePath);
  }

  public clearAllCache() {
    this.cacheManager.clearAllCache();
  }
}
