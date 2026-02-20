'use server';

import { authService } from "@/services/auth.service";

export async function logoutAction() {
  await authService.logout();
  return { success: true };
}
