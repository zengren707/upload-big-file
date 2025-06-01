import axios from "axios";
const axiosInstance = axios.create({
  baseURL: "http://localhost:8080",
});
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data) {
      return response.data;
    } else {
      throw new Error("server has error");
    }
  },
  (error) => {
    console.error("error");
    throw error;
  }
);
export default axiosInstance;
