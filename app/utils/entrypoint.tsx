"use client";

import axios, { AxiosResponse } from "axios";
// API 配置
const PROTOCAL = process.env.PROTOCAL;
const HOST = process.env.HOST;
const API_PORT = process.env.API_PORT;
const API_ROOT = process.env.API_ROOT;
const API_VERSION = process.env.API_VERSION;
const API = `${PROTOCAL}://${HOST}:${API_PORT}/${API_ROOT}/${API_VERSION}`;
// console.log(API);

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
): Promise<AxiosResponse> => {
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
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      // 回傳後端的回應，讓呼叫端可直接讀取 response.data（即使是 4xx/5xx）
      return error.response;
    }
    console.error("Unknown Error:", error?.message || error);
    throw error;
  }
};

const downloadPDF = async (
  endpoint: string,
  data: object
): Promise<AxiosResponse> => {
  return await postAPI(endpoint, data, { isDownload: true });
};

// 處理 API 回應
const handleApiResponse = (response: AxiosResponse): AxiosResponse => {
  switch (response.status) {
    case ApiResponseStatus.SUCCESS:
      return response;
    default:
      return response;
  }
};

// 處理 API 錯誤
const handleApiError = (error: any) => {
  // 已在 postAPI catch 中處理與回傳 error.response
  if (!error?.response) {
    console.error("Unknown Error:", error?.message || error);
  }
};

export { PROTOCAL, HOST, API_PORT, postAPI, downloadPDF };
