import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  fetchCourses,
  createCourse,
  deleteCourse,
  updateCourse,
} from "../../services/api";
import CourseEditModal from "./CourseEditModal";
import { toast } from "react-toastify";

const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Proficient"];
const DOMAIN_OPTIONS = [
  "Technology and Innovation",
  "Healthcare and Wellness",
  "Business and Finance",
  "Arts and Creativity",
  "Education and Social Services",
];

const SUGGEST_API_URL = "http://localhost:5001/suggest-course-metadata";

// Define the initial state for the form outside the component.
// This ensures we have a single source of truth for both initializing and resetting the form.
const initialFormState = {
  title: "",
  description: "",
  durationWeeks: 1, // Default to 1 week
  level: "Beginner",
  domain: "",
  idealRoles: [],
  skillsCovered: [],
  challengesAddressed: [],
  modules: [{ title: "", content: "", resources: [], pdfs: [], lessons: [] }],
};

const CourseManager = () => {
  const [courses, setCourses] = useState([]);
  const [editCourse, setEditCourse] = useState(null);
  const [formKey, setFormKey] = useState(0);
  // Initialize the form state using the constant defined above.
  const [form, setForm] = useState({ ...initialFormState }); // ensure a fresh copy

  const [inputFields, setInputFields] = useState({
    idealRole: "",
    skill: "",
    challenge: "",
  });

  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState({
    domain: "",
    idealRoles: [],
    skillsCovered: [],
    challengesAddressed: [],
  });

  const [removedSuggestions, setRemovedSuggestions] = useState({
    idealRoles: [],
    skillsCovered: [],
    challengesAddressed: [],
  });

  const fileInputRefs = useRef([]);
  const [pendingPdfs, setPendingPdfs] = useState({}); // { [modIdx-lessonIdx]: File }

  const [aiInterviewEnabled, setAiInterviewEnabled] = useState(false);

  // Load courses
  const loadCourses = async () => {
    const res = await fetchCourses();
    // Sort courses by _id in descending order to show most recent first
    // Assuming _id contains a timestamp component or is generally incremental
    const sortedCourses = res.data.sort((a, b) => b._id.localeCompare(a._id));
    setCourses(sortedCourses);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Auto-generate modules when durationWeeks changes
  useEffect(() => {
    const weeks = parseInt(form.durationWeeks, 10);
    if (!weeks || weeks < 1) return;
    setForm((f) => ({
      ...f,
      modules: Array.from({ length: weeks }, (_, i) => ({
        title: ``, // Keep title empty for user input
        content: "",
        resources: [],
        pdfs: [],
        lessons: [],
      })),
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
      [field]: Array.from(new Set([...(prev[field] || []), ...values])),
    }));
    setInputFields((prev) => ({ ...prev, [field.slice(0, -1)]: "" }));
  };

  const removeFromArrayField = (field, idx) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx),
    }));
  };

  // --- Main create handler ---
  const handleCreate = async () => {
    // 1. Create a temporary, mutable copy of the form data for this submission.
    // This avoids intermediate state updates and simplifies the logic.
    let submissionForm = JSON.parse(JSON.stringify(form));

    // 2. Merge any text remaining in the multi-value input fields into the submission data.
    const pendingFields = [
      { field: "idealRoles", key: "idealRole" },
      { field: "skillsCovered", key: "skill" },
      { field: "challengesAddressed", key: "challenge" },
    ];

    for (const { field, key } of pendingFields) {
      const values = (inputFields[key] || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      if (values.length) {
        submissionForm[field] = Array.from(
          new Set([...(submissionForm[field] || []), ...values])
        );
      }
    }

    // 3. Validate all required fields using the consolidated `submissionForm` object.
    const aiFields = ["idealRoles", "skillsCovered", "challengesAddressed"];
    for (const field of aiFields) {
      if (
        !Array.isArray(submissionForm[field]) ||
        submissionForm[field].length === 0
      ) {
        toast.error(
          "All AI fields (Roles, Skills, Challenges) are required and must have at least one value."
        );
        return;
      }
    }

    if (
      !submissionForm.title ||
      !submissionForm.description ||
      !submissionForm.durationWeeks ||
      !submissionForm.domain
    ) {
      toast.error("Title, Description, Duration, and Domain are required.");
      return;
    }

    if (!submissionForm.modules || submissionForm.modules.length === 0) {
      toast.error("At least one module is required.");
      return;
    }

    for (let i = 0; i < submissionForm.modules.length; i++) {
      const mod = submissionForm.modules[i];
      if (!mod.title) {
        toast.error(`Module ${i + 1}: Title is required.`);
        return;
      }

      if (!mod.lessons || mod.lessons.length === 0) {
        toast.error(`Module ${i + 1}: At least one lesson is required.`);
        return;
      }

      for (let j = 0; j < mod.lessons.length; j++) {
        const lesson = mod.lessons[j];
        if (!lesson.title) {
          toast.error(`Module ${i + 1}, Lesson ${j + 1}: Title is required.`);
          return;
        }
        if (!lesson.videoUrl) {
          toast.error(
            `Module ${i + 1}, Lesson ${j + 1}: Video URL is required.`
          );
          return;
        }
      }
    }

    try {
      // 4. Upload pending PDFs
      const pdfUploads = [];
      for (let modIdx = 0; modIdx < submissionForm.modules.length; modIdx++) {
        const mod = submissionForm.modules[modIdx];
        for (
          let lessonIdx = 0;
          lessonIdx < (mod.lessons?.length || 0);
          lessonIdx++
        ) {
          const pendingKey = `${modIdx}-${lessonIdx}`;
          if (pendingPdfs[pendingKey]) {
            const formData = new FormData();
            formData.append("pdf", pendingPdfs[pendingKey]);
            pdfUploads.push(
              axios
                .post(
                  `${process.env.REACT_APP_API_BASE_URL}/api/upload/pdf`,
                  formData
                )
                .then((res) => ({
                  modIdx,
                  lessonIdx,
                  name: res.data.name,
                  url: res.data.url,
                }))
            );
          }
        }
      }

      const uploadedPdfs = await Promise.all(pdfUploads);

      // 5. Add uploaded PDF data to the submission object
      const modulesWithPdfs = submissionForm.modules.map((mod, modIdx) => ({
        ...mod,
        lessons: (mod.lessons || []).map((lesson, lessonIdx) => {
          const found = uploadedPdfs.find(
            (pdf) => pdf.modIdx === modIdx && pdf.lessonIdx === lessonIdx
          );
          if (found) {
            return {
              ...lesson,
              resources: [
                ...(lesson.resources || []),
                { name: found.name, url: found.url },
              ],
            };
          }
          return lesson;
        }),
      }));

      // 6. Convert modules to the 'weeks' structure for the backend payload
      const weeks = modulesWithPdfs.map((mod, idx) => ({
        weekNumber: idx + 1,
        modules: [
          {
            title: mod.title,
            content: mod.content,
            lessons: mod.lessons,
            resources: mod.resources || [],
          },
        ],
      }));

      const payload = {
        ...submissionForm,
        durationWeeks: parseInt(submissionForm.durationWeeks, 10),
        weeks,
        aiInterviewEnabled,
      };
      delete payload.modules;

      await createCourse(payload);
      toast.success("Course created!");

      // 7. Notify Admin and show second toast
      await axios.post("/api/notifications", {
        type: "admin_course_add",
        message: `New course added: ${submissionForm.title}. Please generate quiz and transcript.`,
        forRole: "admin",
        userId: null,
      });
      toast.info(
        `Please generate quiz and transcript for "${submissionForm.title}".`
      ); // Second toast notification

      await loadCourses();

      // 8. RESET THE ENTIRE FORM AND ALL RELATED STATE
      setForm({ ...initialFormState }); // <-- ensure all fields are visually cleared
      setInputFields({
        idealRole: "",
        skill: "",
        challenge: "",
      });
      setPendingPdfs({});
      setSuggestionsLoaded(false);
      setSuggested({
        domain: "",
        idealRoles: [],
        skillsCovered: [],
        challengesAddressed: [],
      });
      setRemovedSuggestions({
        idealRoles: [],
        skillsCovered: [],
        challengesAddressed: [],
      });
      setFormKey((prev) => prev + 1); // force rerender if needed
    } catch (err) {
      toast.error(
        "Failed to create course. Please check the console for details."
      );
      console.error("Error creating course:", err);
    }
  };

  const handlePdfUpload = async (weekIdx, modIdx, lessonIdx, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("pdf", file);
    try {
      const API_BASE = `${process.env.REACT_APP_API_BASE_URL}`;
      const uploadRes = await axios.post(
        `${API_BASE}/api/upload/pdf`,
        formData
      );
      const { url, name } = uploadRes.data;

      setForm((prev) => {
        const updated = { ...prev };
        if (!Array.isArray(updated.modules)) updated.modules = [];
        if (
          !updated.modules[modIdx] ||
          !Array.isArray(updated.modules[modIdx].lessons)
        ) {
          return updated;
        }
        const lesson = updated.modules[modIdx].lessons[lessonIdx];
        if (!lesson) return updated;
        if (!lesson.resources) lesson.resources = [];
        lesson.resources.push({ name, url }); // Add the new PDF resource
        return updated;
      });

      toast.success("PDF uploaded and attached!");
    } catch (err) {
      toast.error("Failed to upload PDF");
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
      modules: [
        ...form.modules,
        {
          title: ``, // New modules start with empty title
          content: "",
          resources: [],
          pdfs: [],
          lessons: [],
        },
      ],
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
  const addLesson = (modIdx) => {
    setForm((f) => {
      const modules = [...f.modules];
      modules[modIdx].lessons = modules[modIdx].lessons || [];
      modules[modIdx].lessons.push({
        title: "",
        videoUrl: "",
        duration: "",
        resources: [],
      });
      return { ...f, modules };
    });
  };

  const removeLesson = (modIdx, lessonIdx) => {
    setForm((f) => {
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
    setForm((f) => {
      const modules = [...f.modules];
      modules[modIdx].lessons[lessonIdx][key] = value;
      return { ...f, modules };
    });
  };

  // --- AI Suggestion logic: Only allow suggestions to be loaded ONCE per course creation/reset ---
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  const handleSuggestMetadata = async () => {
    // If suggestions already loaded, do nothing
    if (suggestionsLoaded) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Enter course title and description first.");
      return;
    }
    setSuggesting(true);
    try {
      const res = await axios.post(SUGGEST_API_URL, {
        title: form.title,
        description: form.description,
      });
      const { domain, idealRoles, skillsCovered, challengesAddressed } =
        res.data || {};
      setSuggested({
        domain: domain || "",
        idealRoles: Array.isArray(idealRoles) ? idealRoles : [],
        skillsCovered: Array.isArray(skillsCovered) ? skillsCovered : [],
        challengesAddressed: Array.isArray(challengesAddressed)
          ? challengesAddressed
          : [],
      });
      setSuggestionsLoaded(true);
      toast.success(
        "Suggestions loaded! Click 'Add' beside each field to autofill."
      );
    } catch (err) {
      toast.error("Failed to fetch suggestions");
    } finally {
      setSuggesting(false);
    }
  };

  // --- Reset suggestionsLoaded when form is reset (after course creation) ---
  // This useEffect is now less critical as the reset is handled in handleCreate
  // but it can still serve as a fallback if title/description change for other reasons.
  useEffect(() => {
    // Only reset if title/description become empty, indicating a manual clear or initial state
    if (!form.title && !form.description) {
      setSuggestionsLoaded(false);
      setSuggested({
        domain: "",
        idealRoles: [],
        skillsCovered: [],
        challengesAddressed: [],
      });
      setRemovedSuggestions({
        idealRoles: [],
        skillsCovered: [],
        challengesAddressed: [],
      });
    }
  }, [form.title, form.description]);

  // --- Autofill handlers for each field (update text field with comma-separated string) ---
  const autofillField = (field) => {
    if (field === "domain") {
      if (suggested.domain) {
        setForm((f) => ({ ...f, domain: suggested.domain }));
      }
    } else if (field === "idealRoles") {
      if (suggested.idealRoles?.length) {
        const current = inputFields.idealRole
          ? inputFields.idealRole
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [];
        const alreadyInForm = form.idealRoles || [];
        const newSuggestions = suggested.idealRoles.filter(
          (s) => !current.includes(s) && !alreadyInForm.includes(s)
        );
        setInputFields((f) => ({
          ...f,
          idealRole: Array.from(new Set([...current, ...newSuggestions])).join(
            ", "
          ),
        }));
      }
    } else if (field === "skillsCovered") {
      if (suggested.skillsCovered?.length) {
        const current = inputFields.skill
          ? inputFields.skill
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [];
        const alreadyInForm = form.skillsCovered || [];
        const newSuggestions = suggested.skillsCovered.filter(
          (s) => !current.includes(s) && !alreadyInForm.includes(s)
        );
        setInputFields((f) => ({
          ...f,
          skill: Array.from(new Set([...current, ...newSuggestions])).join(
            ", "
          ),
        }));
      }
    } else if (field === "challengesAddressed") {
      if (suggested.challengesAddressed?.length) {
        const current = inputFields.challenge
          ? inputFields.challenge
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [];
        const alreadyInForm = form.challengesAddressed || [];
        const newSuggestions = suggested.challengesAddressed.filter(
          (s) => !current.includes(s) && !alreadyInForm.includes(s)
        );
        setInputFields((f) => ({
          ...f,
          challenge: Array.from(new Set([...current, ...newSuggestions])).join(
            ", "
          ),
        }));
      }
    }
  };

  // --- Add a single suggestion to the input field if not already present
  const addSuggestionToInput = (field, value) => {
    if (field === "idealRoles") {
      const current = inputFields.idealRole
        ? inputFields.idealRole
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        : [];
      const alreadyInForm = form.idealRoles || [];
      if (!current.includes(value) && !alreadyInForm.includes(value)) {
        setInputFields((f) => ({
          ...f,
          idealRole: current.length > 0 ? `${f.idealRole}, ${value}` : value,
        }));
      }
    } else if (field === "skillsCovered") {
      const current = inputFields.skill
        ? inputFields.skill
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        : [];
      const alreadyInForm = form.skillsCovered || [];
      if (!current.includes(value) && !alreadyInForm.includes(value)) {
        setInputFields((f) => ({
          ...f,
          skill: current.length > 0 ? `${f.skill}, ${value}` : value,
        }));
      }
    } else if (field === "challengesAddressed") {
      const current = inputFields.challenge
        ? inputFields.challenge
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        : [];
      const alreadyInForm = form.challengesAddressed || [];
      if (!current.includes(value) && !alreadyInForm.includes(value)) {
        setInputFields((f) => ({
          ...f,
          challenge: current.length > 0 ? `${f.challenge}, ${value}` : value,
        }));
      }
    }
  };

  // --- Remove a suggestion from the input field (for suggestions chips) ---
  // Only remove from the input field, do NOT remove from suggestions below.
  const removeSuggestionFromInput = (field, value) => {
    if (field === "idealRoles") {
      setInputFields((f) => ({
        ...f,
        idealRole: f.idealRole
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v && v !== value)
          .join(", "),
      }));
    } else if (field === "skillsCovered") {
      setInputFields((f) => ({
        ...f,
        skill: f.skill
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v && v !== value)
          .join(", "),
      }));
    } else if (field === "challengesAddressed") {
      setInputFields((f) => ({
        ...f,
        challenge: f.challenge
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v && v !== value)
          .join(", "),
      }));
    }
  };

  // --- Remove a suggestion from the suggested list (move to removed, not permanent delete) ---
  const removeSuggested = (field, value) => {
    setSuggested((prev) => {
      let updated = { ...prev };
      updated[field] = prev[field].filter((r) => r !== value);
      return updated;
    });
    setRemovedSuggestions((prev) => ({
      ...prev,
      [field]: [...prev[field], value],
    }));
  };

  // --- Restore a removed suggestion (move back to suggestions) ---
  const restoreSuggestion = (field, value) => {
    setRemovedSuggestions((prev) => ({
      ...prev,
      [field]: prev[field].filter((r) => r !== value),
    }));
    setSuggested((prev) => ({
      ...prev,
      [field]: [...prev[field], value],
    }));
  };

  // --- Add all comma-separated values from input field as chips/tags
  const addAllFromInput = (field) => {
    const key = field.slice(0, -1); // e.g. idealRoles -> idealRole
    const values = (inputFields[key] || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    if (!values.length) return;

    setForm((prev) => ({
      ...prev,
      [field]: Array.from(new Set([...(prev[field] || []), ...values])),
    }));

    setInputFields((prev) => ({ ...prev, [key]: "" }));
  };

  // --- Delete course handler ---
  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this course?"
    );
    if (!confirm) return;
    try {
      await deleteCourse(id);
      await loadCourses();
      toast.success("Course deleted!");
    } catch (err) {
      toast.error("Failed to delete course");
    }
  };

  const handlePdfSelect = (modIdx, lessonIdx, file) => {
    if (!file) return;
    setPendingPdfs((prev) => ({
      ...prev,
      [`${modIdx}-${lessonIdx}`]: file,
    }));
  };

  const handleRemovePendingPdf = (modIdx, lessonIdx) => {
    setPendingPdfs((prev) => {
      const updated = { ...prev };
      delete updated[`${modIdx}-${lessonIdx}`];
      return updated;
    });
  };

  return (
    <div key={formKey}>
      <div className="p-6 bg-white rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Manage Courses</h2>
        {/* ... The rest of the JSX remains the same ... */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <input
            placeholder="Title"
            className="border p-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            key={`title-${formKey}`}
          />
          <input
            placeholder="Description"
            className="border p-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            key={`desc-${formKey}`}
          />
          <input
            placeholder="Duration (weeks)"
            className="border p-2"
            value={form.durationWeeks}
            min={1}
            type="number"
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value) || 1);
              setForm({ ...form, durationWeeks: val });
            }}
            key={`duration-${formKey}`}
          />
          <select
            className="border p-2"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            key={`level-${formKey}`}
          >
            {LEVEL_OPTIONS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>
        {/* AI-required fields with autofill buttons and chips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Domain *</label>
            <div className="flex gap-2">
              <input
                className="border p-2 w-full"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                placeholder="e.g. Technology and Innovation"
              />
              <button
                type="button"
                className="bg-blue-500 text-white px-2 rounded"
                onClick={() => autofillField("domain")}
                disabled={!suggested.domain}
                title={
                  suggested.domain
                    ? `Use: ${suggested.domain}`
                    : "No suggestion"
                }
              >
                Add
              </button>
            </div>
            {suggested.domain && (
              <div className="flex flex-wrap gap-2 mt-1">
                <span
                  className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs cursor-pointer"
                  onClick={() =>
                    setForm((f) => ({ ...f, domain: suggested.domain }))
                  }
                >
                  {suggested.domain}
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Ideal Roles *
            </label>
            <div className="flex gap-2">
              <input
                className="border p-2 flex-1"
                placeholder="Add role(s), comma separated"
                value={inputFields.idealRole}
                onChange={(e) =>
                  setInputFields((f) => ({ ...f, idealRole: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAllFromInput("idealRoles");
                  }
                }}
              />
              <button
                type="button"
                className="bg-blue-500 text-white px-2 rounded"
                onClick={() => autofillField("idealRoles")}
                disabled={!suggested.idealRoles.length}
                title={
                  suggested.idealRoles.length
                    ? `Use: ${suggested.idealRoles.join(", ")}`
                    : "No suggestion"
                }
              >
                Add
              </button>
            </div>
            {/* Show chips for values in the input field, with (X) to remove from input only */}
            {inputFields.idealRole &&
              inputFields.idealRole
                .split(",")
                .filter(Boolean)
                .map((role, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs mr-2 mt-1"
                  >
                    {role.trim()}
                    <button
                      type="button"
                      className="ml-1 text-red-500"
                      onClick={() =>
                        removeSuggestionFromInput("idealRoles", role.trim())
                      }
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
            {/* Show suggestion chips below, always, unless already in input or chips */}
            {suggested.idealRoles && suggested.idealRoles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {[...new Set(suggested.idealRoles)]
                  .filter(
                    (role) =>
                      !(form.idealRoles || []).includes(role) &&
                      !(inputFields.idealRole || "")
                        .split(",")
                        .map((v) => v.trim())
                        .includes(role)
                  )
                  .map((role, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs cursor-pointer flex items-center"
                      onClick={() => addSuggestionToInput("idealRoles", role)}
                      title="Click to add"
                    >
                      {role}
                      <button
                        type="button"
                        className="ml-1 text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSuggested("idealRoles", role);
                        }}
                        title="Remove suggestion"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            )}
            {/* Divider if there are removed suggestions */}
            {removedSuggestions.idealRoles.length > 0 && (
              <hr className="my-2 border-t-2 border-dashed border-gray-300" />
            )}
            {/* Removed suggestions (can be restored) */}
            {removedSuggestions.idealRoles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {removedSuggestions.idealRoles.map((role, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-200 text-gray-500 px-2 py-1 rounded text-xs flex items-center cursor-pointer"
                    onClick={() => restoreSuggestion("idealRoles", role)}
                    title="Restore suggestion"
                  >
                    {role}
                    <button
                      type="button"
                      className="ml-1 text-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreSuggestion("idealRoles", role);
                      }}
                      title="Restore"
                    >
                      ↩
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-1">
              {form.idealRoles.map((role, idx) => (
                <span
                  key={idx}
                  className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs flex items-center"
                >
                  {role}
                  <button
                    type="button"
                    className="ml-1 text-red-500"
                    onClick={() => removeFromArrayField("idealRoles", idx)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Skills Covered *
            </label>
            <div className="flex gap-2">
              <input
                className="border p-2 flex-1"
                placeholder="Add skill(s), comma separated"
                value={inputFields.skill}
                onChange={(e) =>
                  setInputFields((f) => ({ ...f, skill: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAllFromInput("skillsCovered");
                  }
                }}
              />
              <button
                type="button"
                className="bg-blue-500 text-white px-2 rounded"
                onClick={() => autofillField("skillsCovered")}
                disabled={!suggested.skillsCovered.length}
                title={
                  suggested.skillsCovered.length
                    ? `Use: ${suggested.skillsCovered.join(", ")}`
                    : "No suggestion"
                }
              >
                Add
              </button>
            </div>
            {inputFields.skill &&
              inputFields.skill
                .split(",")
                .filter(Boolean)
                .map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center bg-green-100 text-green-700 px-2 py-1 rounded text-xs mr-2 mt-1"
                  >
                    {skill.trim()}
                    <button
                      type="button"
                      className="ml-1 text-red-500"
                      onClick={() =>
                        removeSuggestionFromInput("skillsCovered", skill.trim())
                      }
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
            {suggested.skillsCovered && suggested.skillsCovered.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {[...new Set(suggested.skillsCovered)]
                  .filter(
                    (skill) =>
                      !(form.skillsCovered || []).includes(skill) &&
                      !(inputFields.skill || "")
                        .split(",")
                        .map((v) => v.trim())
                        .includes(skill)
                  )
                  .map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs cursor-pointer flex items-center"
                      onClick={() =>
                        addSuggestionToInput("skillsCovered", skill)
                      }
                      title="Click to add"
                    >
                      {skill}
                      <button
                        type="button"
                        className="ml-1 text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSuggested("skillsCovered", skill);
                        }}
                        title="Remove suggestion"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            )}
            {/* Divider if there are removed suggestions */}
            {removedSuggestions.skillsCovered.length > 0 && (
              <hr className="my-2 border-t-2 border-dashed border-gray-300" />
            )}
            {/* Removed suggestions (can be restored) */}
            {removedSuggestions.skillsCovered.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {removedSuggestions.skillsCovered.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-200 text-gray-500 px-2 py-1 rounded text-xs flex items-center cursor-pointer"
                    onClick={() => restoreSuggestion("skillsCovered", skill)}
                    title="Restore suggestion"
                  >
                    {skill}
                    <button
                      type="button"
                      className="ml-1 text-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreSuggestion("skillsCovered", skill);
                      }}
                      title="Restore"
                    >
                      ↩
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-1">
              {form.skillsCovered.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs flex items-center"
                >
                  {skill}
                  <button
                    type="button"
                    className="ml-1 text-red-500"
                    onClick={() => removeFromArrayField("skillsCovered", idx)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Challenges Addressed *
            </label>
            <div className="flex gap-2">
              <input
                className="border p-2 flex-1"
                placeholder="Add challenge(s), comma separated"
                value={inputFields.challenge}
                onChange={(e) =>
                  setInputFields((f) => ({ ...f, challenge: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAllFromInput("challengesAddressed");
                  }
                }}
              />
              <button
                type="button"
                className="bg-blue-500 text-white px-2 rounded"
                onClick={() => autofillField("challengesAddressed")}
                disabled={!suggested.challengesAddressed.length}
                title={
                  suggested.challengesAddressed.length
                    ? `Use: ${suggested.challengesAddressed.join(", ")}`
                    : "No suggestion"
                }
              >
                Add
              </button>
            </div>
            {inputFields.challenge &&
              inputFields.challenge
                .split(",")
                .filter(Boolean)
                .map((ch, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs mr-2 mt-1"
                  >
                    {ch.trim()}
                    <button
                      type="button"
                      className="ml-1 text-red-500"
                      onClick={() =>
                        removeSuggestionFromInput(
                          "challengesAddressed",
                          ch.trim()
                        )
                      }
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
            {suggested.challengesAddressed &&
              suggested.challengesAddressed.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {[...new Set(suggested.challengesAddressed)]
                    .filter(
                      (ch) =>
                        !(form.challengesAddressed || []).includes(ch) &&
                        !(inputFields.challenge || "")
                          .split(",")
                          .map((v) => v.trim())
                          .includes(ch)
                    )
                    .map((ch, idx) => (
                      <span
                        key={idx}
                        className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs cursor-pointer flex items-center"
                        onClick={() =>
                          addSuggestionToInput("challengesAddressed", ch)
                        }
                        title="Click to add"
                      >
                        {ch}
                        <button
                          type="button"
                          className="ml-1 text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSuggested("challengesAddressed", ch);
                          }}
                          title="Remove suggestion"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}
            {/* Divider if there are removed suggestions */}
            {removedSuggestions.challengesAddressed.length > 0 && (
              <hr className="my-2 border-t-2 border-dashed border-gray-300" />
            )}
            {/* Removed suggestions (can be restored) */}
            {removedSuggestions.challengesAddressed.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {removedSuggestions.challengesAddressed.map((ch, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-200 text-gray-500 px-2 py-1 rounded text-xs flex items-center cursor-pointer"
                    onClick={() => restoreSuggestion("challengesAddressed", ch)}
                    title="Restore suggestion"
                  >
                    {ch}
                    <button
                      type="button"
                      className="ml-1 text-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreSuggestion("challengesAddressed", ch);
                      }}
                      title="Restore"
                    >
                      ↩
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-1">
              {form.challengesAddressed.map((ch, idx) => (
                <span
                  key={idx}
                  className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs flex items-center"
                >
                  {ch}
                  <button
                    type="button"
                    className="ml-1 text-red-500"
                    onClick={() =>
                      removeFromArrayField("challengesAddressed", idx)
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded mb-4"
          onClick={handleSuggestMetadata}
          disabled={suggesting || suggestionsLoaded}
        >
          {suggesting
            ? "Suggesting..."
            : suggestionsLoaded
            ? "Suggestions Loaded"
            : "Suggest Metadata"}
        </button>

        {/* Modules and Lessons */}
        {form.modules.map((mod, modIdx) => (
          <div key={modIdx} className="mb-4 p-3 border rounded bg-gray-50">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold mb-2">Week {modIdx + 1}</h4>
              <div className="flex gap-2">
                {modIdx > 0 && (
                  <button
                    className="text-xs text-gray-500"
                    onClick={() => moveModule(modIdx, modIdx - 1)}
                  >
                    ↑
                  </button>
                )}
                {modIdx < form.modules.length - 1 && (
                  <button
                    className="text-xs text-gray-500"
                    onClick={() => moveModule(modIdx, modIdx + 1)}
                  >
                    ↓
                  </button>
                )}
                {form.modules.length > 1 && (
                  <button
                    onClick={() => removeModule(modIdx)}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <input
              placeholder="Module Title"
              className="border p-2 mb-2 w-full"
              value={mod.title}
              onChange={(e) =>
                handleModuleChange(modIdx, "title", e.target.value)
              }
            />
            <textarea
              placeholder="Module Content"
              className="border p-2 mb-2 w-full"
              value={mod.content}
              onChange={(e) =>
                handleModuleChange(modIdx, "content", e.target.value)
              }
            />
            {/* Lessons */}
            <div className="mt-2">
              <h5 className="font-semibold mb-1 text-blue-700">Lessons:</h5>
              {mod.lessons && mod.lessons.length > 0 ? (
                <ul className="space-y-2">
                  {mod.lessons.map((lesson, lessonIdx) => (
                    <li
                      key={lessonIdx}
                      className="flex flex-col md:flex-row items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2"
                    >
                      {/* PDF select (not upload) */}
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="application/pdf"
                          id={`pdf-input-${modIdx}-${lessonIdx}`}
                          className="hidden" // ✅ This hides the native file input
                          onChange={(e) =>
                            handlePdfSelect(
                              modIdx,
                              lessonIdx,
                              e.target.files[0]
                            )
                          }
                        />
                        {/* Custom Upload Button */}
                        <label
                          htmlFor={`pdf-input-${modIdx}-${lessonIdx}`}
                          className="bg-blue-600 text-white text-xs px-2 py-1 rounded cursor-pointer hover:bg-blue-700 whitespace-nowrap"
                        >
                          Upload PDF
                        </label>
                      </div>

                      {/* Show selected (pending) PDF with remove button */}
                      {pendingPdfs[`${modIdx}-${lessonIdx}`] && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-blue-700">
                            {pendingPdfs[`${modIdx}-${lessonIdx}`].name}
                          </span>
                          <button
                            className="text-xs text-red-500"
                            onClick={() =>
                              handleRemovePendingPdf(modIdx, lessonIdx)
                            }
                            title="Remove PDF"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      {/* Show already attached PDFs (if any, e.g. after edit) */}
                      {lesson.resources && lesson.resources.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                          {lesson.resources.map((pdf, pdfIdx) => {
                            const isCloudinary =
                              pdf?.url?.includes("cloudinary.com");
                            const finalURL = pdf?.url
                              ? isCloudinary
                                ? pdf.url.replace(
                                    "/upload/",
                                    "/upload/fl_attachment:pdf/"
                                  )
                                : pdf.url.startsWith("http")
                                ? pdf.url
                                : `http://${pdf.url}`
                              : "#";

                            const displayName =
                              pdf?.name ||
                              (pdf?.url
                                ? pdf.url.split("/").pop()
                                : "Unknown Resource");

                            return (
                              <div
                                key={pdfIdx}
                                className="flex items-center gap-2"
                              >
                                <a
                                  href={finalURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline text-xs"
                                >
                                  {displayName}
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <input
                        className="border p-2 text-sm w-full md:w-1/2 font-semibold bg-white"
                        value={lesson.title}
                        placeholder="Lesson Title (required)"
                        onChange={(e) =>
                          handleLessonChange(
                            modIdx,
                            lessonIdx,
                            "title",
                            e.target.value
                          )
                        }
                        style={{ borderColor: "#3b82f6" }}
                      />
                      <input
                        className="border p-2 text-sm w-full md:w-1/2 font-mono bg-white"
                        value={lesson.videoUrl}
                        placeholder="Lesson Video URL (required)"
                        onChange={(e) =>
                          handleLessonChange(
                            modIdx,
                            lessonIdx,
                            "videoUrl",
                            e.target.value
                          )
                        }
                        style={{ borderColor: "#3b82f6" }}
                      />
                      <button
                        className="text-xs text-gray-500"
                        onClick={() =>
                          moveLesson(modIdx, lessonIdx, lessonIdx - 1)
                        }
                        disabled={lessonIdx === 0}
                      >
                        ↑
                      </button>
                      <button
                        className="text-xs text-gray-500"
                        onClick={() =>
                          moveLesson(modIdx, lessonIdx, lessonIdx + 1)
                        }
                        disabled={lessonIdx === mod.lessons.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        className="text-red-500 text-xs"
                        onClick={() => removeLesson(modIdx, lessonIdx)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-gray-500">No lessons.</div>
              )}
              <button
                className="text-blue-600 text-xs mt-1"
                onClick={() => addLesson(modIdx)}
              >
                + Add Lesson
              </button>
            </div>
          </div>
        ))}
        <button onClick={addModule} className="text-sm text-green-600 mb-4">
          + Add Module
        </button>
        <br />
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Course
        </button>

        {/* Existing course display */}
        <ul className="mt-6 space-y-4">
          {courses.map((c) => (
            <li
              key={c._id}
              className="border p-4 rounded-xl bg-gray-50 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-lg">{c.title}</h3>
                  <p className="text-sm text-gray-600">{c.description}</p>
                  <p className="text-xs text-gray-500">
                    Duration: {c.durationWeeks} weeks
                  </p>
                  {/* Show course level for all courses */}
                  <p className="text-xs text-blue-700 font-semibold mt-1">
                    Level: {c.level || "Beginner"}
                  </p>
                </div>
                <div className="space-x-4">
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="text-red-600 font-semibold"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setEditCourse(c)}
                    className="text-blue-600 font-semibold"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <h4 className="font-semibold">Modules:</h4>
                {/* Ensure c.weeks exists and is an array before mapping */}
                {c.weeks?.map((week, weekIdx) => (
                  <div key={weekIdx} className="ml-4 mb-2">
                    <p className="font-medium">Week {week.weekNumber}</p>
                    {week.modules?.map((mod, modIdx) => (
                      <div key={modIdx} className="ml-4">
                        <p>
                          <strong>{mod.title}</strong>: {mod.content}
                        </p>
                        {mod.resources?.length > 0 && (
                          <ul className="list-disc ml-5 text-blue-600">
                            {mod.resources.map((res, idx) => {
                              const isCloudinary =
                                res?.url?.includes("cloudinary.com");
                              const finalURL = res?.url
                                ? isCloudinary
                                  ? res.url.replace(
                                      "/upload/",
                                      "/upload/fl_attachment:pdf/"
                                    )
                                  : res.url.startsWith("http")
                                  ? res.url
                                  : `http://${res.url}`
                                : "#";

                              const displayName =
                                res?.name ||
                                (res?.url
                                  ? res.url.split("/").pop()
                                  : "Unknown Resource");

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
                        {mod.lessons?.length > 0 && (
                          <div className="mt-2">
                            <h5 className="font-semibold text-blue-700">
                              Lessons:
                            </h5>
                            <ul className="list-disc ml-5">
                              {mod.lessons.map((lesson, lessonIdx) => (
                                <li key={lessonIdx}>
                                  <p>
                                    <strong>{lesson.title}</strong>
                                    {lesson.videoUrl && (
                                      <span className="ml-2 text-sm text-gray-600">
                                        (Video:{" "}
                                        <a
                                          href={lesson.videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="underline"
                                        >
                                          Link
                                        </a>
                                        )
                                      </span>
                                    )}
                                  </p>
                                  {lesson.resources?.length > 0 && (
                                    <ul className="list-disc ml-5 text-blue-600">
                                      {lesson.resources.map((res, resIdx) => {
                                        const isCloudinary =
                                          res?.url?.includes("cloudinary.com");
                                        const finalURL = res?.url
                                          ? isCloudinary
                                            ? res.url.replace(
                                                "/upload/",
                                                "/upload/fl_attachment:pdf/"
                                              )
                                            : res.url.startsWith("http")
                                            ? res.url
                                            : `http://${res.url}`
                                          : "#";

                                        const displayName =
                                          res?.name ||
                                          (res?.url
                                            ? res.url.split("/").pop()
                                            : "Unknown Resource");
                                        return (
                                          <li key={resIdx}>
                                            <a
                                              href={finalURL}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="underline"
                                            >
                                              {displayName}
                                            </a>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
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
    </div>
  );
};

export default CourseManager;
