import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CourseEditModal from './CourseEditModal'; // Make sure the path is correct

const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Proficient"];
const DOMAIN_OPTIONS = [
  "Technology and Innovation",
  "Healthcare and Wellness",
  "Business and Finance",
  "Arts and Creativity",
  "Education and Social Services"
];

const SUGGEST_API_URL = "http://localhost:5001/suggest-course-metadata";

const CourseManager = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    durationWeeks: '',

    level: 'Beginner',
    domain: '',
    idealRoles: [],
    skillsCovered: [],
    challengesAddressed: [],
    timeCommitmentRecommended: '',
    weeks: [],
  });
  const [inputFields, setInputFields] = useState({
    idealRole: '',
    skill: '',
    challenge: '',
  });

  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState({
    domain: "",
    idealRoles: [],
    skillsCovered: [],
    challengesAddressed: [],
  });
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [fetchingPlaylist, setFetchingPlaylist] = useState(false);

  const fileInputRefs = useRef([]);
 
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  // Load courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);
  // --- Multi-value handlers ---
  const addToArrayField = (field, value) => {
    const values = value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (!values.length) return;
    setForm((prev) => ({
      ...prev,
      [field]: Array.from(new Set([...(prev[field] || []), ...values]))
    }));
    setInputFields((prev) => ({ ...prev, [field.slice(0, -1)]: "" }));
  };

  const removeFromArrayField = (field, idx) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx)
    }));
  };

  // --- Main create handler ---
  const handleCreate = async () => {
    // Before validation, auto-add any pending input values for AI fields
    const pendingFields = [
      { field: 'idealRoles', key: 'idealRole' },
      { field: 'skillsCovered', key: 'skill' },
      { field: 'challengesAddressed', key: 'challenge' }
    ];
    let updatedForm = { ...form };
    let updatedInputFields = { ...inputFields };
    let changed = false;
    for (const { field, key } of pendingFields) {
      const values = (inputFields[key] || "")
        .split(",")
        .map(v => v.trim())
        .filter(Boolean);
      if (values.length) {
        updatedForm[field] = Array.from(new Set([...(form[field] || []), ...values]));
        updatedInputFields[key] = "";
        changed = true;
      }
    }
    if (changed) {
      setForm(updatedForm);
      setInputFields(updatedInputFields);
      // Wait for state to update, then re-run handleCreate
      setTimeout(handleCreate, 0);
      return;
    }

    // --- AI-required fields validation ---
    // All three fields below must be non-empty arrays for backend to accept:
    //   - idealRoles
    //   - skillsCovered
    //   - challengesAddressed
    // If any are empty, show a clear error and prevent submission.
    const aiFields = ["idealRoles", "skillsCovered", "challengesAddressed"];
    for (const field of aiFields) {
      if (!Array.isArray(form[field]) || form[field].length === 0) {
        toast.error("All AI fields (Roles, Skills, Challenges) are required and must have at least one value.");
        return;
      }
    }
    if (!form.title || !form.description || !form.durationWeeks || !form.domain) {
      toast.error("Title, Description, Duration, and Domain are required.");
      return;
    }
    for (let i = 0; i < form.modules.length; i++) {
      const mod = form.modules[i];
      if (!mod.title) {
        toast.error(`Module ${i + 1}: Title is required.`);
        return;
      }
      if (!mod.moduleUrl) {
        toast.error(`Module ${i + 1}: Module Video URL is required.`);
        return;
      }
      // Lessons are optional, but if present, must have title and timestamp (no videoUrl)
      if (mod.lessons && mod.lessons.length > 0) {
        for (let j = 0; j < mod.lessons.length; j++) {
          const lesson = mod.lessons[j];
          if (!lesson.title) {
            toast.error(`Module ${i + 1}, Lesson ${j + 1}: Title is required.`);
            return;
          }
        }
      }
    }
    try {
      const newModules = [...form.modules];
      for (let i = 0; i < newModules.length; i++) {
        const module = newModules[i];
        if (module.pdfs?.length > 0) {
          for (const file of module.pdfs) {
            const pdfForm = new FormData();
            pdfForm.append('pdf', file);
            const res = await axios.post('http://localhost:8080/api/upload/pdf', pdfForm, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            module.resources.push({ url: res.data.url, name: res.data.name });
          }
        }
        delete module.pdfs;
      }
      const payload = {
        ...form,
        durationWeeks: parseInt(form.durationWeeks, 10),
        modules: newModules,
        level: form.level || "Beginner"
      };
      await createCourse(payload);
      toast.success('Course created!');
      loadCourses();
      setForm({
        title: '',
        description: '',
        durationWeeks: '',
        level: 'Beginner',
        domain: '',
        idealRoles: [],
        skillsCovered: [],
        challengesAddressed: [],
        modules: [{ title: 'Week 1', content: '', resources: [], pdfs: [], lessons: [] }]
      });

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

  // --- AI Suggestion logic unchanged ---
  const handleSuggestMetadata = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Enter course title and description first.");
      return;
    }
    setSuggesting(true);
    try {
      const res = await axios.post(SUGGEST_API_URL, {
        title: form.title,
        description: form.description
      });
      const { domain, idealRoles, skillsCovered, challengesAddressed } = res.data || {};
      setSuggested({
        domain: domain || "",
        idealRoles: Array.isArray(idealRoles) ? idealRoles : [],
        skillsCovered: Array.isArray(skillsCovered) ? skillsCovered : [],
        challengesAddressed: Array.isArray(challengesAddressed) ? challengesAddressed : [],
      });
      toast.success("Suggestions loaded! Click 'Add' beside each field to autofill.");
    } catch (err) {
      toast.error("Failed to fetch suggestions");
    } finally {
      setSuggesting(false);
    }
  };

  // Autofill handlers for each field (update text field with comma-separated string)
  const autofillField = (field) => {
    if (field === "domain") {
      if (suggested.domain) {
        setForm(f => ({ ...f, domain: suggested.domain }));
      }
    } else if (field === "idealRoles") {
      if (suggested.idealRoles?.length) {
        setInputFields(f => ({
          ...f,
          idealRole: suggested.idealRoles.join(", ")
        }));
      }
    } else if (field === "skillsCovered") {
      if (suggested.skillsCovered?.length) {
        setInputFields(f => ({
          ...f,
          skill: suggested.skillsCovered.join(", ")
        }));
      }
    } else if (field === "challengesAddressed") {
      if (suggested.challengesAddressed?.length) {
        setInputFields(f => ({
          ...f,
          challenge: suggested.challengesAddressed.join(", ")
        }));
      }
    }
  };

  // Add all comma-separated values from input field as chips/tags
  const addAllFromInput = (field) => {
    const key = field.slice(0, -1); // e.g. idealRoles -> idealRole
    const values = (inputFields[key] || "")
      .split(",")
      .map(v => v.trim())
      .filter(Boolean);
    if (!values.length) return;
    setForm(prev => ({
      ...prev,
      [field]: Array.from(new Set([...prev[field], ...values]))
    }));
    setInputFields(prev => ({ ...prev, [key]: "" }));
  };

  // Place this function above the return statement (before the component's return)
  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this course?");
    if (!confirm) return;
    try {
      await deleteCourse(id);
      await loadCourses();
      toast.success("Course deleted!");
    } catch (err) {
      toast.error("Failed to delete course");
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Manage Courses</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <input placeholder="Title" className="border p-2" value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Description" className="border p-2" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Duration (weeks)" className="border p-2" value={form.durationWeeks}
          onChange={e => setForm({ ...form, durationWeeks: e.target.value })} />
        <select
          className="border p-2"
          value={form.level}
          onChange={e => setForm({ ...form, level: e.target.value })}
        >
          {LEVEL_OPTIONS.map(lvl => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <input
          placeholder="YouTube Playlist URL (optional)"
          className="border p-2"
          value={playlistUrl}
          onChange={e => setPlaylistUrl(e.target.value)}
          disabled={fetchingPlaylist}
        />
        <button
          type="button"
          className="bg-blue-500 text-white px-2 rounded"
          onClick={handleFetchPlaylist}
          disabled={fetchingPlaylist || !playlistUrl.trim() || !form.durationWeeks.toString().trim()}
        >
          {fetchingPlaylist ? "Fetching..." : "Fetch Playlist"}
        </button>
      </div>
      {/* AI-required fields with autofill buttons and chips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Domain *</label>
          <div className="flex gap-2">
            <input
              className="border p-2 w-full"
              value={form.domain}
              onChange={e => setForm({ ...form, domain: e.target.value })}
              placeholder="e.g. Technology and Innovation"
            />
            <button
              type="button"
              className="bg-blue-500 text-white px-2 rounded"
              onClick={() => autofillField("domain")}
              disabled={!suggested.domain}
              title={suggested.domain ? `Use: ${suggested.domain}` : "No suggestion"}
            >
              Add
            </button>
          </div>
          {suggested.domain && (
            <div className="text-xs text-gray-500 mt-1">Suggestion: <span className="font-semibold">{suggested.domain}</span></div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ideal Roles *</label>
          <div className="flex gap-2">
            <input
              className="border p-2 flex-1"
              placeholder="Add role(s), comma separated"
              value={inputFields.idealRole}
              onChange={e => setInputFields(f => ({ ...f, idealRole: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAllFromInput('idealRoles');
                }
              }}
            />
            <button
              type="button"
              className="bg-blue-500 text-white px-2 rounded"
              onClick={() => autofillField("idealRoles")}
              disabled={!suggested.idealRoles.length}
              title={suggested.idealRoles.length ? `Use: ${suggested.idealRoles.join(", ")}` : "No suggestion"}
            >
              Add
            </button>
            <button
              type="button"
              className="bg-green-500 text-white px-2 rounded"
              onClick={() => addAllFromInput('idealRoles')}
              disabled={!inputFields.idealRole.trim()}
              title="Add entered roles"
            >
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {form.idealRoles.map((role, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs flex items-center">
                {role}
                <button type="button" className="ml-1 text-red-500" onClick={() => removeFromArrayField('idealRoles', idx)}>×</button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Skills Covered *</label>
          <div className="flex gap-2">
            <input
              className="border p-2 flex-1"
              placeholder="Add skill(s), comma separated"
              value={inputFields.skill}
              onChange={e => setInputFields(f => ({ ...f, skill: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAllFromInput('skillsCovered');
                }
              }}
            />
            <button
              type="button"
              className="bg-blue-500 text-white px-2 rounded"
              onClick={() => autofillField("skillsCovered")}
              disabled={!suggested.skillsCovered.length}
              title={suggested.skillsCovered.length ? `Use: ${suggested.skillsCovered.join(", ")}` : "No suggestion"}
            >
              Add
            </button>
            <button
              type="button"
              className="bg-green-500 text-white px-2 rounded"
              onClick={() => addAllFromInput('skillsCovered')}
              disabled={!inputFields.skill.trim()}
              title="Add entered skills"
            >
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {form.skillsCovered.map((skill, idx) => (
              <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs flex items-center">
                {skill}
                <button type="button" className="ml-1 text-red-500" onClick={() => removeFromArrayField('skillsCovered', idx)}>×</button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Challenges Addressed *</label>
          <div className="flex gap-2">
            <input
              className="border p-2 flex-1"
              placeholder="Add challenge(s), comma separated"
              value={inputFields.challenge}
              onChange={e => setInputFields(f => ({ ...f, challenge: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAllFromInput('challengesAddressed');
                }
              }}
            />
            <button
              type="button"
              className="bg-blue-500 text-white px-2 rounded"
              onClick={() => autofillField("challengesAddressed")}
              disabled={!suggested.challengesAddressed.length}
              title={suggested.challengesAddressed.length ? `Use: ${suggested.challengesAddressed.join(", ")}` : "No suggestion"}
            >
              Add
            </button>
            <button
              type="button"
              className="bg-green-500 text-white px-2 rounded"
              onClick={() => addAllFromInput('challengesAddressed')}
              disabled={!inputFields.challenge.trim()}
              title="Add entered challenges"
            >
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {form.challengesAddressed.map((ch, idx) => (
              <span key={idx} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs flex items-center">
                {ch}
                <button type="button" className="ml-1 text-red-500" onClick={() => removeFromArrayField('challengesAddressed', idx)}>×</button>
              </span>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded mb-4"
        onClick={handleSuggestMetadata}
        disabled={suggesting}
      >
        {suggesting ? "Suggesting..." : "Suggest Metadata"}
      </button>

      {/* Modules and Lessons */}
      {form.modules.map((mod, idx) => (
        <div key={idx} className="mb-4 p-3 border rounded bg-gray-50">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold mb-2">Module {idx + 1}</h4>
            <div className="flex gap-2">
              {idx > 0 && (
                <button className="text-xs text-gray-500" onClick={() => moveModule(idx, idx - 1)}>↑</button>
              )}
              {idx < form.modules.length - 1 && (
                <button className="text-xs text-gray-500" onClick={() => moveModule(idx, idx + 1)}>↓</button>
              )}
              {form.modules.length > 1 && (
                <button onClick={() => removeModule(idx)} className="text-red-600 text-sm">Remove</button>
              )}
            </div>
          </div>
          <input placeholder="Module Title" className="border p-2 mb-2 w-full"
            value={mod.title}
            onChange={e => handleModuleChange(idx, 'title', e.target.value)} />
          <textarea placeholder="Module Content" className="border p-2 mb-2 w-full"
            value={mod.content}
            onChange={e => handleModuleChange(idx, 'content', e.target.value)} />
          <input
            placeholder="Module Video URL"
            className="border p-2 mb-2 w-full"
            value={mod.moduleUrl || ""}
            onChange={e => handleModuleChange(idx, 'moduleUrl', e.target.value)}
          />
          {/* Lessons */}
          <div className="mt-2">
            <h5 className="font-semibold mb-1">Lessons:</h5>
            {mod.lessons && mod.lessons.length > 0 ? (
              <ul className="space-y-1">
                {mod.lessons.map((lesson, lIdx) => (
                  <li key={lIdx} className="flex items-center gap-2">
                    <input
                      className="border p-1 text-xs w-1/2"
                      value={lesson.title}
                      placeholder="Lesson Title"
                      onChange={e => handleLessonChange(idx, lIdx, 'title', e.target.value)}
                    />
                    <input
                      className="border p-1 text-xs w-1/4"
                      value={lesson.timestamp}
                      placeholder="Timestamp (optional)"
                      onChange={e => handleLessonChange(idx, lIdx, 'timestamp', e.target.value)}
                    />
                    <button
                      className="text-xs text-gray-500"
                      onClick={() => moveLesson(idx, lIdx, lIdx - 1)}
                      disabled={lIdx === 0}
                    >↑</button>
                    <button
                      className="text-xs text-gray-500"
                      onClick={() => moveLesson(idx, lIdx, lIdx + 1)}
                      disabled={lIdx === mod.lessons.length - 1}
                    >↓</button>
                    <button
                      className="text-red-500 text-xs"
                      onClick={() => removeLesson(idx, lIdx)}
                    >×</button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-gray-500">No lessons.</div>
            )}
            <button className="text-blue-600 text-xs mt-1" onClick={() => addLesson(idx)}>
              + Add Lesson
            </button>
          </div>
        </div>
      ))}
      <button onClick={addModule} className="text-sm text-green-600 mb-4">+ Add Module</button>
      <br />
      <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">Add Course</button>

      {/* Existing course display */}
      <ul className="mt-6 space-y-4">
        {courses.map(c => (
          <li key={c._id} className="border p-4 rounded bg-gray-50">
            <div className="flex justify-between">
              <div>
                <h3 className="font-bold text-lg">{c.title}</h3>
                <p className="text-sm text-gray-600">{c.description}</p>
                <p className="text-xs text-gray-500">Duration: {c.durationWeeks} weeks</p>
                {/* Show course level for all courses */}
                <p className="text-xs text-blue-700 font-semibold mt-1">
                  Level: {c.level || "Beginner"}
                </p>
              </div>
              <div className="space-x-4">
                <button onClick={() => handleDelete(c._id)} className="text-red-600 font-semibold">Delete</button>
                <button onClick={() => setEditCourse(c)} className="text-blue-600 font-semibold">Edit</button>
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