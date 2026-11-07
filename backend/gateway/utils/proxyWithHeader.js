import proxy from "express-http-proxy";

export const proxyWithHeader = (serviceUrl) =>
  proxy(serviceUrl, {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
     if (srcReq.user) {
       proxyReqOpts.headers = proxyReqOpts.headers || {};
       proxyReqOpts.headers["x-user-id"] =
         srcReq.user.userID || srcReq.user.userId;
     }
     return proxyReqOpts;
    },
  });