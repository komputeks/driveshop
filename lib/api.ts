import { callGas } from "./core";

export function sendEvent(data: any) {
  return callGas("event", data);
}

export function getUser(email: string) {
  return callGas("userGet", { email });
}

export function updateUser(data: any) {
  return callGas("user", data);
}

export function getUserActivity(email: string) {
  return callGas("user/activity", { email });
}