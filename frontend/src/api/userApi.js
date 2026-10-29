
import api from "./axios";

export const getCurrentUser = async () => {
  const response = await api.get("/users/me");
  return response.data.user;
};

export const updateUserName = async (name) => {
  const response = await api.put("/users/me/name", { name });
  return response.data;
};
