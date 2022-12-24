import VNode from "./VNode";

export default class ToolKit {
  constructor() {
    throw "ToolKit should not constructor.";
  }

  static id1 = 0;
  static id2 = 0;
  static id3 = 0;
  static id4 = 0;
  static uidIndex = 0;

  static uuid = null;

  static getUId() {
    switch (ToolKit.uidIndex) {
      case 0:
        ToolKit.id1++;
        ToolKit.uidIndex = 1;
        break;
      case 1:
        ToolKit.id2++;
        ToolKit.uidIndex = 2;
        break;
      case 2:
        ToolKit.id3++;
        ToolKit.uidIndex = 3;
        break;
      default:
        ToolKit.id4++;
        ToolKit.uidIndex = 0;
        break;
    }
    return (
      ToolKit.id1 + "-" + ToolKit.id2 + "-" + ToolKit.id3 + "-" + ToolKit.id4
    );
  }

  static deepClone(src) {
    if (src === null) {
      return null;
    }
    if (typeof src !== "object") {
      return src;
    }
    let des = "";
    if (src instanceof Array) {
      des = [];
    } else {
      des = {};
    }
    for (let key in src) {
      if (typeof src[key] !== "object") {
        des[key] = src[key];
      } else {
        des[key] = deepClone(src[key]);
      }
    }
    return des;
  }

  static safeDraw(){
    
  }
}
