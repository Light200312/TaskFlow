import api from "./axios";

export const getDashboardSummary = async () => {
  const { data } = await api.get("/dashboard/summary");
  return data;
};
