import ToolKit from "./ToolKit";
import VClassState from "./VClassState";
import VNodeState from "./VNodeState";

export default class VClass {
  tagName = null;
  className = null;
  option = null;
  instance = null;

  key = null;
  currentIndex = null;
  nextIndex = null;

  /**
   * 绘画状态
   */
  nextNodeState = VNodeState.insert;

  /**
   * 当前状态
   */
  classState = VClassState.none;

  constructor(className, option) {
    this.tagName = "view:" + className.name;
    this.className = className;
    this.option = option;
    if (option) {
      this.key = option.key;
    }
  }

  async init(containerId, parentView) {
    if (this.classState == VClassState.none) {
      this.instance = new this.className(this.option);
      this.instance.__name = this.tagName;
      if (parentView.indexOf(">" + this.tagName) >= 0) {
        throw this.tagName + "代码中存在循环嵌套";
      }
      await this.instance.__render(containerId, parentView);
      this.#disposalData();
      this.classState = VClassState.init;
      return this.instance;
    }
    return null;
  }

  async update(parentView) {
    if (this.classState == VClassState.init) {
      await this.instance.__refresh(parentView);
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

  dispose() {
    if (this.instance) {
      this.instance.__dispose();
      this.instance = null;

      this.className = null;
      this.instance = null;
      this.option = null;

      this.classState = VClassState.release;
    }
  }
}
