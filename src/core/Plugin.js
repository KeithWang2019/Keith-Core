export default class Plugin {
  name = null;
  constructor(name) {
    this.name = name;
  }
  async init({ containerId, app }) {}
}
