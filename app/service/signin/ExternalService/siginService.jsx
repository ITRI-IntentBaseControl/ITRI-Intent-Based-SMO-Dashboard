"use client";
import { postAPI } from "@/app/utils/entrypoint";

export const login = async (formData) => {
  try {
    const response = await postAPI("metadata_mgt/UserManager/login_user", {
      username: formData.get("username"),
      password: formData.get("password"),
    });

    // 若後端回傳非 2xx，這裡可做更細緻的錯誤處理
    if (response.status !== 200) {
      if (response.status === 400) {
        return { status: "invalid_data" };
      }
      return { status: "failed" };
    }

    // 在登入成功後，將想要的資料存到 localStorage
    localStorage.setItem("user_uid", response.data.data.user_uid);

    // 依需求可再存其他資訊
    // localStorage.setItem("username", result.username);

    return { status: "success" };
  } catch (error) {
    // 這裡可 console.error(error) 看更多錯誤細節
    return { status: "failed" };
  }
};
