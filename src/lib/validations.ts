import { z } from 'zod'

export const RegisterSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' })
      .max(20, { message: 'ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร' })
      .regex(/^[a-zA-Z0-9_]+$/, { message: 'ใช้ได้เฉพาะ a-z, 0-9 และ _' })
      .trim(),
    name: z
      .string()
      .min(2, { message: 'ชื่อจริงต้องมีอย่างน้อย 2 ตัวอักษร' })
      .trim(),
    phone: z
      .string()
      .regex(/^[0-9]{9,10}$/, { message: 'เบอร์โทรไม่ถูกต้อง' })
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  })

export const LoginSchema = z.object({
  username: z.string().min(1, { message: 'กรุณากรอกชื่อผู้ใช้หรือเบอร์โทรศัพท์' }).trim(),
  password: z.string().min(1, { message: 'กรุณากรอกรหัสผ่าน' }),
})

export const AddStampSchema = z.object({
  userId: z.string().min(1),
  cups: z
    .number()
    .int()
    .min(1, { message: 'จำนวนแก้วต้องมากกว่า 0' })
    .max(50, { message: 'จำนวนแก้วต้องไม่เกิน 50' }),
  note: z.string().max(200).optional(),
})

export const AddCustomerSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' })
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'ใช้ได้เฉพาะ a-z, 0-9 และ _' })
    .trim(),
  name: z.string().min(2, { message: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร' }).trim(),
  phone: z
    .string()
    .regex(/^[0-9]{9,10}$/, { message: 'เบอร์โทรไม่ถูกต้อง' })
    .optional()
    .or(z.literal('')),
  password: z.string().min(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type AddStampInput = z.infer<typeof AddStampSchema>
export type AddCustomerInput = z.infer<typeof AddCustomerSchema>
