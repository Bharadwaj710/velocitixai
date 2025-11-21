import { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getProgressColor = (percent) => {
  if (percent < 40) return "bg-red-500";
  if (percent < 70) return "bg-yellow-400";
  return "bg-green-500";
};

const Student = () => {
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filters, setFilters] = useState({ courses: [], colleges: [] });
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const studentRes = await apiClient.get("/admin/students");
        setStudents(studentRes.data);

        const filterRes = await apiClient.get("/admin/students/filters");
        setFilters(filterRes.data || { courses: [], colleges: [] });
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    load();
  }, []);

  const safeStudents = Array.isArray(students) ? students : [];

  const filtered = safeStudents.filter(
    (std) =>
      (std.name?.toLowerCase().includes(filter.toLowerCase()) ||
        std.college?.toLowerCase().includes(filter.toLowerCase())) &&
      (!selectedCourse || std.courseIds?.includes(selectedCourse)) &&
      (!selectedCollege || std.college === selectedCollege)
  );

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">
        Student Directory
      </h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by name or college"
          className="border border-gray-300 p-2 rounded-md shadow-sm w-full md:w-1/3"
        />
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="border border-gray-300 p-2 rounded-md shadow-sm"
        >
          <option value="">All Courses</option>
          {filters.courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
        <select
          value={selectedCollege}
          onChange={(e) => setSelectedCollege(e.target.value)}
          className="border border-gray-300 p-2 rounded-md shadow-sm"
        >
          <option value="">All Colleges</option>
          {filters.colleges.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg shadow border bg-white">
        <table className="min-w-full table-auto text-sm text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left font-semibold">Name</th>
              <th className="p-3 text-left font-semibold">Email</th>
              <th className="p-3 text-left font-semibold">College</th>
              <th className="p-3 text-left font-semibold">Scorecard</th>
              <th className="p-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-gray-400 p-6">
                  No students found
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50 border-t">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3">{s.email}</td>
                  <td className="p-3">{s.college || "Not updated"}</td>
                  <td className="p-3">{s.scorecard || "Not updated"}</td>
                  <td className="p-3">
                    <button
                      onClick={async () => {
                        try {
                          const res = await apiClient.get(
                            `/admin/student/${s._id}`
                          );

                          if (
                            !res.data?.student ||
                            Object.keys(res.data.student).length === 0
                          ) {
                            toast.error(
                              "This student has not updated their details yet."
                            );
                            return;
                          }

                          setSelectedStudent({
                            ...res.data.student,
                            courseProgressMap: res.data.courseProgressMap,
                          });
                        } catch (err) {
                          console.error(
                            "Failed to fetch student details:",
                            err
                          );
                          toast.error(
                            "Failed to fetch details. Please try again."
                          );
                        }
                      }}
                      className="px-4 py-1 bg-blue-600 text-white text-sm rounded-md shadow hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-700"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-4 text-blue-700">
              Student Details
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Name:</strong> {selectedStudent.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedStudent.email}
              </p>
              <p>
                <strong>College:</strong> {selectedStudent.college}
              </p>
              <p>
                <strong>Branch:</strong> {selectedStudent.branch}
              </p>
              <p>
                <strong>Year:</strong> {selectedStudent.yearOfStudy}
              </p>
              <p>
                <strong>Phone:</strong> {selectedStudent.phoneNumber}
              </p>
              <p>
                <strong>Domain:</strong> {selectedStudent.domain || "N/A"}
              </p>
              <p>
                <strong>Skills:</strong>{" "}
                {selectedStudent.skills?.length > 0
                  ? selectedStudent.skills.join(", ")
                  : "Not added"}
              </p>
            </div>
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-3 text-gray-800">
                Enrolled Courses
              </h4>
              {selectedStudent.course?.length > 0 ? (
                selectedStudent.course.map((course) => {
                  const progress =
                    selectedStudent.courseProgressMap?.[course._id] || 0;
                  return (
                    <div key={course._id} className="mb-4">
                      <div className="font-semibold text-gray-800 mb-1">
                        {course.title}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(
                            progress
                          )}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-right text-gray-500 mt-1">
                        {progress}% completed
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">No courses enrolled.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Student;
