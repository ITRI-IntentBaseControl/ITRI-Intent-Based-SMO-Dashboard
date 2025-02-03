"use client";

import axios, { AxiosResponse } from "axios";
// API 配置
const PROTOCAL = process.env.PROTOCAL;
const HOST = process.env.HOST;
const API_PORT = process.env.API_PORT;
const API_ROOT = process.env.API_ROOT;
const API_VERSION = process.env.API_VERSION;
const API = `${PROTOCAL}://${HOST}:${API_PORT}/${API_ROOT}/${API_VERSION}`;
console.log(API);

// 枚舉：定義 API 回應狀態碼
enum ApiResponseStatus {
  SUCCESS = 200,
  CLIENT_ERROR = 400,
  METHOD_NOT_ALLOWED = 405,
  INTERNAL_SERVER_ERROR = 500,
}

// 通用 POST 方法
const postAPI = async (
  endpoint: string,
  data: object = {},
  config: {
    isUpload?: boolean;
    isDownload?: boolean;
    responseType?: "json" | "blob" | "arraybuffer";
  } = {}
): Promise<AxiosResponse | Error> => {
  const {
    isUpload = false,
    isDownload = false,
    responseType = "json",
  } = config;
  const url = `${API}/${endpoint}`;

  try {
    const response = await axios.post(url, data, {
      responseType: isDownload ? "blob" : responseType,
      headers: {
        "Content-Type": isUpload ? "multipart/form-data" : "application/json",
        // 其他標頭...
      },
    });

    // 如果是下載檔案，直接返回 response
    if (isDownload) {
      return response;
    }

    return handleApiResponse(response);
  } catch (error) {
    handleApiError(error);
    return error;
  }
};

const downloadPDF = async (
  endpoint: string,
  data: object
): Promise<AxiosResponse | Error> => {
  return await postAPI(endpoint, data, { isDownload: true });
};

// 具體的 API 請求
// const login = async (data: object): Promise<AxiosResponse | Error> => {
//   localStorage.setItem("isLoggedIn", "true");
//   localStorage.setItem("accountname", "test");
//   const endpoint = APIKEYS.LOGIN_ACCOUNT;
//   return await postAPI(endpoint, data);
// };

// const signup = async (data: object): Promise<AxiosResponse | Error> => {
//   const endpoint = "AccountValidator/signup";
//   return await postAPI(endpoint, data);
// };

// const testAPI = async (
//   endpoint: string,
//   data: object
// ): Promise<AxiosResponse | Error> => {
//   const TEST_API_BASE_URL = process.env.NEXT_PUBLIC_TEST_API;
//   const url = `${TEST_API_BASE_URL}/${endpoint}`;
//   try {
//     const response = await axios.post(url, data);
//     return handleApiResponse(response);
//   } catch (error) {
//     handleApiError(error);
//     return error;
//   }
// };

// 處理 API 回應
const handleApiResponse = (response: AxiosResponse): AxiosResponse | void => {
  switch (response.status) {
    case ApiResponseStatus.SUCCESS:
      return response;
    // case ApiResponseStatus.CLIENT_ERROR:
    //   console.error("Client Error:", response.data.detail);
    //   break;
    // case ApiResponseStatus.METHOD_NOT_ALLOWED:
    //   console.error("Method Not Allowed");
    //   break;
    // case ApiResponseStatus.INTERNAL_SERVER_ERROR:
    //   console.error("Internal Server Error:", response.data.detail);
    //   break;
    default:
      return response;
  }
};

// 處理 API 錯誤
const handleApiError = (error: any) => {
  if (error.response) {
    handleApiResponse(error.response);
  } else {
    console.error("Unknown Error:", error.message);
  }
};

export { PROTOCAL, HOST, API_PORT, postAPI, downloadPDF };
