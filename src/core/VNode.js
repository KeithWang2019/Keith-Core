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
  nextIndex = null;

  getKey() {
    return this.key;
  }

  getCurrentIndex() {
    let el = this.el;
    if (el == null) {
      return null;
    }
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
          let tempKeyArray = [];
          for (let i = 0; i < this.childNodes.length; i++) {
            let childNode = this.childNodes[i];
            if (childNode) {
              // 此处整理最后的下标，也就是节点所在位置
              childNode.nextIndex = i;
              // 以下是为了检测异常
              let key = childNode.getKey();
              if (key != null) {
                if (tempKeyArray.includes(childNode.getKey())) {
                  throw `[key重复]${parentView}>${childNode.tagName}[key:${key}]`;
                } else {
                  tempKeyArray.push(key);
                }
              }
            }
          }
          tempKeyArray = null;

          let tempRefMapArray = {};
          let tempRefMapFunction = {};

          let tempInsertChildNodes = [];
          let tempOtherChildNodes = [];

          // 区分插入和更新
          for (let i = 0; i < this.childNodes.length; i++) {
            let childNode = this.childNodes[i];
            if (childNode.nextNodeState == VNodeState.insert) {
              tempInsertChildNodes.push(childNode);
            } else {
              tempOtherChildNodes.push(childNode);
            }
          }

          // 处理上下移动的过程
          let tempOtherChildNodeLength = tempOtherChildNodes.length;
          for (let i = 0; i < tempOtherChildNodeLength; i++) {
            let maxAbsRange = -1;
            let maxRange = -1;
            let needHandleNode = tempOtherChildNodes[0];
            let needHandleNodeIndex = 0;

            // 优先处理步长最大的变换
            for (let j = 0; j < tempOtherChildNodes.length; j++) {
              let childNode = tempOtherChildNodes[j];
              let currentIndex = childNode.getCurrentIndex();
              if (currentIndex != null) {
                let range = childNode.nextIndex - currentIndex;
                let absRange = Math.abs(range);
                if (absRange > maxAbsRange) {
                  maxRange = range;
                  maxAbsRange = absRange;
                  needHandleNode = childNode;
                  needHandleNodeIndex = j;
                }
              }
            }

            // 在处理上下移动时，如果移动后的位置之前，存在一个或多个需要插入的节点，此时先不要处理移动，先处理移动后的位置之前的，一个或多个插入的节点
            // 再处理移动节点
            let insertChildNodeIndexs = [];
            for (let j = 0; j < tempInsertChildNodes.length; j++) {
              let insertChildNode = tempInsertChildNodes[j];
              if (insertChildNode.nextIndex < needHandleNode.nextIndex) {
                // 处理插入
                await this.runNode(
                  insertChildNode,
                  parentView,
                  tempRefMapArray,
                  tempRefMapFunction
                );
                insertChildNodeIndexs.push(j);
              }
            }
            // 从数组移除已处理的插入节点
            insertChildNodeIndexs.forEach((insertChildNodeIndex) => {
              tempInsertChildNodes.splice(insertChildNodeIndex, 1);
            });
            // 从数组移除已处理的移动节点
            tempOtherChildNodes.splice(needHandleNodeIndex, 1);

            // 处理移动
            await this.runNode(
              needHandleNode,
              parentView,
              tempRefMapArray,
              tempRefMapFunction,
              maxRange
            );
          }

          // 处理剩下的未插入的节点
          for (let i = 0; i < tempInsertChildNodes.length; i++) {
            // 处理插入
            await this.runNode(
              tempInsertChildNodes[i],
              parentView,
              tempRefMapArray,
              tempRefMapFunction
            );
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

  async runNode(childNode, parentView, refMapArray, refMapFunction, range) {
    if (childNode instanceof VClass) {
      let instance = null;

      if (childNode.nextNodeState == VNodeState.none) {
        instance = childNode.instance;
      } else {
        if (childNode.classState == VClassState.none) {
          instance = await childNode.init(this.el, parentView);
        } else {
          instance = await childNode.update(parentView);
        }
      }
      if (childNode.option && childNode.option.ref) {
        if (!refMapArray[childNode.option.ref]) {
          refMapArray[childNode.option.ref] = [instance];
          refMapFunction[childNode.option.ref] = childNode.option.ref;
        } else {
          refMapArray[childNode.option.ref].push(instance);
        }
      }
    } else {
      await childNode.draw(parentView);
      if (childNode.ref) {
        if (!refMapArray[childNode.ref]) {
          refMapArray[childNode.ref] = [childNode.el];
          refMapFunction[childNode.ref] = childNode.ref;
        } else {
          refMapArray[childNode.ref].push(childNode.el);
        }
      }
    }

    try {
      this.changePosition(this.el, childNode, range);
    } catch (ex) {
      debugger;
    }
  }

  changePosition(elParent, childNode, range) {
    if (childNode.getCurrentIndex() != childNode.nextIndex) {
      let currentChildNodeEl = null;
      if (childNode.instance) {
        currentChildNodeEl = childNode.instance.__vnode.el;
      } else {
        currentChildNodeEl = childNode.el;
      }
      let startIndex = childNode.nextIndex;
      if (range > 0) {
        startIndex++;
      }
      let newPlaceChildNodeEl = elParent.childNodes[startIndex];
      if (newPlaceChildNodeEl) {
        elParent.insertBefore(currentChildNodeEl, newPlaceChildNodeEl);
      } else {
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

  async dispose(delEl) {
    if (this.childNodes) {
      for (let i = 0; i < this.childNodes.length; i++) {
        let childNode = this.childNodes[i];
        await childNode.dispose(delEl);
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
