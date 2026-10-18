
const authService = require("../services/auth.service");

const loginStudent = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginStudent(
      email,
      password
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const loginOrganizer = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginOrganizer(
      email,
      password
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginStudent,
  loginOrganizer,
};
