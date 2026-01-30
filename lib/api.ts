import { callGas } from "./core";

export function sendEvent(data: any) {
  return callGas("event", data);
}

export function getUser(email: string) {
  return callGas("user/get", { email });
}

export function updateUser(data: any) {
  return callGas("user/update", data);
}

export function getUserActivity(email: string) {
  return callGas("user/activity", { email });
}

export function getDashboard(email: string) {
  return callGas("user/dashboard", { email });
}

