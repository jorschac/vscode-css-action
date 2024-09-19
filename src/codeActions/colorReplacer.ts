import RegexReplacer from "./regexReplacer";
import {
  normalizeSizeValue,
  renderOptions,
  BultinTemplateVar,
} from "../utils/index";
import tinycolor from "tinycolor2";

export default class ColorVarReplacer extends RegexReplacer {
  private colorRegexParts = [
    "(#[0-9a-f]{3,8}\\b)",
    "(rgb|hsl)a?[^)]*\\)",
    `(\\b(${Object.keys(tinycolor.names).join("|")})\\b)`,
  ];
  public regex = new RegExp(this.colorRegexParts.join("|"), "i");
  private variableMapper: Map<string, Set<string>>;
  private colorReplaceOptions: string[];

  constructor({
    variableMapper,
    colorReplaceOptions,
  }: {
    variableMapper: Map<string, Set<string>>;
    colorReplaceOptions: string[];
  }) {
    super();
    this.variableMapper = variableMapper;
    this.colorReplaceOptions = colorReplaceOptions;
  }

  // TODO: 已经玩成了fixdiag的编写， 怎么在ca结果用户接受后调用这个fixdiag?
  public getReplaceTargets(originText: string): string[] {
    const colorStr = tinycolor(originText).toHex8String();
    const varNames = this.variableMapper.get(colorStr) || new Set();
    const context = {
      [BultinTemplateVar.matchedText]: originText,
    };

    return renderOptions(this.colorReplaceOptions, varNames, context);
  }
}
