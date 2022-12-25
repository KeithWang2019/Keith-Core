import ToolKit from "./ToolKit";
import VNodeState from "./VNodeState";

export default class View {
  #disposed = false;
  $key = null;
  __vnode = null;
  __events = null;
  __name = null;

  constructor(option) {
    if (option) {
      this.__events = option.events;
      this.$key = option.key;
    }
  }

  async __render(containerId, parentView) {
    let vnode = await this.render();

    console.log(parentView + ">" + this.__name);

    if (typeof containerId == "string") {
      document
        .getElementById(containerId)
        .appendChild(await vnode.draw(parentView + ">" + this.__name));
    } else {
      containerId.appendChild(await vnode.draw(parentView + ">" + this.__name));
    }
    // 渲染完成前已被释放
    if (this.#disposed) {
      this.__dispose();
    }

    this.__vnode = vnode;
    return vnode;
  }

  async __refresh(parentView) {
    let willVNode = await this.render();
    await this.__vnode.diff(willVNode);
    this.__vnode.nextNodeState = VNodeState.update;
    console.log(parentView + ">" + this.__name);
    
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

  __dispose() {
    this.#disposed = true;
    if (this.__vnode) {
      this.__vnode.dispose(true);
      this.__vnode = null;
    }
    if (this.__events) {
      this.__events = null;
    }
  }
}
