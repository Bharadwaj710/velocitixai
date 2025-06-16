// src/components/CourseEditModal.jsx
import React, { useState } from 'react';

const CourseEditModal = ({ course, onClose, onSave }) => {
  const [editedCourse, setEditedCourse] = useState({
    ...course,
    durationWeeks: course.durationWeeks || '',
    modules: course.modules?.length
      ? course.modules.map(mod => ({ ...mod }))
      : [{ title: '', content: '', resources: [''] }]
  });

  const handleModuleChange = (index, key, value) => {
    const updated = [...editedCourse.modules];
    updated[index][key] = value;
    setEditedCourse({ ...editedCourse, modules: updated });
  };

  const handleResourceChange = (modIdx, resIdx, value) => {
    const updated = [...editedCourse.modules];
    updated[modIdx].resources[resIdx] = value;
    setEditedCourse({ ...editedCourse, modules: updated });
  };

  const addModule = () => {
    setEditedCourse({
      ...editedCourse,
      modules: [...editedCourse.modules, { title: '', content: '', resources: [''] }]
    });
  };

  const removeModule = (idx) => {
    const updated = editedCourse.modules.filter((_, i) => i !== idx);
    setEditedCourse({ ...editedCourse, modules: updated });
  };

  const addResource = (modIdx) => {
    const updated = [...editedCourse.modules];
    updated[modIdx].resources.push('');
    setEditedCourse({ ...editedCourse, modules: updated });
  };

  const removeResource = (modIdx, resIdx) => {
    const updated = [...editedCourse.modules];
    updated[modIdx].resources = updated[modIdx].resources.filter((_, i) => i !== resIdx);
    setEditedCourse({ ...editedCourse, modules: updated });
  };

  const handleSave = () => {
    const payload = {
      ...editedCourse,
      durationWeeks: parseInt(editedCourse.durationWeeks, 10)
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-3xl w-full relative">
        <button onClick={onClose} className="absolute top-3 right-5 text-gray-500 hover:text-gray-800">&times;</button>
        <h3 className="text-lg font-semibold mb-4">Edit Course</h3>

        <input
          className="border p-2 w-full mb-2"
          value={editedCourse.title}
          placeholder="Course Title"
          onChange={e => setEditedCourse({ ...editedCourse, title: e.target.value })}
        />
        <input
          className="border p-2 w-full mb-2"
          value={editedCourse.description}
          placeholder="Description"
          onChange={e => setEditedCourse({ ...editedCourse, description: e.target.value })}
        />
        <input
          className="border p-2 w-full mb-4"
          value={editedCourse.durationWeeks}
          placeholder="Duration (weeks)"
          onChange={e => setEditedCourse({ ...editedCourse, durationWeeks: e.target.value })}
        />

        {editedCourse.modules.map((mod, idx) => (
          <div key={idx} className="mb-4 border p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Module {idx + 1}</h4>
              {editedCourse.modules.length > 1 && (
                <button onClick={() => removeModule(idx)} className="text-sm text-red-600">Remove</button>
              )}
            </div>
            <input
              className="border p-2 w-full mb-2"
              value={mod.title}
              placeholder="Module Title"
              onChange={e => handleModuleChange(idx, 'title', e.target.value)}
            />
            <textarea
              className="border p-2 w-full mb-2"
              value={mod.content}
              placeholder="Module Content"
              onChange={e => handleModuleChange(idx, 'content', e.target.value)}
            />
            {mod.resources.map((r, rIdx) => (
              <div key={rIdx} className="flex gap-2 mb-1">
                <input
                  className="border p-2 w-full"
                  value={r}
                  placeholder="Resource URL"
                  onChange={e => handleResourceChange(idx, rIdx, e.target.value)}
                />
                {mod.resources.length > 1 && (
                  <button onClick={() => removeResource(idx, rIdx)} className="text-red-600">✕</button>
                )}
              </div>
            ))}
            <button onClick={() => addResource(idx)} className="text-blue-600 text-sm mt-1">+ Add Resource</button>
          </div>
        ))}

        <button onClick={addModule} className="text-green-600 text-sm mb-4">+ Add Module</button>

        <div className="text-right">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseEditModal;
