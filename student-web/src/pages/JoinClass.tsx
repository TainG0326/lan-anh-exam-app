import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinClassByCode } from '../services/classService';
import toast from 'react-hot-toast';
import { Users, Key, Sparkles } from 'lucide-react';

export default function JoinClass() {
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      toast.error('Please enter a class code');
      return;
    }

    setLoading(true);
    try {
      const response = await joinClassByCode(classCode.toUpperCase());
      if (response.success) {
        toast.success(response.message || 'Successfully joined class!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid class code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Join Class</h2>
                <p className="text-emerald-50 mt-1">Connect to your class</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-8">
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <Key className="w-10 h-10 text-emerald-600" />
                </div>
              </div>
            <p className="text-center text-gray-600 mb-2">
              Enter the class code provided by your teacher
            </p>
            <p className="text-center text-sm text-gray-500">
              Class codes are usually 6 characters (e.g., ABC123)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Class Code
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Key className="w-5 h-5 text-emerald-500" />
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 text-lg font-mono text-center border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="ABC123"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={10}
                  required
                  autoFocus
                />
              </div>
              {classCode && (
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Class Code: <span className="font-mono font-bold text-emerald-600">{classCode}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !classCode.trim()}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Joining...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Join Class Now
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-sm text-emerald-800 text-center">
              💡 <strong>Tip:</strong> Class codes are usually shared by teachers via email or in class
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
