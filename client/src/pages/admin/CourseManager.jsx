import React, { useState, useEffect } from 'react';
import { fetchCourses, createCourse, deleteCourse } from '../../services/api';

const CourseManager = () => {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    durationWeeks: '',
    modules: [
      { title: '', content: '', resources: [''] }
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
    const payload = {
      ...form,
      durationWeeks: parseInt(form.durationWeeks, 10),
    };
    await createCourse(payload);
    loadCourses();
    setForm({
      title: '',
      description: '',
      durationWeeks: '',
      modules: [{ title: '', content: '', resources: [''] }]
    });
  };

  const handleModuleChange = (index, key, value) => {
    const newModules = [...form.modules];
    newModules[index][key] = value;
    setForm({ ...form, modules: newModules });
  };

  const handleResourceChange = (moduleIdx, resIdx, value) => {
    const updatedModules = [...form.modules];
    updatedModules[moduleIdx].resources[resIdx] = value;
    setForm({ ...form, modules: updatedModules });
  };

  const addModule = () => {
    setForm({
      ...form,
      modules: [...form.modules, { title: '', content: '', resources: [''] }]
    });
  };

  const removeModule = (idx) => {
    const updatedModules = form.modules.filter((_, i) => i !== idx);
    setForm({ ...form, modules: updatedModules });
  };

  const addResource = (moduleIdx) => {
    const updatedModules = [...form.modules];
    updatedModules[moduleIdx].resources.push('');
    setForm({ ...form, modules: updatedModules });
  };

  const removeResource = (moduleIdx, resIdx) => {
    const updatedModules = [...form.modules];
    updatedModules[moduleIdx].resources = updatedModules[moduleIdx].resources.filter((_, i) => i !== resIdx);
    setForm({ ...form, modules: updatedModules });
  };

 const handleDelete = async (id) => {
  const confirm = window.confirm("Are you sure you want to delete this course?");
  if (!confirm) return;

  await deleteCourse(id);
  loadCourses();
};


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
                <input placeholder="Resource URL" className="border p-2 w-full"
                  value={res}
                  onChange={e => handleResourceChange(idx, rIdx, e.target.value)} />
                {mod.resources.length > 1 && (
                  <button onClick={() => removeResource(idx, rIdx)} className="text-red-600 text-sm">✕</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => addResource(idx)} className="text-sm text-blue-600 mt-2">+ Add Resource</button>
        </div>
      ))}

      <button onClick={addModule} className="text-sm text-green-600 mb-4">+ Add Module</button>
      <br />
      <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">Add Course</button>

      <ul className="mt-6 space-y-4">
        {courses.map(c => (
          <li key={c._id} className="border p-4 rounded bg-gray-50">
            <div className="flex justify-between">
              <div>
                <h3 className="font-bold text-lg">{c.title}</h3>
                <p className="text-sm text-gray-600">{c.description}</p>
                <p className="text-xs text-gray-500">Duration: {c.durationWeeks} weeks</p>
              </div>
              <button onClick={() => handleDelete(c._id)} className="text-red-600 font-semibold">Delete</button>
            </div>
            <div className="mt-2">
              <h4 className="font-semibold">Modules:</h4>
              {c.modules?.map((m, i) => (
                <div key={i} className="ml-4 mb-2">
                  <p><strong>{m.title}</strong>: {m.content}</p>
                  {m.resources?.length > 0 && (
                    <ul className="list-disc ml-5 text-blue-600">
                      {m.resources.map((link, idx) => (
                        <li key={idx}>
                          <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseManager;
