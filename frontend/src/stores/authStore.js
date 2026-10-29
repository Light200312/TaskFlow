
import { create } from "zustand";
import { loginUser, registerUser } from "../api/authApi.js";

const TOKEN_KEY = "taskflow_token";
const USERNAME_KEY = "taskflow_username";

export const useAuthStore = create((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  username: localStorage.getItem(USERNAME_KEY),
  isAuthenticated: Boolean(localStorage.getItem(TOKEN_KEY)),
  loading: false,
  avatarRevision: 0,

  setUsername: (username) => {
    localStorage.setItem(USERNAME_KEY, username);
    set({ username });
  },
  refreshAvatar: () =>
    set((state) => ({ avatarRevision: state.avatarRevision + 1 })),

  register: async (userData) => {
    set({ loading: true });

    try {
      const data = await registerUser(userData);

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USERNAME_KEY, data.username);

      set({
        token: data.token,
        username: data.username,
        isAuthenticated: true,
        loading: false,
      });

      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  login: async (credentials) => {
    set({ loading: true });

    try {
      const data = await loginUser(credentials);

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USERNAME_KEY, data.username);

      set({
        token: data.token,
        username: data.username,
        isAuthenticated: true,
        loading: false,
      });

      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);

    set({
      token: null,
      username: null,
      isAuthenticated: false,
      loading: false,
    });
  },
}));
