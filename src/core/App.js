import VClassState from "./VClassState";

export default class App {
  /**
   * 当前状态
   */
  classState = VClassState.none;

  plugins = [];

  constructor() {}

  async init(containerId) {
    if (this.classState == VClassState.none) {
      this.classState = VClassState.init;

      for (let i = 0; i < this.plugins.length; i++) {
        let plugin = this.plugins[i];
        await plugin.init({ containerId });
      }

      return this.instance;
    }
    return null;
  }

  use(plugin) {
    this.plugins.push(plugin);
  }
}
