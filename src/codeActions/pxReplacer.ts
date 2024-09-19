import RegexReplacer from "./regexReplacer";
import {
  normalizeSizeValue,
  renderOptions,
  BultinTemplateVar,
} from "../utils/index";

export default class PxReplacer extends RegexReplacer {
  public regex = new RegExp("(-?\\d+(px|rem|em)\\s*)+(?![^(]*\\))", "i");
  private rootFontSize: number;
  private variableMapper: Map<string, Set<string>>;
  private pxReplaceOptions: string[];

  constructor({
    rootFontSize,
    variableMapper,
    pxReplaceOptions,
  }: {
    rootFontSize: number;
    variableMapper: Map<string, Set<string>>;
    pxReplaceOptions: string[];
  }) {
    super();
    this.rootFontSize = rootFontSize;
    this.variableMapper = variableMapper;
    this.pxReplaceOptions = pxReplaceOptions;
  }

  private calcRem(originText: string): string {
    return originText
      .split(/\s+/)
      .map((item) => {
        const unit = item.replace(/\d+/, "");
        if (unit === "px") {
          const result = parseInt(item) / this.rootFontSize;
          const resultStr = result.toFixed(4).replace(/\.?0+$/, "");
          return `${resultStr}rem`;
        } else {
          return item;
        }
      })
      .join(" ");
  }

  public getReplaceTargets(originText: string): string[] {
    const normalizedOrigin = normalizeSizeValue(originText) || "";

    const varNames = this.variableMapper.get(normalizedOrigin) || new Set();
    const context = {
      [BultinTemplateVar.matchedText]: originText,
      [BultinTemplateVar.remResult]: this.calcRem(normalizedOrigin),
    };
    return renderOptions(this.pxReplaceOptions, varNames, context);
  }
}
