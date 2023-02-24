export default class ToolKit {
  public static requireJSAndCss(urls: Array<String>): Promise<void>;
  public static delayRun(id: String, millisecond: Number): Promise<void>;
}
