import ToolKit from "./ToolKit";
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

  getKey() {
    return this.key;
  }

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
    // if (this.nextNodeState == VNodeState.none) {
    //   return this.el;
    // }

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
                break;
              default:
                break;
            }
            this.el.setAttribute(key, val);
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

          for (
            let nodeIndex = 0;
            nodeIndex < this.childNodes.length;
            nodeIndex++
          ) {
            let childNode = this.childNodes[nodeIndex];

            // if (childNode.nextNodeState == VNodeState.remove) {
            //   childNode.dispose(true);
            // } else {
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
            // }
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
    if (this.childNodes == null) {
      this.childNodes = [];
    }
    if (newNode.childNodes == null) {
      newNode.childNodes = [];
    }
    let tempMapChildNodes = {};
    let tempOldChildNodesForIndexWithOutDelNode = [];
    let tempWillChildNodes = [];

    // 制作临时Map对象，用于节点排除
    for (let nodeIndex = 0; nodeIndex < this.childNodes.length; nodeIndex++) {
      tempMapChildNodes[nodeIndex] = this.childNodes[nodeIndex];
      tempOldChildNodesForIndexWithOutDelNode.push(this.childNodes[nodeIndex]);
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
          }

          // =================================================
          // 先删除
          tempWillChildNodes.push(childNode);
          delete tempMapChildNodes[nodeKey];
          found = true;
          // =================================================

          try {
            if (childNode instanceof VClass) {
              // 注意后面不能对比nextIndex，只能并且应该对比currentIndex
              childNode.nextIndex = newNodeIndex;
              if (childNode.classState == VClassState.none) {
                childNode.nextNodeState = VNodeState.insert;
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
              childNode.nextIndex = newNodeIndex;
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
        newNodeChildNode.nextIndex = newNodeIndex;
        newNodeChildNode.nextNodeState = VNodeState.insert;
        tempWillChildNodes.push(newNodeChildNode);
      }
    }

    this.childNodes = tempWillChildNodes;

    let tempMapNeedReleaseKeyArray = Object.keys(tempMapChildNodes);
    for (let j = tempMapNeedReleaseKeyArray.length - 1; j >= 0; j--) {
      let mapKey = tempMapNeedReleaseKeyArray[j];
      let vnode1ChildNode = tempMapChildNodes[mapKey];
      // tempOldChildNodesForIndexWithOutDelNode =
      //   tempOldChildNodesForIndexWithOutDelNode.filter(
      //     (node) => vnode1ChildNode !== node
      //   );
      tempOldChildNodesForIndexWithOutDelNode.splice(parseInt(mapKey), 1);
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

    // 重排旧虚拟节点序号，虚拟节点序号是排除删除后的虚拟节点
    for (
      let oldNodeIndexWithOutDelNode = 0;
      oldNodeIndexWithOutDelNode <
      tempOldChildNodesForIndexWithOutDelNode.length;
      oldNodeIndexWithOutDelNode++
    ) {
      tempOldChildNodesForIndexWithOutDelNode[
        oldNodeIndexWithOutDelNode
      ].currentIndex = oldNodeIndexWithOutDelNode;
    }

    tempOldChildNodesForIndexWithOutDelNode = null;
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
