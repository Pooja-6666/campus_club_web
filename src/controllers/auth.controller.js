
const authService = require("../services/auth.service");

// Student login
const loginStudent = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginStudent(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Student signup
const registerStudent = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    const result = await authService.registerStudent(
      name,
      email,
      password,
      confirmPassword
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// Forgot password: send OTP
const forgotStudentPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotStudentPassword(email);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Verify OTP
const verifyStudentOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const result = await authService.verifyStudentOTP(email, otp);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Reset password
const resetStudentPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    const result = await authService.resetStudentPassword(
      email,
      otp,
      newPassword,
      confirmPassword
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Organizer login
const loginOrganizer = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginOrganizer(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Faculty login
const loginFaculty = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginFaculty(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Organizer forgot password: send OTP
const forgotOrganizerPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotOrganizerPassword(email);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Organizer verify OTP
const verifyOrganizerOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const result = await authService.verifyOrganizerOTP(email, otp);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Organizer reset password
const resetOrganizerPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    const result = await authService.resetOrganizerPassword(
      email,
      otp,
      newPassword,
      confirmPassword
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};


// Faculty forgot password: send OTP
const forgotFacultyPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotFacultyPassword(email);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Faculty verify OTP
const verifyFacultyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const result = await authService.verifyFacultyOTP(email, otp);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Faculty reset password
const resetFacultyPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    const result = await authService.resetFacultyPassword(
      email,
      otp,
      newPassword,
      confirmPassword
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
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
