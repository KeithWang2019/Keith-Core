import ToolKit from "./ToolKit";
import VClassState from "./VClassState";
import VNodePositionState from "./VNodePositionState";
import VNodeState from "./VNodeState";

export default class VClass {
  tagName = null;
  viewClass = null;
  option = null;
  instance = null;

  // 使用option的key
  // key = null;
  currentIndex = null;
  nextIndex = null;

  getKey() {
    if (this.option) {
      return this.option.key;
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

  async init(containerId, parentView) {
    if (this.classState == VClassState.none) {
      this.instance = new this.viewClass(this.option);
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
      this.instance.setOption(this.option);
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

      this.viewClass = null;
      this.instance = null;
      this.option = null;

      this.classState = VClassState.release;
    }
  }
}
