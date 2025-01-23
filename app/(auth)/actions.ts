"use server";

import { z } from "zod";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
}

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    // 1. 驗證表單資料
    // const validatedData = authFormSchema.parse({
    //   email: formData.get("email"),
    //   password: formData.get("password"),
    // });

    // 2. 向後端發送登入請求
    const response = await fetch(
      "http://140.118.162.94:30000/api/1.0/metadata_mgt/userManager/login_user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.get("email"),
          password: formData.get("password"),
        }),
      }
    );
    // 3. 檢查回傳狀態
    if (!response.ok) {
      // 可根據後端 API 的實際回傳結果做更細緻的錯誤處理
      if (response.status === 400) {
        // 例如：後端驗證失敗，或缺少欄位
        return { status: "invalid_data" };
      }
      return { status: "failed" };
    }

    // 4. 若需要 Token / session，可在這裡取出並自行處理
    //    const result = await response.json();
    //    e.g. setCookie('token', result.token);

    return { status: "success" };
  } catch (error) {
    // 若表單格式驗證失敗
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }
};

export interface RegisterActionState {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
}

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    // 1. 驗證表單資料
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    // 2. 向後端發送註冊請求
    const response = await fetch("https://api.imgur.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: validatedData.email,
        password: validatedData.password,
      }),
    });

    // 3. 檢查回傳狀態 (若後端約定某種狀態碼表示帳號已存在，則根據它做對應處理)
    if (response.status === 409) {
      // 409 Conflict => 代表後端告知使用者已存在
      return { status: "user_exists" };
    }

    if (!response.ok) {
      if (response.status === 400) {
        return { status: "invalid_data" };
      }
      return { status: "failed" };
    }

    // 4. 註冊成功後，通常也會自動登入或返回 Token
    //    const result = await response.json();
    //    setCookie('token', result.token);

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }
};
