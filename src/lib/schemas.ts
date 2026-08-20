import { z } from "zod";

export const subscribeSchema = z.object({
  email: z
    .string()
    .min(1, "ایمیلت رو وارد کن")
    .email("قالب ایمیل درست نیست"),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
