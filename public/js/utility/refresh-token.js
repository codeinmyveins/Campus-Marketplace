// Create an Axios instance
const apiAuth = axios.create({
    baseURL: "/", // or your API base URL
    withCredentials: true, // if you're using cookies for refresh_token
});
  
// Token store (adjust to your state/store pattern)
let isRefreshing = false;
let failedQueue = [];
  
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};
  
// Add a response interceptor
apiAuth.interceptors.response.use(
    res => res,
    async error => {
        const originalRequest = error.config;
        const shouldRedirect = !originalRequest.skipRedirectOn401;
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            error.response?.data?.code !== 69 &&
            shouldRedirect
        ) {
            window.location.href = "./login.html";
        }
        else if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            error.response?.data?.code === 69
        ) {
            originalRequest._retry = true;
    
            if (isRefreshing) {
                // Queue the failed request
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: token => {
                            resolve(apiAuth(originalRequest));
                        },
                        reject,
                    });
                });
            }
    
            isRefreshing = true;
    
            try {
                const res = await apiAuth.post("/api/auth/refresh",
                    { device_fingerprint: await generateDeviceFingerprint() }
                );
                const newAccessToken = res.data.access_token;
                console.log("Refreshed :)");
        
                processQueue(null, newAccessToken);
        
                // Retry original request with new token
                return apiAuth(originalRequest);
            } catch (err) {
                processQueue(err, null);
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
  );
