import ToolKit from "./ToolKit";
import VNodeState from "./VNodeState";

export default class View {
  #disposed = false;
  $key = null;
  __vnode = null;
  __events = null;
  __name = null;

  constructor(option) {
    this.setOption(option);
  }

  setOption(option) {
    if (option) {
      this.__events = option.events;
      this.$key = option.key;
    }
  }

  /**
   * 首次渲染
   * @param {*} containerId
   * @param {*} parentView
   * @returns
   */
  async __render(containerId, parentView) {
    await this.onPreRender();

    let vnode = await this.render();
    if (typeof containerId == "string") {
      document
        .getElementById(containerId)
        .appendChild(await vnode.draw(parentView + ">" + this.__name));
    } else {
      containerId.appendChild(await vnode.draw(parentView + ">" + this.__name));
    }
    // 渲染完成前已被释放
    if (this.#disposed) {
      await this.__dispose();
    }

    this.__vnode = vnode;
    return vnode;
  }

  /**
   * 刷新渲染
   * @param {*} parentView
   */
  async __refresh(parentView) {
    await this.onPreRender();
    let willVNode = await this.render();
    await this.__vnode.diff(willVNode);
    this.__vnode.nextNodeState = VNodeState.update;
    await this.__vnode.draw(parentView + ">" + this.__name);
  }

  $emit(eventName, val) {
    if (this.__events[eventName]) {
      this.__events[eventName](val);
    }
  }

  async update() {
    await this.__refresh("");
  }

  /**
   * 渲染之前
   */
  async onPreRender() {}

  /**
   * 释放之前
   */
  async onPreDispose() {}

  getJson() {
    throw `${this.__name}未定义getJson方法`;
  }

  async __dispose() {
    this.#disposed = true;
    await this.onPreDispose();
    if (this.__vnode) {
      await this.__vnode.dispose(true);
      this.__vnode = null;
    }
    if (this.__events) {
      this.__events = null;
    }
  }
}
