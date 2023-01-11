import Plugin from "../core/Plugin";
import ToolKit from "../core/ToolKit";
import VClass from "../core/VClass";

export default class Router extends Plugin {
  #option = {
    routes: [
      //   {
      //     path: "/Index",
      //     name: "Index",
      //     component: Index,
      //     containerId: "app",
      //   },
    ],
  };

  /**
   * 当前路由
   */
  currentRouteList = [];

  containerId = null;
  app = null;

  constructor(option) {
    super("Router");

    this.#option = option;
    this.#bingEvent();
  }

  async init({ containerId, app }) {
    this.containerId = containerId;
    this.app = app;
    ToolKit.callContinuousQueue(async () => {
      await this.#lookHash();
    });
  }

  #bingEvent() {
    window.addEventListener("popstate", (event) => {
      ToolKit.callContinuousQueue(async () => {
        await this.#lookHash();
      });
    });
  }

  async #lookHash() {
    let hash = document.location.hash.substring(1);

    let urlArray = hash.split("/");
    let urlParent = "#";
    let routeUrlArray = [];
    routeUrlArray.push("#/");
    for (let i = 1; i < urlArray.length; i++) {
      let currentUrl = urlParent + "/" + urlArray[i];
      if (!routeUrlArray.includes(currentUrl)) {
        routeUrlArray.push(currentUrl);
        urlParent = currentUrl;
      }
    }

    let tempCurrentRouteList = [];

    for (let i = 0; i < this.currentRouteList.length; i++) {
      let oldRoute = this.currentRouteList[i];
      if (!routeUrlArray.includes("#" + oldRoute.path)) {
        await this.#disposeRoute(oldRoute);
      } else {
        tempCurrentRouteList.push(oldRoute);
      }
    }
    this.currentRouteList = [];

    for (let i = 0; i < routeUrlArray.length; i++) {
      let currentUrl = routeUrlArray[i];
      let routeCount = this.#option.routes.length;
      for (let j = 0; j < routeCount; j++) {
        let currentRoute = this.#option.routes[j];
        if ("#" + currentRoute.path == currentUrl) {
          if (
            tempCurrentRouteList.findIndex(
              (route) => route.path == currentRoute.path
            ) < 0
          ) {
            currentRoute.__instanceVClass = null;
            await this.#loadRoute(currentRoute);
          }

          this.currentRouteList.push(currentRoute);
        }
      }
    }
  }

  #loadRoute(route) {
    return new Promise((y, n) => {
      route.component().then(async (component) => {
        let viewClass = component.default ? component.default : component;
        route.__instanceVClass = new VClass(viewClass);

        let path = this.containerId;
        if (route.containerId) {
          path += " " + route.containerId;
        }
        let routeContainer = document.querySelector(path);
        if (routeContainer) {
          await route.__instanceVClass.init(routeContainer, "", this.app);
          y();
        } else {
          throw `[router路径未找到]${path}`;
        }
      });
    });
  }

  #disposeRoute(route) {
    return new Promise((y, n) => {
      if (route.__instanceVClass != null) {
        route.__instanceVClass.dispose().then(() => {
          y();
        });
      } else {
        y();
      }
    });
  }

  push({ state, url }) {
    ToolKit.callContinuousQueue(async () => {
      window.history.pushState(state, null, "/#" + url);
      await this.#lookHash();
    });
  }

  replace({ state, url }) {
    ToolKit.callContinuousQueue(async () => {
      window.history.replaceState(state, null, "/#" + url);
      await this.#lookHash();
    });
  }
}
