const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const { generateToken } = require("../utils/jwt");

const {
  isValidEmail,
  isValidPassword,
} = require("../utils/validators");


const loginStudent = async (email, password) => {
  if (!isValidEmail(email) || !isValidPassword(password)) {
    throw new Error("Invalid email or password");
  }

  const student = await prisma.student.findUnique({
    where: { email },
  });

  if (!student) {
    throw new Error("Invalid email or password");
  }

  const passwordMatch = await bcrypt.compare(
    password,
    student.password
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    id: student.student_id,
    role: "STUDENT",
  });

  return {
    token,
    user: {
      id: student.student_id,
      name: student.name,
      email: student.email,
      role: "STUDENT",
    },
  };
};

const loginOrganizer = async (email, password) => {
  if (!isValidEmail(email) || !isValidPassword(password)) {
    throw new Error("Invalid email or password");
  }

  const organizer = await prisma.organizer.findUnique({
    where: { email },
  });

  if (!organizer) {
    throw new Error("Invalid email or password");
  }

  const passwordMatch = await bcrypt.compare(
    password,
    organizer.password
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    id: organizer.org_id,
    role: "ORGANIZER",
  });

  return {
    token,
    user: {
      id: organizer.org_id,
      name: organizer.name,
      email: organizer.email,
      role: "ORGANIZER",
    },
  };
};

const loginFaculty = async (email, password) => {
  if (!isValidEmail(email) || !isValidPassword(password)) {
    throw new Error("Invalid email or password");
  }

  const faculty = await prisma.faculty.findUnique({
    where: { email },
  });

  if (!faculty) {
    throw new Error("Invalid email or password");
  }

  const passwordMatch = await bcrypt.compare(
    password,
    faculty.password
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    id: faculty.faculty_id,
    role: "FACULTY",
  });

  return {
    token,
    user: {
      id: faculty.faculty_id,
      name: faculty.name,
      email: faculty.email,
      role: "FACULTY",
    },
  };
};

// Gmail transporter for password reset emails
const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Student signup
const registerStudent = async (name, email, password, confirmPassword) => {
  if (!name || !name.trim()) {
    throw new Error("Name is required");
  }

  if (!isValidEmail(email)) {
    throw new Error("Invalid email address");
  }

  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingStudent = await prisma.student.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingStudent) {
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const student = await prisma.student.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      interests: [],
    },
  });

  const token = generateToken({
    id: student.student_id,
    role: "STUDENT",
  });

  return {
    message: "Student account created successfully",
    token,
    user: {
      id: student.student_id,
      name: student.name,
      email: student.email,
      role: "STUDENT",
    },
  };
};

// Forgot password: generate OTP and send it by email
const forgotStudentPassword = async (email) => {
  if (!isValidEmail(email)) {
    throw new Error("Invalid email address");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const student = await prisma.student.findUnique({
    where: { email: normalizedEmail },
  });

  // Use a generic response to avoid revealing whether an email exists
  if (!student) {
    return {
      message: "If an account exists with this email, an OTP has been sent.",
    };
  }

  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();

  // Store only the hashed OTP
  const otpHash = await bcrypt.hash(otp, 10);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.passwordResetOTP.upsert({
    where: {
      student_id: student.student_id,
    },
    update: {
      otpHash,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    },
    create: {
      student_id: student.student_id,
      otpHash,
      expiresAt,
      attempts: 0,
    },
  });

  await emailTransporter.sendMail({
    from: process.env.GMAIL_USER,
    to: normalizedEmail,
    subject: "CampusEvents Password Reset OTP",
    text: `Your password reset OTP is ${otp}. It expires in 5 minutes. If you did not request this, ignore this email.`,
  });

  return {
    message: "If an account exists with this email, an OTP has been sent.",
  };
};

// Validate password reset OTP
const validateStudentOTP = async (email, otp) => {
  if (!isValidEmail(email) || !/^\d{6}$/.test(String(otp))) {
    throw new Error("Invalid OTP");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const student = await prisma.student.findUnique({
    where: { email: normalizedEmail },
  });

  if (!student) {
    throw new Error("Invalid OTP");
  }

  const otpRecord = await prisma.passwordResetOTP.findUnique({
    where: { student_id: student.student_id },
  });

  if (!otpRecord) {
    throw new Error("OTP not found or expired");
  }

  if (otpRecord.expiresAt < new Date()) {
    await prisma.passwordResetOTP.delete({
      where: { student_id: student.student_id },
    });

    throw new Error("OTP has expired");
  }

  if (otpRecord.attempts >= 5) {
    await prisma.passwordResetOTP.delete({
      where: { student_id: student.student_id },
    });

    throw new Error("Too many incorrect OTP attempts");
  }

  const otpMatch = await bcrypt.compare(
    String(otp),
    otpRecord.otpHash
  );

  if (!otpMatch) {
    await prisma.passwordResetOTP.update({
      where: { student_id: student.student_id },
      data: { attempts: { increment: 1 } },
    });

    throw new Error("Incorrect OTP");
  }

  return student;
};

// Verify student password reset OTP
const verifyStudentOTP = async (email, otp) => {
  await validateStudentOTP(email, otp);

  return {
    verified: true,
    message: "OTP verified successfully",
  };
};

// Reset student password after OTP verification
const resetStudentPassword = async (
  email,
  otp,
  newPassword,
  confirmPassword
) => {
  if (
    typeof newPassword !== "string" ||
    newPassword.length < 8
  ) {
    throw new Error("Password must be at least 8 characters long");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  // Validate OTP again before allowing password reset
  const student = await validateStudentOTP(email, otp);

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.student.update({
    where: { student_id: student.student_id },
    data: { password: hashedPassword },
  });

  // OTP should not be reusable
  await prisma.passwordResetOTP.delete({
    where: { student_id: student.student_id },
  });

  return {
    message: "Password reset successfully",
  };
};

// Generic forgot-password OTP logic for Organizer and Faculty
const forgotRolePassword = async (
  email,
  role,
  accountModel,
  otpModel,
  idField
) => {
  if (!isValidEmail(email)) {
    throw new Error("Invalid email address");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const account = await prisma[accountModel].findUnique({
    where: { email: normalizedEmail },
  });

  const genericMessage =
    "If an account exists with this email, an OTP has been sent.";

  if (!account) {
    return { message: genericMessage };
  }

  const accountId = account[idField];

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma[otpModel].upsert({
    where: { [idField]: accountId },
    update: {
      otpHash,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    },
    create: {
      [idField]: accountId,
      otpHash,
      expiresAt,
      attempts: 0,
    },
  });

  await emailTransporter.sendMail({
    from: process.env.GMAIL_USER,
    to: normalizedEmail,
    subject: `CampusEvents ${role} Password Reset OTP`,
    text: `Your password reset OTP is ${otp}. It expires in 5 minutes. If you did not request this, ignore this email.`,
  });

  return { message: genericMessage };
};


// Organizer forgot password
const forgotOrganizerPassword = async (email) => {
  return forgotRolePassword(
    email,
    "Organizer",
    "organizer",
    "organizerPasswordResetOTP",
    "org_id"
  );
};


// Faculty forgot password
const forgotFacultyPassword = async (email) => {
  return forgotRolePassword(
    email,
    "Faculty",
    "faculty",
    "facultyPasswordResetOTP",
    "faculty_id"
  );
};


// Validate OTP for Organizer or Faculty
const validateRoleOTP = async (
  email,
  otp,
  accountModel,
  otpModel,
  idField
) => {
  if (!isValidEmail(email) || !/^\d{6}$/.test(String(otp))) {
    throw new Error("Invalid OTP");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const account = await prisma[accountModel].findUnique({
    where: { email: normalizedEmail },
  });

  if (!account) {
    throw new Error("Invalid OTP");
  }

  const accountId = account[idField];

  const otpRecord = await prisma[otpModel].findUnique({
    where: { [idField]: accountId },
  });

  if (!otpRecord) {
    throw new Error("OTP not found or expired");
  }

  if (otpRecord.expiresAt < new Date()) {
    await prisma[otpModel].delete({
      where: { [idField]: accountId },
    });

    throw new Error("OTP has expired");
  }

  if (otpRecord.attempts >= 5) {
    await prisma[otpModel].delete({
      where: { [idField]: accountId },
    });

    throw new Error("Too many incorrect OTP attempts");
  }

  const otpMatch = await bcrypt.compare(
    String(otp),
    otpRecord.otpHash
  );

  if (!otpMatch) {
    await prisma[otpModel].update({
      where: { [idField]: accountId },
      data: { attempts: { increment: 1 } },
    });

    throw new Error("Incorrect OTP");
  }

  return account;
};


// Verify Organizer OTP
const verifyOrganizerOTP = async (email, otp) => {
  await validateRoleOTP(
    email,
    otp,
    "organizer",
    "organizerPasswordResetOTP",
    "org_id"
  );

  return {
    verified: true,
    message: "OTP verified successfully",
  };
};


// Verify Faculty OTP
const verifyFacultyOTP = async (email, otp) => {
  await validateRoleOTP(
    email,
    otp,
    "faculty",
    "facultyPasswordResetOTP",
    "faculty_id"
  );

  return {
    verified: true,
    message: "OTP verified successfully",
  };
};


// Reset Organizer password
const resetOrganizerPassword = async (
  email,
  otp,
  newPassword,
  confirmPassword
) => {
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const organizer = await validateRoleOTP(
    email,
    otp,
    "organizer",
    "organizerPasswordResetOTP",
    "org_id"
  );

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.organizer.update({
    where: { org_id: organizer.org_id },
    data: { password: hashedPassword },
  });

  await prisma.organizerPasswordResetOTP.delete({
    where: { org_id: organizer.org_id },
  });

  return { message: "Password reset successfully" };
};


// Reset Faculty password
const resetFacultyPassword = async (
  email,
  otp,
  newPassword,
  confirmPassword
) => {
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const faculty = await validateRoleOTP(
    email,
    otp,
    "faculty",
    "facultyPasswordResetOTP",
    "faculty_id"
  );

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.faculty.update({
    where: { faculty_id: faculty.faculty_id },
    data: { password: hashedPassword },
  });

  await prisma.facultyPasswordResetOTP.delete({
    where: { faculty_id: faculty.faculty_id },
  });

  return { message: "Password reset successfully" };
};

module.exports = {
  loginStudent,
  loginOrganizer,
  loginFaculty,
  registerStudent,

  // Student password reset
  forgotStudentPassword,
  verifyStudentOTP,
  resetStudentPassword,

  // Organizer password reset
  forgotOrganizerPassword,
  verifyOrganizerOTP,
  resetOrganizerPassword,

  // Faculty password reset
  forgotFacultyPassword,
  verifyFacultyOTP,
  resetFacultyPassword,
};