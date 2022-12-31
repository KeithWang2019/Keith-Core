import ToolKit from "./ToolKit";
import VClass from "./VClass";
import VClassState from "./VClassState";
import VNodePositionState from "./VNodePositionState";
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
  nextIndex = null;

  getKey() {
    return this.key;
  }

  getCurrentIndex() {
    let el = this.el;
    let parentNode = this.el.parentNode;
    if (parentNode == null) {
      return null;
    }
    let childNodes = parentNode.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      if (childNodes[i] == el) {
        return i;
      }
    }
    return null;
  }

  /**
   * 数据状态
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
            let val = this.attributes[key];
            switch (key) {
              case "value":
                if (val === null) {
                  val = "";
                }
                this.el.value = val;
                break;
              default:
                this.el.setAttribute(key, val);
                break;
            }
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

        if (this.childNodes && this.childNodes.length > 0) {
          // 记住，this.childNodes此时的顺序是最终的顺序，是正确的顺序
          let tempRefMapArray = {};
          let tempRefMapFunction = {};

          for (
            let nodeIndex = 0;
            nodeIndex < this.childNodes.length;
            nodeIndex++
          ) {
            let childNode = this.childNodes[nodeIndex];
            childNode.nextIndex = nodeIndex;
          }

          for (
            let nodeIndex = 0;
            nodeIndex < this.childNodes.length;
            nodeIndex++
          ) {
            let childNode = this.childNodes[nodeIndex];

            if (childNode instanceof VClass) {
              let instance = null;

              if (childNode.nextNodeState == VNodeState.none) {
              } else {
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
              }
            } else {
              await childNode.draw(parentView);
              if (childNode.ref) {
                if (!tempRefMapArray[childNode.ref]) {
                  tempRefMapArray[childNode.ref] = [childNode.el];
                  tempRefMapFunction[childNode.ref] = childNode.ref;
                } else {
                  tempRefMapArray[childNode.ref].push(childNode.el);
                }
              }
            }

            try {
              if (this.changePosition(this.el, childNode)) {
                // if (childNode.nextNodeState == VNodePositionState.insert) {
                //   this.insertRearrangement(this.childNodes, childNode);
                // } else {
                //   this.updateRearrangement(this.childNodes, childNode);
                // }
              }
            } catch (ex) {
              debugger;
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

  changePosition(elParent, childNode) {
    if (childNode.getCurrentIndex() != childNode.nextIndex) {
      let currentChildNodeEl = null;
      if (childNode.instance) {
        currentChildNodeEl = childNode.instance.__vnode.el;
      } else {
        currentChildNodeEl = childNode.el;
      }
      let newPlaceChildNodeEl = elParent.childNodes[childNode.nextIndex];
      if (newPlaceChildNodeEl) {
        elParent.insertBefore(currentChildNodeEl, newPlaceChildNodeEl);
      } else {
        // debugger;
        elParent.appendChild(currentChildNodeEl);
      }
      return true;
    }
    return false;
  }

  async diff(newNode) {
    if (this.childNodes == null) {
      this.childNodes = [];
    }
    if (newNode.childNodes == null) {
      newNode.childNodes = [];
    }
    let tempMapChildNodes = {};
    let tempWillChildNodes = [];

    // 制作临时Map对象，用于节点排除
    for (let nodeIndex = 0; nodeIndex < this.childNodes.length; nodeIndex++) {
      let node = this.childNodes[nodeIndex];
      tempMapChildNodes[nodeIndex] = node;
    }

    for (
      let newNodeIndex = 0;
      newNodeIndex < newNode.childNodes.length;
      newNodeIndex++
    ) {
      let newNodeChildNode = newNode.childNodes[newNodeIndex];
      let found = false;

      let tempMapChildNodesKeyArray = Object.keys(tempMapChildNodes);
      for (let j = 0; j < tempMapChildNodesKeyArray.length; j++) {
        let nodeKey = tempMapChildNodesKeyArray[j];
        let childNode = tempMapChildNodes[nodeKey];

        if (
          newNodeChildNode.getKey() == childNode.getKey() &&
          newNodeChildNode.tagName == childNode.tagName
        ) {
          switch (childNode.tagName) {
            case "#text":
              childNode.value = newNodeChildNode.value;
              break;
            case "input":
              childNode.attributes = newNodeChildNode.attributes;
              break;
          }

          // =================================================
          tempWillChildNodes.push(childNode);
          // 优先删除
          delete tempMapChildNodes[nodeKey];
          found = true;
          // =================================================

          try {
            if (childNode instanceof VClass) {
              // 注意后面不能对比nextIndex，只能并且应该对比currentIndex
              if (childNode.classState == VClassState.none) {
                childNode.nextNodeState = VNodeState.update;
              } else {
                if (
                  !ToolKit.deepEqual(childNode.option, newNodeChildNode.option)
                ) {
                  childNode.setOption(newNodeChildNode.option);
                  childNode.nextNodeState = VNodeState.update;
                } else {
                  childNode.nextNodeState = VNodeState.none;
                }
              }
            } else {
              childNode.nextNodeState = VNodeState.update;
              childNode.diff(newNodeChildNode);
            }
          } catch (e) {
            debugger;
          }

          break;
        }
      }

      if (!found) {
        newNodeChildNode.nextNodeState = VNodeState.insert;
        tempWillChildNodes.push(newNodeChildNode);
      }
    }

    // 需要倒序删除，好重排递减
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

    this.childNodes = tempWillChildNodes;

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
