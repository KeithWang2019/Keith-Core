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

  static deepEqual(obj1, obj2) {
    let type1 = typeof obj1;
    let type2 = typeof obj2;
    if (type1 !== type2) {
      return false;
    }

    switch (type1) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "symbol":
      case "undefined":
        return obj1 === obj2;
      case "function":
        return true;
      case "object":
        if (Object.keys(obj1).length !== Object.keys(obj2).length) {
          return false;
        }

        for (let key in obj1) {
          let res = ToolKit.deepEqual(obj1[key], obj2[key]);
          if (!res) {
            return false;
          }
        }
        break;
    }

    return true;
  }

  static continuousQueue = [];
  static continuousQueueExecuting = false;
  static callContinuousQueue(callback) {
    ToolKit.continuousQueue.push(callback);
    ToolKit.executeContinuousQueue();
  }

  static async executeContinuousQueue() {
    if (!ToolKit.continuousQueueExecuting) {
      ToolKit.continuousQueueExecuting = true;
      while (ToolKit.continuousQueue.length > 0) {
        let callback = ToolKit.continuousQueue.shift();
        await callback();
      }
      ToolKit.continuousQueueExecuting = false;
    }
  }

  static linkUrls = {};

  static requireJSAndCss(urls) {
    return new Promise((y, n) => {
      let allCount = 0;
      for (let i = 0; i < urls.length; i++) {
        let url = urls[i];
        if (url.indexOf(".js") > 0) {
          if (!ToolKit.linkUrls[url]) {
            var scriptLink = document.createElement("script");
            scriptLink.src = url;
            scriptLink.addEventListener("load", () => {
              allCount++;
              ToolKit.linkUrls[url] = true;
              if (allCount == urls.length) {
                allCount = 0;
                y();
              }
            });
            document.head.appendChild(scriptLink);
          } else {
            allCount++;
          }
        } else if (url.indexOf(".css") > 0) {
          if (!ToolKit.linkUrls[url]) {
            var cssLink = document.createElement("link");
            cssLink.href = url;
            cssLink.rel = "stylesheet";
            cssLink.addEventListener("load", () => {
              allCount++;
              ToolKit.linkUrls[url] = true;
              if (allCount == urls.length) {
                allCount = 0;
                y();
              }
            });
            document.head.appendChild(cssLink);
          } else {
            allCount++;
          }
        }
      }
      if (allCount == urls.length) {
        allCount = 0;
        y();
      }
    });
  }

  static delayRunHashTalbe = {};

  static delayRun(id, millisecond) {
    return new Promise((y, n) => {
      if (ToolKit.delayRunHashTalbe[id]) {
        clearTimeout(this.delayRunHashTalbe[id]);
        ToolKit.delayRunHashTalbe[id] = null;
      }
      ToolKit.delayRunHashTalbe[id] = setTimeout(() => {
        y();
      }, millisecond);
    });
  }
}
