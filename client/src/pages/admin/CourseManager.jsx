import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CourseEditModal from './CourseEditModal'; // Make sure the path is correct

const CourseManager = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    durationWeeks: '',
    level: '',
    domain: '',
    idealRoles: [],
    skillsCovered: [],
    challengesAddressed: [],
    learningStyleFit: [],
    timeCommitmentRecommended: '',
    weeks: [],
  });

  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);

  // Load courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'durationWeeks') {
      const numWeeks = parseInt(value) || 0;
      const newWeeks = Array.from({ length: numWeeks }, (_, index) => ({
        weekNumber: index + 1,
        modules: [],
      }));
      setForm({ ...form, durationWeeks: value, weeks: newWeeks });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const addModule = (weekIdx) => {
    const updatedWeeks = [...form.weeks];
    updatedWeeks[weekIdx].modules.push({
      title: '',
      content: '',
      lessons: [],
      resources: [],
      pdfs: [],
    });
    setForm({ ...form, weeks: updatedWeeks });
  };

  const handleModuleChange = (weekIdx, modIdx, field, value) => {
    const updatedWeeks = [...form.weeks];
    updatedWeeks[weekIdx].modules[modIdx][field] = value;
    setForm({ ...form, weeks: updatedWeeks });
  };

  const addLesson = (weekIdx, modIdx) => {
    const updatedWeeks = [...form.weeks];
    updatedWeeks[weekIdx].modules[modIdx].lessons.push({
      title: '',
      videoUrl: '',
      duration: '',
    });
    setForm({ ...form, weeks: updatedWeeks });
  };

  const handleLessonChange = (weekIdx, modIdx, lessonIdx, field, value) => {
    const updatedWeeks = [...form.weeks];
    updatedWeeks[weekIdx].modules[modIdx].lessons[lessonIdx][field] = value;
    setForm({ ...form, weeks: updatedWeeks });
  };

  const removeModule = (weekIdx, modIdx) => {
    const updatedWeeks = [...form.weeks];
    updatedWeeks[weekIdx].modules.splice(modIdx, 1);
    setForm({ ...form, weeks: updatedWeeks });
  };

  const removeLesson = (weekIdx, modIdx, lessonIdx) => {
    const updatedWeeks = [...form.weeks];
    updatedWeeks[weekIdx].modules[modIdx].lessons.splice(lessonIdx, 1);
    setForm({ ...form, weeks: updatedWeeks });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/courses', form);
      toast.success('Course added successfully!');
      setCourses((prev) => [...prev, res.data]);
      setForm({
        title: '',
        description: '',
        durationWeeks: '',
        level: '',
        domain: '',
        idealRoles: [],
        skillsCovered: [],
        challengesAddressed: [],
        learningStyleFit: [],
        timeCommitmentRecommended: '',
        weeks: [],
      });
    } catch (err) {
      console.error('🔥 Failed to add course:', err);
      toast.error('Failed to add course');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      await axios.delete(`/api/courses/${id}`);
      toast.success('Course deleted');
      setCourses((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete course');
    }
  };

  const handleCourseUpdated = async () => {
    await fetchCourses();
    setEditingCourse(null);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-10">
      <h3 className="text-xl font-semibold mb-4">Manage Courses</h3>

      {/* Create Course Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} className="border p-2 w-full" />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} className="border p-2 w-full" />
        <input name="durationWeeks" type="number" placeholder="Duration (weeks)" value={form.durationWeeks} onChange={handleChange} className="border p-2 w-full" />

        {form.weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="border p-4 rounded bg-gray-50 mb-4">
            <h4 className="font-semibold text-blue-700 mb-2">Week {week.weekNumber}</h4>

            {week.modules.map((mod, modIdx) => (
              <div key={modIdx} className="border p-3 bg-white rounded mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-medium">Module {modIdx + 1}</h5>
                  <button type="button" className="text-red-600 text-sm" onClick={() => removeModule(weekIdx, modIdx)}>
                    Remove Module
                  </button>
                </div>

                <input placeholder="Module Title" value={mod.title} onChange={(e) => handleModuleChange(weekIdx, modIdx, 'title', e.target.value)} className="border p-2 w-full mb-2" />
                <textarea placeholder="Module Content" value={mod.content} onChange={(e) => handleModuleChange(weekIdx, modIdx, 'content', e.target.value)} className="border p-2 w-full mb-2" />

                <div className="ml-2">
                  <h6 className="font-semibold text-sm mb-1">Lessons</h6>
                  {mod.lessons.map((lesson, lessonIdx) => (
                    <div key={lessonIdx} className="flex flex-col md:flex-row gap-2 items-start mb-2">
                      <input placeholder="Lesson Title" value={lesson.title} onChange={(e) => handleLessonChange(weekIdx, modIdx, lessonIdx, 'title', e.target.value)} className="border p-2 flex-1 w-full" />
                      <input placeholder="YouTube Video URL" value={lesson.videoUrl} onChange={(e) => handleLessonChange(weekIdx, modIdx, lessonIdx, 'videoUrl', e.target.value)} className="border p-2 flex-1 w-full" />
                      <input placeholder="Duration" value={lesson.duration} onChange={(e) => handleLessonChange(weekIdx, modIdx, lessonIdx, 'duration', e.target.value)} className="border p-2 w-32" />
                      <button type="button" className="text-red-600" onClick={() => removeLesson(weekIdx, modIdx, lessonIdx)}>
                        ✕
                      </button>
                    </div>
                  ))}
                  <button type="button" className="text-blue-600 text-sm" onClick={() => addLesson(weekIdx, modIdx)}>
                    + Add Lesson
                  </button>
                </div>
              </div>
            ))}

            <button type="button" className="text-green-600 text-sm" onClick={() => addModule(weekIdx)}>
              + Add Module
            </button>
          </div>
        ))}

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add Course
        </button>
      </form>

      {/* Course List */}
      <div className="mt-10">
        <h2 className="text-lg font-bold mb-4">Existing Courses</h2>
        {courses.length === 0 ? (
          <p className="text-gray-500">No courses yet.</p>
        ) : (
          <ul className="space-y-4">
            {courses.map((course) => (
              <li key={course._id} className="border p-4 rounded bg-white shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-blue-700 font-semibold text-lg">{course.title}</h3>
                    <p className="text-sm text-gray-600">{course.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Weeks: {course.weeks?.length || 0}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingCourse(course)} className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteCourse(course._id)} className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit Modal */}
      {editingCourse && (
        <CourseEditModal
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSave={handleCourseUpdated}
        />
      )}
    </div>
  );
};

export default CourseManager;
