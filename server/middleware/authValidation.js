const Joi = require("joi");

const passwordComplexity = Joi.string()
  .min(4)
  .max(100)
  .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).+$"))
  .message(
    "Password must be at least 4 characters and include uppercase, lowercase, number, and special character."
  );

const signupValidation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 3 characters long",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Enter a valid email",
      "string.empty": "Email is required",
    }),
    password: passwordComplexity.required(),
    isAdmin: Joi.boolean().optional(),
    role: Joi.string()
      .valid("student", "admin", "hr", "college")
      .optional()
      .default("student"),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((e) => e.message),
    });
  }
  next();
};

const loginValidation = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Enter a valid email",
      "string.empty": "Email is required",
    }),
    password: Joi.string().min(4).max(100).required().messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 4 characters long",
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((e) => e.message),
    });
  }
  next();
};

module.exports = {
  signupValidation,
  loginValidation,
};
