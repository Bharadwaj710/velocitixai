import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const CourseEditModal = ({ course, onClose, onSave }) => {
  const [editedCourse, setEditedCourse] = useState({
    ...course,
    durationWeeks: course.durationWeeks || '',
    modules: course.modules.map(mod => ({
      ...mod,
// Frontend
      //resources: mod.resources || [],
     // pdfs: []
//=======
      lessons: mod.lessons || [],
      pdfs: [] // for future use
    }))
  });

  // Add ref for scrollable content
  const modalContentRef = useRef(null);

  // Optional: Scroll to top when modal opens
  useEffect(() => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, []);

  const handleModuleChange = (idx, key, value) => {
    const updated = [...editedCourse.modules];
    updated[idx][key] = value;
    setEditedCourse({ ...editedCourse, modules: updated });
  };

  const handleLessonChange = (modIdx, lessonIdx, field, value) => {
    const updated = [...editedCourse.modules];
    updated[modIdx].lessons[lessonIdx][field] = value;
    setEditedCourse({ ...editedCourse, modules: updated });
  };

  const addModule = () => {
    setEditedCourse({
      ...editedCourse,
      modules: [...editedCourse.modules, { title: '', content: '', lessons: [], pdfs: [] }]
    });
  };

  const removeModule = (idx) => {
    const updated = editedCourse.modules.filter((_, i) => i !== idx);
    setEditedCourse({ ...editedCourse, modules: updated });
  };

  const addLesson = (modIdx) => {
    const updated = [...editedCourse.modules];
    updated[modIdx].lessons.push({ title: '', videoUrl: '', duration: '' });
    setEditedCourse({ ...editedCourse, modules: updated });
  };

  const removeLesson = (modIdx, lessonIdx) => {
    const updated = [...editedCourse.modules];
    updated[modIdx].lessons = updated[modIdx].lessons.filter((_, i) => i !== lessonIdx);
    setEditedCourse({ ...editedCourse, modules: updated });
  };

  const handleSave = async () => {
    const newModules = [...editedCourse.modules];

    const payload = {
      ...editedCourse,
      durationWeeks: parseInt(editedCourse.durationWeeks, 10),
      modules: newModules
    };

    try {
      await onSave(payload);
      toast.success('Course updated!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-white p-6 rounded-xl max-w-3xl w-full relative flex flex-col"
        style={{ maxHeight: "90vh", minHeight: "400px" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-5 text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>
        <h3 className="text-lg font-semibold mb-4">Edit Course</h3>
        {/* Scrollable content */}
        <div
          ref={modalContentRef}
          className="flex-1 overflow-y-auto pr-2"
          style={{ minHeight: "200px", maxHeight: "60vh" }}
        >
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

              {mod.resources.map((res, rIdx) => {
                const isCloudinaryPDF = res.name?.toLowerCase().endsWith('.pdf');
                return (
                  <div key={rIdx} className="flex items-center gap-2 mb-1">
                    {!isCloudinaryPDF ? (
                      <>
                        <input
                          className="border p-2 w-full"
                          value={res.url}
                          placeholder="Resource URL"
                          onChange={e => handleResourceChange(idx, rIdx, 'url', e.target.value)}
                        />
                        <button onClick={() => removeResource(idx, rIdx)} className="text-red-600">✕</button>
                      </>
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <p className="text-blue-700">📄 {res.name}</p>
                        <button onClick={() => removeResource(idx, rIdx)} className="text-red-600 text-sm">✕</button>
                      </div>
                    )}
                  </div>
                );
              })}

              <button onClick={() => addResource(idx)} className="text-blue-600 text-sm mt-1">+ Add Resource</button>

              <input
                type="file"
                accept="application/pdf"
                className="mt-2"
                onChange={e => handlePDFUpload(idx, e.target.files[0])}
              />

            </div>
          ))}

          <button onClick={addModule} className="text-green-600 text-sm mb-4">+ Add Module</button>
        </div>
        {/* Save button always visible at bottom */}
        <div className="text-right mt-4">

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
