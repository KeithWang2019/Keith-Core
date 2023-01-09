import ToolKit from "./ToolKit";
import VClassState from "./VClassState";
import VNodeState from "./VNodeState";

export default class VClass {
  tagName = null;
  viewClass = null;
  option = null;
  instance = null;

  nextIndex = null;

  getKey() {
    if (this.option) {
      return this.option.key;
    }
    return null;
  }

  getCurrentIndex() {
    if (this.instance == null) {
      return null;
    }
    let el = this.instance.__vnode.el;
    let parentNode = this.instance.__vnode.el.parentNode;
    if (parentNode == null) {
      return null;
    }
    let childNodes = parentNode.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      if (childNodes[i] === el) {
        return i;
      }
    }
    return null;
  }

  /**
   * 数据状态
   */
  nextNodeState = VNodeState.insert;

  /**
   * 当前状态
   */
  classState = VClassState.none;

  constructor(viewClass, option) {
    this.tagName = "view:" + viewClass.name;
    this.viewClass = viewClass;
    this.option = option;
  }

  setOption(option) {
    this.option = option;
  }

  async init(container, parentView, app) {
    if (this.classState == VClassState.none) {
      this.instance = new this.viewClass(this.option);
      this.instance.__name = this.tagName;
      if (parentView.indexOf(">" + this.tagName) >= 0) {
        throw "[代码中存在循环嵌套]" + this.tagName;
      }
      await this.instance.__render(container, parentView, app);
      this.#disposalData();
      this.classState = VClassState.init;
      return this.instance;
    }
    return null;
  }

  async update(parentView, app) {
    if (this.classState == VClassState.init) {
      this.instance.setOption(this.option);
      await this.instance.__refresh(parentView, app);
      this.#disposalData();
      return this.instance;
    }
    return null;
  }

  #disposalData() {
    // if (this.option && this.option.ref) {
    //   this.option.ref(this.instance);
    // }
  }

  async dispose() {
    if (this.instance) {
      await this.instance.__dispose();
      this.instance = null;

      this.viewClass = null;
      this.instance = null;
      this.option = null;

      this.classState = VClassState.release;
    }
  }
}
