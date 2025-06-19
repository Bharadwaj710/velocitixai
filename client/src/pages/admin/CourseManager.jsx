import React, { useState, useEffect,useRef } from 'react';
import axios from 'axios';
import { fetchCourses, createCourse, deleteCourse, updateCourse } from '../../services/api';
import CourseEditModal from './CourseEditModal';
import { toast } from 'react-toastify';

const CourseManager = () => {
  const [courses, setCourses] = useState([]);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    durationWeeks: '',
    modules: [
      { title: '', content: '', resources: [], pdfs: [] }
    ]
  });

  const loadCourses = async () => {
    const res = await fetchCourses();
    setCourses(res.data);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.durationWeeks) {
      toast.error("Title, Description, and Duration are required.");
      return;
    }

    for (let i = 0; i < form.modules.length; i++) {
      const mod = form.modules[i];
      if (!mod.title || !mod.content) {
        toast.error(`Module ${i + 1}: Title and Content are required.`);
        return;
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
        delete module.pdfs; // Remove temp files before saving
      }

      const payload = {
        ...form,
        durationWeeks: parseInt(form.durationWeeks, 10),
        modules: newModules,
      };

      await createCourse(payload);
      toast.success('Course created!');
      loadCourses();
      setForm({
        title: '',
        description: '',
        durationWeeks: '',
        modules: [{ title: '', content: '', resources: [], pdfs: [] }]
      });
    } catch (err) {
      toast.error("Failed to create course");
      console.error(err);
    }
  };

  const handleModuleChange = (index, key, value) => {
    const updated = [...form.modules];
    updated[index][key] = value;
    setForm({ ...form, modules: updated });
  };

  const handleResourceChange = (modIdx, resIdx, value) => {
    const updated = [...form.modules];
    updated[modIdx].resources[resIdx] = {
      url: value,
      name: value.split('/').pop()
    };
    setForm({ ...form, modules: updated });
  };

  const handlePDFUpload = (modIdx, file) => {
    const updated = [...form.modules];
    updated[modIdx].pdfs = [...(updated[modIdx].pdfs || []), file];
    setForm({ ...form, modules: updated });
  };
const removePDF = (modIdx, pdfIdx) => {
  const updated = [...form.modules];
  updated[modIdx].pdfs.splice(pdfIdx, 1);
  setForm({ ...form, modules: updated });

  // ✅ Clear the input field visually
  if (fileInputRefs.current[modIdx]) {
    fileInputRefs.current[modIdx].value = '';
  }
};




  const addModule = () => {
    setForm({
      ...form,
      modules: [...form.modules, { title: '', content: '', resources: [], pdfs: [] }]
    });
  };

  const addResource = (modIdx) => {
    const updated = [...form.modules];
    updated[modIdx].resources.push({ url: '', name: '' });
    setForm({ ...form, modules: updated });
  };

  const removeModule = (idx) => {
    const updated = form.modules.filter((_, i) => i !== idx);
    setForm({ ...form, modules: updated });
  };

  const removeResource = (modIdx, resIdx) => {
    const updated = [...form.modules];
    updated[modIdx].resources = updated[modIdx].resources.filter((_, i) => i !== resIdx);
    setForm({ ...form, modules: updated });
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this course?");
    if (!confirm) return;
    await deleteCourse(id);
    loadCourses();
  };
const fileInputRefs = useRef([]);

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Manage Courses</h2>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <input placeholder="Title" className="border p-2" value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Description" className="border p-2" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Duration (weeks)" className="border p-2" value={form.durationWeeks}
          onChange={e => setForm({ ...form, durationWeeks: e.target.value })} />
      </div>

      {form.modules.map((mod, idx) => (
        <div key={idx} className="mb-4 p-3 border rounded bg-gray-50">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold mb-2">Module {idx + 1}</h4>
            {form.modules.length > 1 && (
              <button onClick={() => removeModule(idx)} className="text-red-600 text-sm">Remove Module</button>
            )}
          </div>
          <input placeholder="Module Title" className="border p-2 mb-2 w-full"
            value={mod.title}
            onChange={e => handleModuleChange(idx, 'title', e.target.value)} />
          <textarea placeholder="Module Content" className="border p-2 mb-2 w-full"
            value={mod.content}
            onChange={e => handleModuleChange(idx, 'content', e.target.value)} />

          <div className="space-y-2">
            {mod.resources.map((res, rIdx) => (
              <div key={rIdx} className="flex gap-2">
                <input
                  placeholder="Resource URL"
                  className="border p-2 w-full"
                  value={res.url || ''}
                  onChange={e => handleResourceChange(idx, rIdx, e.target.value)}
                />
                <button onClick={() => removeResource(idx, rIdx)} className="text-red-600 text-sm">✕</button>
              </div>
            ))}
          </div>

        <input
  type="file"
  accept="application/pdf"
  className="mt-2"
  ref={el => (fileInputRefs.current[idx] = el)}
  onChange={e => handlePDFUpload(idx, e.target.files[0])}
/>


          {mod.pdfs?.map((file, i) => (
  <div key={i} className="flex items-center justify-between text-sm text-gray-600 mt-1">
    <span>📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
    <button
      className="text-red-600 ml-2 text-xs"
      onClick={() => removePDF(idx, i)}
    >
      Remove
    </button>
  </div>
))}


          <button onClick={() => addResource(idx)} className="text-sm text-blue-600 mt-2">+ Add Resource</button>
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

      {editCourse && (
     <CourseEditModal
  course={editCourse}
  onClose={() => setEditCourse(null)}
  onSave={async (updatedData) => {
    await updateCourse(editCourse._id, updatedData);
    await loadCourses(); // ✅ reload course list
    setEditCourse(null); // ✅ close modal
  }}
/>

      )}
    </div>
  );
};

export default CourseManager;
