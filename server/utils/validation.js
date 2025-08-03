const Joi = require('joi');
const { phone } = require('phone');

exports.validateRegisterInput = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    phoneNumber: Joi.string().custom((value, helpers) => {
      const result = phone(value);
      if (!result.isValid) {
        return helpers.error('any.invalid');
      }
      return value;
    }).optional()
  });

  return schema.validate(data);
};

exports.validateLoginInput = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data);
};
