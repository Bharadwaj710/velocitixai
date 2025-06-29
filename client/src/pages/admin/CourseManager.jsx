import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { fetchCourses, createCourse, deleteCourse, updateCourse } from '../../services/api';
import CourseEditModal from './CourseEditModal';
import { toast } from 'react-toastify';

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
  const [courses, setCourses] = useState([]);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState({
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

  // Load courses
  const loadCourses = async () => {
    const res = await fetchCourses();
    setCourses(res.data);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Auto-generate modules when durationWeeks changes
  useEffect(() => {
    const weeks = parseInt(form.durationWeeks, 10);
    if (!weeks || weeks < 1) return;
    setForm(f => ({
      ...f,
      modules: Array.from({ length: weeks }, (_, i) => ({
        title: `Week ${i + 1}`,
        content: '',
        resources: [],
        pdfs: [],
        lessons: []
      }))
    }));
  }, [form.durationWeeks]);

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
      // Transform modules to weeks structure
      const weeks = (form.modules || []).map((mod, idx) => ({
        weekNumber: idx + 1,
        modules: [
          {
            title: mod.title,
            content: mod.content,
            lessons: (mod.lessons || []).map(lesson => ({
              title: lesson.title,
              videoUrl: lesson.videoUrl,
              duration: lesson.duration || "",
            })),
            resources: mod.resources || [],
          }
        ]
      }));

      const payload = {
        ...form,
        durationWeeks: parseInt(form.durationWeeks, 10),
        weeks,
        // Remove modules from payload to avoid confusion in backend
      };
      delete payload.modules;

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
    } catch (err) {
      toast.error("Failed to create course");
      console.error(err);
    }
  };

  // --- Module and Lesson Handlers ---
  const handleModuleChange = (index, key, value) => {
    const updated = [...form.modules];
    updated[index][key] = value;
    setForm({ ...form, modules: updated });
  };

  const addModule = () => {
    setForm({
      ...form,
      modules: [...form.modules, { title: `Week ${form.modules.length + 1}`, content: '', resources: [], pdfs: [], lessons: [] }]
    });
  };

  const removeModule = (idx) => {
    const updated = form.modules.filter((_, i) => i !== idx);
    setForm({ ...form, modules: updated });
  };

  const moveModule = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= form.modules.length) return;
    const updated = [...form.modules];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setForm({ ...form, modules: updated });
  };

  // --- Lesson Handlers ---
  // Update lesson structure to only have title and videoUrl
  const addLesson = (modIdx) => {
    setForm(f => {
      const modules = [...f.modules];
      modules[modIdx].lessons = modules[modIdx].lessons || [];
      modules[modIdx].lessons.push({
        title: '',
        videoUrl: ''
      });
      return { ...f, modules };
    });
  };

  const removeLesson = (modIdx, lessonIdx) => {
    setForm(f => {
      const modules = [...f.modules];
      modules[modIdx].lessons.splice(lessonIdx, 1);
      return { ...f, modules };
    });
  };

  const moveLesson = (modIdx, fromIdx, toIdx) => {
    const lessons = [...form.modules[modIdx].lessons];
    if (toIdx < 0 || toIdx >= lessons.length) return;
    const [moved] = lessons.splice(fromIdx, 1);
    lessons.splice(toIdx, 0, moved);
    const modules = [...form.modules];
    modules[modIdx].lessons = lessons;
    setForm({ ...form, modules });
  };

  const handleLessonChange = (modIdx, lessonIdx, key, value) => {
    setForm(f => {
      const modules = [...f.modules];
      modules[modIdx].lessons[lessonIdx][key] = value;
      return { ...f, modules };
    });
  };

  // --- Playlist fetch (optional, just helps pre-fill modules) ---
  const handleFetchPlaylist = async () => {
    if (!playlistUrl || !form.durationWeeks) {
      toast.error("Enter playlist URL and duration (weeks)");
      return;
    }
    setFetchingPlaylist(true);
    try {
      const res = await axios.post('http://localhost:5001/playlist-info', { playlistUrl });
      const videos = res.data.videos || [];
      if (!videos.length) {
        toast.error("No videos found in playlist");
        setFetchingPlaylist(false);
        return;
      }
      const weeks = parseInt(form.durationWeeks, 10) || 1;
      const perWeek = Math.ceil(videos.length / weeks);
      const modules = [];
      for (let i = 0; i < weeks; i++) {
        const weekVideos = videos.slice(i * perWeek, (i + 1) * perWeek);
        modules.push({
          title: `Week ${i + 1}`,
          content: '',
          resources: [],
          pdfs: [],
          lessons: weekVideos.map(video => ({
            title: video.title,
            videoUrl: video.videoUrl,
            timestamp: ''
          }))
        });
      }
      setForm(f => ({
        ...f,
        modules
      }));
      toast.success("Playlist fetched and modules/lessons pre-filled! You can edit them as needed.");
    } catch (err) {
      toast.error("Failed to fetch playlist");
    } finally {
      setFetchingPlaylist(false);
    }
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
            <h4 className="font-semibold mb-2">Week {idx + 1}</h4>
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
          <input
            placeholder="Module Title"
            className="border p-2 mb-2 w-full"
            value={mod.title}
            onChange={e => handleModuleChange(idx, 'title', e.target.value)}
          />
          <textarea
            placeholder="Module Content"
            className="border p-2 mb-2 w-full"
            value={mod.content}
            onChange={e => handleModuleChange(idx, 'content', e.target.value)}
          />
          {/* Removed Module Video URL input */}
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
                      className="border p-1 text-xs w-1/2"
                      value={lesson.videoUrl}
                      placeholder="Lesson URL"
                      onChange={e => handleLessonChange(idx, lIdx, 'videoUrl', e.target.value)}
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
              </div>
            </div>
            <div className="mt-2">
              <h4 className="font-semibold">Modules:</h4>
              {c.modules?.map((m, i) => (
                <div key={i} className="ml-4 mb-2">
                  <p><strong>{m.title}</strong>: {m.content}</p>
                  {m.resources?.length > 0 && (
                    <ul className="list-disc ml-5 text-blue-600">
                      {m.resources.map((res, idx) => {
                        const isCloudinary = res?.url?.includes('cloudinary.com');
                        const finalURL = res?.url
                          ? isCloudinary
                            ? res.url.replace('/upload/', '/upload/fl_attachment:pdf/')
                            : res.url.startsWith('http') ? res.url : `http://${res.url}`
                          : '#';

                        const displayName = res?.name || (res?.url ? res.url.split('/').pop() : 'Unknown Resource');

                        return (
                          <li key={idx}>
                            <a
                              href={finalURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-blue-600"
                            >
                              {displayName}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {/* Edit Modal with scrollable content */}
      {editCourse && (
        <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
          <CourseEditModal
            course={editCourse}
            onClose={() => setEditCourse(null)}
            onSave={async (updatedData) => {
              await updateCourse(editCourse._id, updatedData);
              await loadCourses();
              setEditCourse(null);
            }}
          />
        </div>
      )}
    </div>    
  );
};

export default CourseManager;