const validateStudent = (req, res, next) => {
  const { name, email, enrollmentNumber } = req.body;
  
  if (!name || !email || !enrollmentNumber) {
    return res.status(400).json({ 
      message: 'Required fields missing',
      required: ['name', 'email', 'enrollmentNumber']
    });
  }
  
  next();
};

module.exports = { validateStudent };
