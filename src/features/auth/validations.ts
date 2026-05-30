import { z } from "zod";

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, "Họ tên là bắt buộc")
      .min(2, "Họ tên phải có ít nhất 2 ký tự")
      .max(100, "Họ tên không được quá 100 ký tự"),

    email: z
      .string()
      .min(1, "Email là bắt buộc")
      .email("Email không hợp lệ")
      .toLowerCase(),

    phone: z
      .string()
      .min(1, "Số điện thoại là bắt buộc")
      .regex(
        /^(0|\+84)\d{9,10}$/,
        "Số điện thoại không hợp lệ"
      ),

    password: z
      .string()
      .min(1, "Mật khẩu là bắt buộc")
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất một chữ hoa")
      .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất một chữ thường")
      .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất một chữ số")
      .regex(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất một ký tự đặc biệt"),

    confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc"),

    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Bạn phải đồng ý với điều khoản và chính sách",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ").toLowerCase(),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
