export const login = async (formData) => {
  try {
    const response = await fetch(
      "http://140.118.162.94:30000/api/1.0/metadata_mgt/UserManager/login_user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      }
    );

    // 若後端回傳非 2xx，這裡可做更細緻的錯誤處理
    if (!response.ok) {
      if (response.status === 400) {
        return { status: "invalid_data" };
      }
      return { status: "failed" };
    }

    // 解析後端回傳
    // const result = await response.json();
    // e.g. setCookie("token", result.token); or store in localStorage

    return { status: "success" };
  } catch (error) {
    // 這裡可 console.error(error) 看更多錯誤細節
    return { status: "failed" };
  }
};
