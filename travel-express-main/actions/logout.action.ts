'use server';

import { authService } from "@/services/auth.service";
import { redirect } from "next/navigation";

export async function logoutAction() {
  await authService.logout();
  redirect('/');
}
