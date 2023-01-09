import ToolKit from "../core/ToolKit";
import VClass from "../core/VClass";

export default class Router {
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

  #renderVersion = 0;
  /**
   * 当前路由
   */
  currentRouteList = [];

  containerId = null;
  app = null;

  constructor(option) {
    this.#option = option;
    this.#bingEvent();
  }

  async init({ containerId, app }) {
    this.containerId = containerId;
    this.app = app;
    await this.#lookHash();
  }

  #bingEvent() {
    window.addEventListener("popstate", (event) => {
      this.#renderVersion++;
      this.#lookHash();
    });
  }

  async #lookHash() {
    for (let i = 0; i < this.currentRouteList.length; i++) {
      let oldRoute = this.currentRouteList[i];
      await this.#disposeRoute(oldRoute);
    }
    this.currentRouteList = [];

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

    for (let i = 0; i < routeUrlArray.length; i++) {
      let currentUrl = routeUrlArray[i];
      let routeCount = this.#option.routes.length;
      let sameLevelCount = 0;
      for (let j = 0; j < routeCount; j++) {
        let currentRoute = this.#option.routes[j];
        if ("#" + currentRoute.path == currentUrl) {
          sameLevelCount++;
          currentRoute.__instanceVClass = null;
          this.currentRouteList.push(currentRoute);
          this.#loadRoute(currentRoute, this.#renderVersion).then(() => {
            sameLevelCount--;
          });
        }
      }
      while (1) {
        if (sameLevelCount == 0) {
          break;
        }
        await this.#nextTick();
      }
    }
  }

  #nextTick() {
    return new Promise((y, n) => {
      requestAnimationFrame(() => {
        y();
      });
    });
  }

  #loadRoute(route, renderVersion) {
    return new Promise((y, n) => {
      route.component().then(async (component) => {
        if (renderVersion == this.#renderVersion) {
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
          }
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
}
