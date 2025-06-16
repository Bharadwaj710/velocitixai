const express = require('express');
const router = express.Router();
const courseController = require('../controller/courseController');

router.post('/', courseController.createCourse);
router.get('/', courseController.getCourses);
router.delete('/:id', courseController.deleteCourse);
router.put('/:id', courseController.updateCourse);


module.exports = router;
