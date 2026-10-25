
import api from "./axios";

export const registerUser = async (userData) => {
  const { data } = await api.post("/users/register", userData);
  return data;
};

export const loginUser = async (credentials) => {
  const { data } = await api.post("/users/login", credentials);
  return data;
};

export const searchUsers = async (searchData) => {
  const { data } = await api.post("/users/search", searchData);
  return data;
};
