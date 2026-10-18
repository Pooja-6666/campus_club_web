const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const {
  generateToken,
} = require("../utils/jwt");
const {
  isValidEmail,
  isValidPassword,
  isRequired,
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


module.exports = {
  loginStudent,
  loginOrganizer,
};