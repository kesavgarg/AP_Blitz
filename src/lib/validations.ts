import { z } from "zod";

export const gradeEnum = z.enum(["GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"]);
export const teamKeyEnum = z.enum([
  "VIDEO_CREATOR",
  "SCRIPT_WRITER",
  "VIDEO_EDITOR",
  "SOCIAL_MEDIA",
  "GRAPHIC_DESIGN",
  "FIVE_FOR_FIVE",
]);
export const yesNo = z.enum(["YES", "NO"]);

export const applicationSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  gradeLevel: gradeEnum,
  highSchool: z.string().trim().min(1, "High school is required").max(160),
  cityCounty: z.string().trim().min(1, "City/County is required").max(160),
  email: z.string().trim().email("Enter a valid email").max(160),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(40),
  apClasses: z.string().trim().min(2, "List your AP classes").max(4000),
  lane: z.enum(["one-video", "video-taker", "five-for-five", "graphic-posts"]),
  videoLane: z.enum(["EDUCATIONAL", "PROMOTIONAL"]).optional().or(z.literal("")),
  experience: z.string().trim().max(4000).optional().or(z.literal("")),
  keepSiteOpen: yesNo,
  canBeRemoved: yesNo,
  weeklyDeadline: yesNo,
  deadlineScenario: z.string().trim().min(12, "Tell us what you would do in this situation").max(4000),
  additionalInfo: z.string().trim().max(4000).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Password is required"),
});

export const setupAccountSchema = z
  .object({
    token: z.string().min(10),
    password: z
      .string()
      .min(10, "Use at least 10 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
