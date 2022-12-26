import VClass from "./VClass";
import VClassState from "./VClassState";
import VNodeState from "./VNodeState";

export default class VNode {
  el = null;

  tagName = null;
  childNodes = null;
  attributes = null;
  eventListeners = null;
  className = null;
  style = null;
  value = null;
  key = null;
  ref = null;
  currentIndex = null;
  nextIndex = null;

  /**
   * 绘画状态
   */
  nextNodeState = VNodeState.insert;

  constructor(tagName) {
    this.tagName = tagName;
  }

  addEventListener(type, listener) {
    if (this.eventListeners == null) {
      this.eventListeners = {};
    }
    this.eventListeners[type] = listener;
  }

  setAttribute(attrName, attrValue) {
    if (this.attributes == null) {
      this.attributes = {};
    }
    this.attributes[attrName] = attrValue;
  }

  setClass(className) {
    if (typeof className === "string") {
      this.className = className;
    } else {
      let classNameString = "";
      Object.keys(className).forEach((name) => {
        if (className[name]) {
          classNameString += name + " ";
        }
      });
      this.className = classNameString.trimEnd();
    }
  }

  setStyle(style) {
    // if(typeof style==="string"){
    //   this.style = style;
    // }
    // this.style[styleName] = styleValue;
    this.style = style;
  }

  setRef(ref) {
    this.ref = ref;
  }

  appendChild(childVNode) {
    if (this.childNodes == null) {
      this.childNodes = [];
    }
    this.childNodes.push(childVNode);
  }

  async draw(parentView) {
    switch (this.tagName) {
      case "#text":
        if (this.nextNodeState == VNodeState.insert) {
          this.el = document.createTextNode(this.value);
        } else {
          this.el.data = this.value;
        }
        break;
      default:
        if (this.nextNodeState == VNodeState.insert) {
          this.el = document.createElement(this.tagName);
        }
        if (this.attributes) {
          Object.keys(this.attributes).forEach((key) => {
            this.el.setAttribute(key, this.attributes[key]);
          });
        }
        if (this.className) {
          this.el.className = this.className;
        }
        if (this.style) {
          if (typeof this.style === "string") {
            this.el.setAttribute("style", this.style);
          } else {
            Object.keys(this.style).forEach((key) => {
              this.el.style[key] = this.style[key];
            });
          }
        }
        if (this.eventListeners) {
          Object.keys(this.eventListeners).forEach((key) => {
            this.el.addEventListener(key, this.eventListeners[key], false);
          });
        }
        if (this.childNodes) {
          let tempRefMapArray = {};
          let tempRefMapFunction = {};

          for (let i = 0; i < this.childNodes.length; i++) {
            let childNode = this.childNodes[i];

            if (childNode instanceof VClass) {
              let instance = null;

              if (childNode.classState == VClassState.none) {
                instance = await childNode.init(this.el, parentView);
              } else {
                instance = await childNode.update(parentView);
              }
              if (childNode.option && childNode.option.ref) {
                if (!tempRefMapArray[childNode.option.ref]) {
                  tempRefMapArray[childNode.option.ref] = [instance];
                  tempRefMapFunction[childNode.option.ref] =
                    childNode.option.ref;
                } else {
                  tempRefMapArray[childNode.option.ref].push(instance);
                }
              }
              if (childNode.currentIndex != childNode.nextIndex) {
                let currentChildNodeEl = childNode.instance.__vnode.el;
                let newPlaceChildNodeEl =
                  currentChildNodeEl.parentNode.childNodes[childNode.nextIndex];
                currentChildNodeEl.parentNode.insertBefore(
                  currentChildNodeEl,
                  newPlaceChildNodeEl
                );
              }
            } else {
              if (childNode.nextIndex != childNode.currentIndex) {
                let childEl = await childNode.draw(parentView);
                this.el.appendChild(childEl);
              } else {
                if (this.nextNodeState == VNodeState.insert) {
                  this.el.appendChild(await childNode.draw(parentView));
                } else {
                  await childNode.draw(parentView);
                }
              }
              if (childNode.ref) {
                if (!tempRefMapArray[childNode.ref]) {
                  tempRefMapArray[childNode.ref] = [childNode.el];
                  tempRefMapFunction[childNode.ref] = childNode.ref;
                } else {
                  tempRefMapArray[childNode.ref].push(childNode.el);
                }
              }
              if (childNode.currentIndex != childNode.nextIndex) {
                let currentChildNodeEl = childNode.el;
                let newPlaceChildNodeEl =
                  currentChildNodeEl.parentNode.childNodes[childNode.nextIndex];
                currentChildNodeEl.parentNode.insertBefore(
                  currentChildNodeEl,
                  newPlaceChildNodeEl
                );
              }
            }
          }

          Object.keys(tempRefMapArray).forEach((key) => {
            tempRefMapFunction[key](tempRefMapArray[key]);
          });
          tempRefMapArray = null;
          tempRefMapFunction = null;
        }
        break;
    }
    this.nextNodeState = VNodeState.none;

    return this.el;
  }

  async diff(newNode) {
    // if (!this.childNodes && !newNode.childNodes) {
    //   return [];
    // }
    if (this.childNodes == null) {
      this.childNodes = [];
    }
    if (newNode.childNodes == null) {
      newNode.childNodes = [];
    }
    let tempMapChildNodes = {};
    let tempWillChildNodes = [];

    // 制作临时Map对象，用于节点排除
    for (let i = 0; i < this.childNodes.length; i++) {
      tempMapChildNodes[i] = this.childNodes[i];
      tempMapChildNodes[i].currentIndex = i;
    }

    for (let i = 0; i < newNode.childNodes.length; i++) {
      let vnode2ChildNode = newNode.childNodes[i];
      let found = false;

      let tempMapChildNodesKeyArray = Object.keys(tempMapChildNodes);
      for (let j = 0; j < tempMapChildNodesKeyArray.length; j++) {
        let nodeIndex = tempMapChildNodesKeyArray[j];
        let childNode = tempMapChildNodes[nodeIndex];

        if (
          vnode2ChildNode.key == childNode.key &&
          vnode2ChildNode.tagName == childNode.tagName
        ) {
          childNode.nextIndex = i;
          childNode.nextNodeState = VNodeState.update;

          switch (childNode.tagName) {
            case "#text":
              childNode.value = vnode2ChildNode.value;
              break;
          }

          tempWillChildNodes.push(childNode);
          delete tempMapChildNodes[nodeIndex];
          found = true;

          try {
            if (childNode instanceof VClass) {
              // childNode.update();
            } else {
              childNode.diff(vnode2ChildNode);
            }
          } catch (e) {
            debugger;
          }

          break;
        }
      }

      if (!found) {
        vnode2ChildNode.nextIndex = i;
        vnode2ChildNode.nextNodeState = VNodeState.insert;
        tempWillChildNodes.push(vnode2ChildNode);
      }
    }

    this.childNodes = tempWillChildNodes;

    let tempMapNeedReleaseKeyArray = Object.keys(tempMapChildNodes);
    for (let j = 0; j < tempMapNeedReleaseKeyArray.length; j++) {
      let mapKey = tempMapNeedReleaseKeyArray[j];
      let vnode1ChildNode = tempMapChildNodes[mapKey];
      if (vnode1ChildNode instanceof VClass) {
        if (vnode1ChildNode.option && vnode1ChildNode.option.ref) {
          vnode1ChildNode.option.ref(null);
        }
      } else {
        if (vnode1ChildNode.ref) {
          vnode1ChildNode.ref(null);
        }
      }
      vnode1ChildNode.dispose(true);
    }

    tempMapChildNodes = null;
  }

  dispose(delEl) {
    if (this.childNodes) {
      for (let i = 0; i < this.childNodes.length; i++) {
        let childNode = this.childNodes[i];
        childNode.dispose(delEl);
      }
    }
    if (this.attributes) {
      Object.keys(this.attributes).forEach((key) => {
        this.el.setAttribute(key, null);
        this.el.removeAttribute(key);
      });
    }
    if (this.style) {
      Object.keys(this.style).forEach((key) => {
        this.el.style[key] = null;
      });
    }

    if (this.eventListeners) {
      Object.keys(this.eventListeners).forEach((key) => {
        this.el.removeEventListener(key, this.eventListeners[key], false);
      });
    }

    if (delEl) {
      this.el.parentNode.removeChild(this.el);
    }

    this.tagName = null;
    this.childNodes = null;
    this.attributes = null;
    this.eventListeners = null;
    this.className = null;
    this.style = null;
    this.value = null;
    this.key = null;
    this.ref = null;
    this.el = null;
  }
}
