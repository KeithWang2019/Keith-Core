import AppProxyHandler from "./AppProxyHandler";
import VClassState from "./VClassState";

export default class App {
  /**
   * 当前状态
   */
  #classState = VClassState.none;

  __plugins = {};

  constructor() {}

  async init(containerId) {
    if (this.#classState == VClassState.none) {
      this.#classState = VClassState.init;

      for (let name in this.__plugins) {
        await this.__plugins[name].init({
          containerId,
          app: new Proxy(this, AppProxyHandler),
        });
      }

      return this.instance;
    }
    return null;
  }

  use(plugin) {
    this.__plugins[plugin.name] = plugin;
  }
}
