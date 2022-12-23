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
    this.tagName = "custom:" + className.name;
    this.className = className;
    this.option = option;
    if(option){
      this.key = option.key;
    }    
  }

  async init(containerId) {
    if (this.classState == VClassState.none) {
      this.instance = new this.className(this.option);
      await this.instance.__render(containerId);
      this.#disposalData();
      this.classState = VClassState.init;
      return this.instance;
    }
    return null;
  }

  async update() {
    if (this.classState == VClassState.init) {
      await this.instance.__refresh();
      this.#disposalData();
      return this.instance;
    }
    return null;
  }

  #disposalData(){
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
