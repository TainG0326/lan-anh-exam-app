import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExam } from '../services/examService';
import { getClasses, Class } from '../services/classService';
import { parseFile } from '../services/questionParserService';
import { Plus, Trash2, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function CreateExam() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    startTime: '',
    endTime: '',
    duration: 60,
    shuffleQuestions: false,
    shuffleOptions: false,
    requireWebcam: false,
  });
  const [questions, setQuestions] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    type: 'multiple-choice' as 'multiple-choice' | 'fill-blank' | 'reading-comprehension',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
    explanation: '',
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await getClasses();
      setClasses(data);
    } catch (error: any) {
      toast.error('Failed to load classes');
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.question) {
      toast.error('Please enter a question');
      return;
    }

    if (currentQuestion.type === 'multiple-choice' && !currentQuestion.correctAnswer) {
      toast.error('Please select the correct answer');
      return;
    }

    setQuestions([...questions, { ...currentQuestion }]);
    setCurrentQuestion({
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      explanation: '',
    });
    toast.success('Question added');
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.docx')) {
      toast.error('Only .txt or .docx files are accepted');
      return;
    }

    setUploading(true);
    try {
      const result = await parseFile(file);
      if (result.questions && result.questions.length > 0) {
        // Add parsed questions to existing questions
        setQuestions([...questions, ...result.questions]);
        toast.success(`Added ${result.count} questions from file!`);
      } else {
        toast.error('No questions found in file');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to parse file');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    setLoading(true);
    try {
      await createExam({
        ...formData,
        questions,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });
      toast.success('Exam created successfully!');
      navigate('/exams');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Exam</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">Set up an online exam with anti-cheating features</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              >
                <option value="">Select a class</option>
                {classes.map((classItem) => (
                  <option key={classItem.id || classItem._id} value={classItem.id || classItem._id}>
                    {classItem.name} - {classItem.grade} Grade {classItem.level}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Settings</h2>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={formData.shuffleQuestions}
                onChange={(e) =>
                  setFormData({ ...formData, shuffleQuestions: e.target.checked })
                }
              />
              <span className="ml-2 text-sm text-gray-700">Shuffle questions</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={formData.shuffleOptions}
                onChange={(e) =>
                  setFormData({ ...formData, shuffleOptions: e.target.checked })
                }
              />
              <span className="ml-2 text-sm text-gray-700">Shuffle options</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={formData.requireWebcam}
                onChange={(e) =>
                  setFormData({ ...formData, requireWebcam: e.target.checked })
                }
              />
              <span className="ml-2 text-sm text-gray-700">Require webcam</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">
              Questions ({questions.length})
            </h2>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{uploading ? 'Processing...' : 'Upload file'}</span>
                <span className="sm:hidden">{uploading ? '...' : 'Upload'}</span>
                <input
                  type="file"
                  accept=".txt,.docx"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {questions.length === 0 && (
            <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                No questions yet. Add questions manually or upload a file.
              </p>
              <p className="text-xs text-gray-500">
                File format: Question 1: Question text?<br />
                A. Option A<br />
                B. Option B<br />
                C. Option C<br />
                D. Option D<br />
                Answer: A
              </p>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4 mb-4 border p-3 sm:p-4 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
                value={currentQuestion.question}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, question: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={currentQuestion.type}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    type: e.target.value as any,
                  })
                }
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="fill-blank">Fill in the Blank</option>
                <option value="reading-comprehension">Reading Comprehension</option>
              </select>
            </div>
            {currentQuestion.type === 'multiple-choice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options
                </label>
                {currentQuestion.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center mb-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={idx}
                      checked={currentQuestion.correctAnswer === idx.toString()}
                      onChange={() =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          correctAnswer: idx.toString(),
                        })
                      }
                      className="mr-2"
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...currentQuestion.options];
                        newOptions[idx] = e.target.value;
                        setCurrentQuestion({ ...currentQuestion, options: newOptions });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {currentQuestion.type === 'fill-blank' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correct Answer
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={currentQuestion.correctAnswer}
                  onChange={(e) =>
                    setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })
                  }
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={currentQuestion.points}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    points: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </button>
          </div>

          <div className="space-y-2">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    Question {idx + 1}: {q.question}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {q.type === 'multiple-choice' && `Answer: ${q.options[parseInt(q.correctAnswer)]}`}
                    {q.type === 'fill-blank' && `Answer: ${q.correctAnswer}`}
                    {' • '}
                    {q.points} points
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(idx)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3">
          <button
            type="button"
            onClick={() => navigate('/exams')}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Exam'}
          </button>
        </div>
      </form>
    </div>
  );
}
