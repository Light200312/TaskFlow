
import api from "./axios";

export const getCurrentUser = async () => {
  const response = await api.get("/users/me");
  return response.data.user;
};

export const updateUserName = async (name) => {
  const response = await api.put("/users/me/name", { name });
  return response.data;
};

export const getCurrentUserAvatar = async () => {
  const response = await api.get("/users/me/avatar", {
    responseType: "blob",
  });
  return response.data;
};

export const uploadCurrentUserAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await api.put("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteCurrentUserAvatar = async () => {
  const response = await api.delete("/users/me/avatar");
  return response.data;
};
