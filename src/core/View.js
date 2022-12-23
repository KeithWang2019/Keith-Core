import VNodeState from "./VNodeState";

export default class View {
  #disposed = false;
  $key = null;
  __vnode = null;
  __events = null;

  constructor(option) {
    if (option) {
      this.__events = option.events;
      this.$key = option.key;
    }
  }

  async __render(containerId) {
    let vnode = await this.render();

    if (typeof containerId == "string") {
      document.getElementById(containerId).appendChild(await vnode.draw());
    } else {
      containerId.appendChild(await vnode.draw());
    }
    // 渲染完成前已被释放
    if (this.#disposed) {
      this.__dispose();
    }

    this.__vnode = vnode;
    return vnode;
  }

  async __refresh() {
    let willVNode = await this.render();
    this.__vnode.diff(willVNode);
    this.__vnode.nextNodeState = VNodeState.update;
    this.__vnode.draw();
  }

  $emit(eventName, val) {
    if (this.__events[eventName]) {
      this.__events[eventName](val);
    }
  }

  update() {
    this.__refresh();
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
